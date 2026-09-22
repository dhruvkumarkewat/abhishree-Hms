import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Clock, CheckCircle2 } from 'lucide-react';
import { get, post, put, todayISO, fmtTime } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Badge, Empty, LoadError, SectionHead, Avatar } from '../components/ui';

export default function OPD() {
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [dept, setDept] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const d = await get(`/api/appointments?date=${todayISO()}`);
      setRows(Array.isArray(d) ? d : []);
    } catch (e: any) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const depts = [...new Set(rows.map((r) => r.department).filter(Boolean))];
  const shown = rows.filter((r) => !dept || r.department === dept).sort((a, b) => (a.token_number || 0) - (b.token_number || 0));
  const nowServing = shown.find((r) => r.status === 'In consultation');
  const waiting = shown.filter((r) => ['Scheduled', 'Confirmed', 'Checked-in'].includes(r.status));

  const act = async (a: any, status: string) => {
    try {
      await put('/api/appointments', { id: a.id, status });
      await post('/api/audit', { user_name: user!.name, user_role: user!.role, action: `OPD: token ${a.token_number || a.id} (${a.patient?.name}) → ${status}`, module: 'OPD' });
      toast({ kind: 'success', title: `Token ${a.token_number || a.id} ${status.toLowerCase()}` });
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to update token', desc: e.message });
    }
  };

  return (
    <div>
      <SectionHead title="OPD queue" desc="Live token board for today's outpatient flow. Refreshes automatically."
        action={<select className="input !w-auto" value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="">All departments</option>
          {depts.map((d) => <option key={d}>{d}</option>)}
        </select>} />

      {/* now serving banner */}
      <div className="card p-5 mb-4 bg-gradient-to-r from-ink-900 to-ink-800 dark:from-sky-950 dark:to-sky-900 !text-white !border-0">
        <div className="flex flex-wrap items-center gap-5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.16em] opacity-60">Now serving</div>
            <div className="font-display text-5xl mt-1">{nowServing ? `Token ${nowServing.token_number || nowServing.id}` : '—'}</div>
          </div>
          {nowServing && (
            <div className="flex items-center gap-3">
              <Avatar name={nowServing.patient?.name} size={44} />
              <div>
                <div className="font-bold">{nowServing.patient?.name}</div>
                <div className="text-sm opacity-70">{nowServing.doctor?.name} · {nowServing.department}</div>
              </div>
            </div>
          )}
          <div className="ml-auto grid grid-cols-3 gap-6 text-center">
            <div><div className="text-2xl font-bold">{waiting.length}</div><div className="text-[11px] opacity-60 font-semibold">Waiting</div></div>
            <div><div className="text-2xl font-bold">{shown.filter((r) => r.status === 'Completed').length}</div><div className="text-[11px] opacity-60 font-semibold">Done</div></div>
            <div><div className="text-2xl font-bold">{shown.length}</div><div className="text-[11px] opacity-60 font-semibold">Total</div></div>
          </div>
        </div>
      </div>

      {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="card p-5"><div className="skeleton h-20" /></div>)}</div>
        : err ? <div className="card"><LoadError message={err} onRetry={load} /></div>
        : shown.length === 0 ? <div className="card"><Empty title="No OPD visits today" desc="Booked appointments for today appear on this board." /></div>
        : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {shown.map((a) => (
              <div key={a.id} className={`card p-4 ${a.status === 'In consultation' ? 'ring-2 ring-teal-400' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-ink-900 dark:bg-sky-800 text-white flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold opacity-60 leading-none">TOKEN</span>
                    <span className="text-lg font-bold leading-none mt-0.5">{a.token_number || a.id}</span>
                  </div>
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => nav(`/app/patients/${a.patient_id}`)}>
                    <div className="font-bold text-sm truncate">{a.patient?.name}</div>
                    <div className="text-xs opacity-55 truncate">{a.doctor?.name || a.department} · <Clock size={10} className="inline" /> {fmtTime(a.time)}</div>
                  </div>
                  <Badge status={a.status} />
                </div>
                <div className="flex gap-1.5 mt-3">
                  {(a.status === 'Scheduled' || a.status === 'Confirmed') && (
                    <button className="btn btn-teal btn-sm flex-1" onClick={() => act(a, 'Checked-in')}><LogIn size={13} /> Check in</button>
                  )}
                  {a.status === 'Checked-in' && (
                    <button className="btn btn-primary btn-sm flex-1" onClick={() => act(a, 'In consultation')}>Start consultation</button>
                  )}
                  {a.status === 'In consultation' && (
                    <button className="btn btn-primary btn-sm flex-1" onClick={() => act(a, 'Completed')}><CheckCircle2 size={13} /> Complete</button>
                  )}
                  {(a.status === 'Completed' || a.status === 'Cancelled' || a.status === 'No-show') && (
                    <div className="text-xs opacity-50 font-semibold py-1">Visit {a.status.toLowerCase()}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
