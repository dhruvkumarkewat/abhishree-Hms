import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { get } from '../lib/api';
import { Badge, Empty, LoadError, SkeletonRows, SectionHead, Pagination } from '../components/ui';

const MODULES = ['All', 'Patients', 'Appointments', 'OPD', 'Admissions', 'Consultation', 'Laboratory', 'Radiology', 'Pharmacy', 'Billing', 'Insurance', 'Inventory', 'Emergency', 'Beds', 'Nursing'];

export default function Audit() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [mod, setMod] = useState('All');
  const [page, setPage] = useState(1);
  const per = 15;

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const d = await get('/api/audit');
      setRows(Array.isArray(d) ? d : []);
    } catch (e: any) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [mod]);

  const shown = rows.filter((r) => mod === 'All' || r.module === mod);
  const totalPages = Math.max(1, Math.ceil(shown.length / per));
  const pageRows = shown.slice((page - 1) * per, page * per);

  return (
    <div>
      <SectionHead title="Audit log" desc="Who did what, when, and in which module — newest first." />

      <div className="flex gap-1.5 mb-4 overflow-x-auto scroll-thin pb-1">
        {MODULES.map((m) => (
          <button key={m} onClick={() => setMod(m)} className={`tab-btn ${mod === m ? 'active' : ''}`}>{m}</button>
        ))}
      </div>

      {loading ? <div className="card p-4"><SkeletonRows rows={10} /></div>
        : err ? <div className="card"><LoadError message={err} onRetry={load} /></div>
        : shown.length === 0 ? <div className="card"><Empty title="No audit entries" desc="Actions across the hospital are recorded here automatically." /></div>
        : (
          <>
            <div className="card p-0 overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pageRows.map((r) => (
                  <div key={r.id} className="px-5 py-3 flex flex-wrap items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><ShieldCheck size={15} className="opacity-60" /></div>
                    <div className="min-w-0 flex-1 basis-60">
                      <div className="text-sm"><span className="font-bold">{r.user_name}</span> <span className="opacity-50">({r.user_role})</span> <span className="opacity-75">— {r.action}</span></div>
                      <div className="text-xs opacity-50 mt-0.5">{r.created_at ? new Date(r.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''}</div>
                    </div>
                    <span className="badge b-slate">{r.module}</span>
                    <Badge status={r.result === 'Failed' ? 'Failed' : 'Success'}>{r.result || 'Success'}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <Pagination page={page} totalPages={totalPages} total={shown.length} onChange={setPage} />
          </>
        )}
    </div>
  );
}
