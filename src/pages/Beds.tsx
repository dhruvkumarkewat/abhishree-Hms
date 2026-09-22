import { useEffect, useMemo, useState } from 'react';
import { BedDouble, Clock } from 'lucide-react';
import { get, post, put, fmtTime } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Modal, Field, Badge, Empty, LoadError, SectionHead, Avatar } from '../components/ui';

const CATS = ['All', 'ICU', 'General', 'Semi-private', 'Private', 'Emergency', 'Pediatric', 'Maternity', 'VIP'];

export default function Beds() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [cat, setCat] = useState('All');
  const [selected, setSelected] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');

  const canManage = ['Admin', 'Receptionist', 'Nurse'].includes(user?.role || '');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const data = await get('/api/beds');
      setBeds(Array.isArray(data) ? data : []);
    } catch (e: any) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const wards = useMemo(() => {
    const map: Record<string, any[]> = {};
    beds.filter((b) => cat === 'All' || b.category === cat).forEach((b) => {
      map[b.ward] = map[b.ward] || [];
      map[b.ward].push(b);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [beds, cat]);

  const occupied = beds.filter((b) => b.status === 'Occupied').length;

  const bedColor = (b: any) => {
    if (b.status === 'Occupied') return 'bg-red-500';
    if (b.status === 'Reserved') return 'bg-amber-400';
    if (b.status === 'Cleaning') return 'bg-purple-400';
    if (b.status === 'Maintenance') return 'bg-slate-400';
    return 'bg-emerald-500';
  };

  const updateBed = async () => {
    if (!newStatus) return;
    try {
      await put('/api/beds', { id: selected.id, status: newStatus, ...(newStatus === 'Available' ? { patient_id: null, patient_name: null } : {}) });
      await post('/api/audit', { user_name: user!.name, user_role: user!.role, action: `Set bed ${selected.bed_number} to ${newStatus}`, module: 'Beds' });
      toast({ kind: 'success', title: `Bed ${selected.bed_number} → ${newStatus}` });
      setSelected(null);
      setNewStatus('');
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to update bed', desc: e.message });
    }
  };

  return (
    <div>
      <SectionHead title="Beds & rooms" desc={`${beds.length - occupied} of ${beds.length} beds free · click any bed for details`} />

      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`tab-btn ${cat === c ? 'active' : ''}`}>{c}</button>
        ))}
        <div className="ml-auto flex flex-wrap gap-3 text-xs font-medium opacity-70">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Occupied</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Reserved</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Cleaning</span>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{[0, 1, 2].map((i) => <div key={i} className="card p-5"><div className="skeleton h-40" /></div>)}</div>
      ) : err ? <div className="card"><LoadError message={err} onRetry={load} /></div>
        : wards.length === 0 ? <div className="card"><Empty title="No beds in this category" /></div>
        : (
          <div className="grid xl:grid-cols-2 gap-4">
            {wards.map(([ward, list]) => {
              const free = list.filter((b) => b.status === 'Available').length;
              return (
                <div key={ward} className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-bold flex items-center gap-2"><BedDouble size={17} className="opacity-60" /> {ward}</div>
                      <div className="text-xs opacity-55 mt-0.5">{free} of {list.length} free</div>
                    </div>
                    <Badge status={free === 0 ? 'Occupied' : 'Available'}>{free === 0 ? 'Full' : `${free} free`}</Badge>
                  </div>
                  {/* 3D-ish bed grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 perspective-1200">
                    {list.map((b: any) => (
                      <button
                        key={b.id}
                        onClick={() => { setSelected(b); setNewStatus(b.status); }}
                        title={`${b.bed_number} — ${b.status}${b.patient_name ? ` — ${b.patient_name}` : ''}`}
                        className="tilt-card group relative rounded-xl border hairline bg-slate-50 dark:bg-slate-900/50 p-2 text-center hover:shadow-lg hover:-translate-y-0.5"
                      >
                        <div className={`mx-auto w-9 h-9 rounded-lg ${bedColor(b)} flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105`}>
                          <BedDouble size={17} />
                        </div>
                        <div className="text-[11px] font-bold mt-1.5 truncate">{b.bed_number}</div>
                        <div className="text-[10px] opacity-55 truncate">{b.status === 'Occupied' ? b.patient_name?.split(' ')[0] : b.status}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {selected && (
        <Modal title={`Bed ${selected.bed_number}`} subtitle={`${selected.ward} · ${selected.category}${selected.room_number ? ` · Room ${selected.room_number}` : ''}`} onClose={() => setSelected(null)}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="opacity-60">Status</span><Badge status={selected.status} /></div>
            <div className="flex items-center justify-between"><span className="opacity-60">Daily rate</span><span className="font-bold">₹{Number(selected.daily_rate || 0).toLocaleString('en-IN')}</span></div>
            {selected.patient_name && (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3">
                <Avatar name={selected.patient_name} size={36} />
                <div><div className="font-bold">{selected.patient_name}</div><div className="text-xs opacity-55">Current occupant</div></div>
              </div>
            )}
            {canManage ? (
              <>
                <Field label="Change status">
                  <select className="input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    <option>Available</option><option>Occupied</option><option>Reserved</option><option>Cleaning</option><option>Maintenance</option>
                  </select>
                </Field>
                <div className="flex justify-end gap-2 pt-2">
                  <button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
                  <button className="btn btn-primary" onClick={updateBed}>Update bed</button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-[13px] opacity-60 pt-1"><Clock size={14} /> Bed changes are managed by the front desk and nursing team.</div>
            )}
            <div className="text-xs opacity-50">Last updated {selected.updated_at ? fmtTime(new Date(selected.updated_at).toISOString().slice(11, 16)) + ' · ' + new Date(selected.updated_at).toLocaleDateString('en-IN') : '—'}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}
