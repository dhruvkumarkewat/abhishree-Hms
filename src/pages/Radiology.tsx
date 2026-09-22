import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ScanLine } from 'lucide-react';
import { get, post, put, fmtDate, todayISO } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Modal, Field, Badge, Empty, LoadError, SkeletonRows, SectionHead } from '../components/ui';

const MODS = ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'DEXA'];
const FLOW = ['Requested', 'Scheduled', 'In Progress', 'Reported'];

export default function Radiology() {
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [reportFor, setReportFor] = useState<any>(null);
  const [report, setReport] = useState('');
  const [form, setForm] = useState({ patient_id: '', modality: 'X-Ray', body_part: '', notes: '' });

  const canOrder = ['Admin', 'Doctor'].includes(user?.role || '');
  const canProcess = ['Admin', 'Lab Technician', 'Doctor'].includes(user?.role || '');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const [r, p] = await Promise.all([get('/api/radiology'), get('/api/patients')]);
      setRows(Array.isArray(r) ? r : []);
      setPatients(Array.isArray(p) ? p : []);
    } catch (e: any) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const advance = async (r: any) => {
    const i = FLOW.indexOf(r.status);
    if (i < 0 || i >= FLOW.length - 1) return;
    const next = FLOW[i + 1];
    if (next === 'Reported') { setReportFor(r); setReport(r.report || ''); return; }
    try {
      await put('/api/radiology', { id: r.id, status: next });
      toast({ kind: 'success', title: `${r.modality} → ${next}` });
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to update radiology status', desc: e.message });
    }
  };

  const saveReport = async () => {
    if (!report.trim()) return toast({ kind: 'error', title: 'Write the findings first' });
    try {
      await put('/api/radiology', { id: reportFor.id, report: report.trim(), report_date: todayISO(), status: 'Reported' });
      await post('/api/audit', { user_name: user!.name, user_role: user!.role, action: `Reported ${reportFor.modality} for ${reportFor.patient?.name}`, module: 'Radiology' });
      await post('/api/notifications', { type: 'Lab result', title: 'Imaging report ready', message: `${reportFor.modality} for ${reportFor.patient?.name} is reported.`, target_role: 'Doctor' });
      toast({ kind: 'success', title: 'Report released to doctor & patient' });
      setReportFor(null);
      setReport('');
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to save report', desc: e.message });
    }
  };

  const order = async () => {
    if (!form.patient_id) return toast({ kind: 'error', title: 'Choose a patient' });
    try {
      await post('/api/radiology', { patient_id: Number(form.patient_id), modality: form.modality, body_part: form.body_part || null, notes: form.notes || null, status: 'Requested', requested_date: todayISO(), requested_by: user!.name });
      toast({ kind: 'success', title: 'Imaging requested' });
      setShowNew(false);
      setForm({ patient_id: '', modality: 'X-Ray', body_part: '', notes: '' });
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to request imaging', desc: e.message });
    }
  };

  return (
    <div>
      <SectionHead title="Radiology" desc="Imaging requests, scheduling and reporting."
        action={canOrder ? <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={15} /> Request imaging</button> : undefined} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {FLOW.map((s) => (
          <div key={s} className="card p-4">
            <div className="text-[13px] opacity-60 font-medium">{s}</div>
            <div className="text-2xl font-bold mt-0.5">{rows.filter((r) => r.status === s).length}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="card p-4"><SkeletonRows rows={6} /></div>
        : err ? <div className="card"><LoadError message={err} onRetry={load} /></div>
        : rows.length === 0 ? <div className="card"><Empty title="No imaging requests" /></div>
        : (
          <div className="grid gap-3">
            {rows.map((r) => (
              <div key={r.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 shrink-0"><ScanLine size={18} /></div>
                  <div className="min-w-0 flex-1 basis-52 cursor-pointer" onClick={() => nav(`/app/patients/${r.patient_id}`)}>
                    <div className="font-bold">{r.modality}{r.body_part ? ` — ${r.body_part}` : ''} <span className="opacity-50 font-semibold text-sm">· {r.patient?.name}</span></div>
                    <div className="text-xs opacity-55 mt-0.5">Requested {fmtDate(r.requested_date)} by {r.requested_by || '—'}{r.report ? ` · ${r.report.slice(0, 90)}` : ''}</div>
                  </div>
                  <Badge status={r.status === 'Reported' ? 'Completed' : r.status === 'Requested' ? 'Scheduled' : r.status === 'Scheduled' ? 'Confirmed' : 'Processing'}>{r.status}</Badge>
                  {canProcess && r.status !== 'Reported' && (
                    <button className="btn btn-primary btn-sm" onClick={() => advance(r)}>
                      {FLOW.indexOf(r.status) === 2 ? 'Write report' : `Mark: ${FLOW[FLOW.indexOf(r.status) + 1]}`}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-3">
                  {FLOW.map((s, i) => (
                    <div key={s} className="flex-1">
                      <div className="h-1.5 rounded-full" style={{ background: FLOW.indexOf(r.status) >= i ? '#6a3fd4' : '#e5eaf1' }} />
                      <div className="text-[10px] font-semibold mt-1 opacity-60 hidden sm:block">{s}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      {showNew && (
        <Modal title="Request imaging" onClose={() => setShowNew(false)}>
          <div className="space-y-4">
            <Field label="Patient" required>
              <select className="input" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                <option value="">Select patient…</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.patient_id}</option>)}
              </select>
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Modality"><select className="input" value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })}>{MODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
              <Field label="Body part"><input className="input" placeholder="e.g. Chest, left knee" value={form.body_part} onChange={(e) => setForm({ ...form, body_part: e.target.value })} /></Field>
            </div>
            <Field label="Clinical notes"><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={order}>Request imaging</button>
          </div>
        </Modal>
      )}

      {reportFor && (
        <Modal title="Radiology findings" subtitle={`${reportFor.modality} · ${reportFor.patient?.name}`} onClose={() => setReportFor(null)}>
          <Field label="Report">
            <textarea className="input" rows={5} value={report} onChange={(e) => setReport(e.target.value)} placeholder="Findings and impression…" />
          </Field>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-ghost" onClick={() => setReportFor(null)}>Cancel</button>
            <button className="btn btn-teal" onClick={saveReport}>Release report</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
