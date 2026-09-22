import { useEffect, useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { get, post, inr, fmtDate } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Modal, Field, Badge, Empty, LoadError, SkeletonRows, SectionHead, Stat } from '../components/ui';

const FLOW = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Settled'];
const PROVIDERS = ['Star Health', 'HDFC Ergo', 'ICICI Lombard', 'Niva Bupa', 'Care Health', 'Tata AIG', 'LIC', 'Other'];

export default function Insurance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ patient_id: '', provider: PROVIDERS[0], policy_number: '', claim_amount: '', notes: '' });

  const canManage = ['Admin', 'Accountant', 'Receptionist'].includes(user?.role || '');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const [c, p] = await Promise.all([get('/api/insurance'), get('/api/patients')]);
      setRows(Array.isArray(c) ? c : []);
      setPatients(Array.isArray(p) ? p : []);
    } catch (e: any) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const move = async (c: any, status: string) => {
    await fetch('/api/insurance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, status }) });
    await post('/api/audit', { user_name: user!.name, user_role: user!.role, action: `Moved claim for ${c.patient?.name} (${c.provider}) to ${status}`, module: 'Insurance' });
    toast({ kind: 'success', title: `Claim → ${status}` });
    load();
  };

  const file = async () => {
    if (!form.patient_id) return toast({ kind: 'error', title: 'Choose a patient' });
    if (!form.policy_number.trim()) return toast({ kind: 'error', title: 'Policy number is required' });
    if (!(Number(form.claim_amount) > 0)) return toast({ kind: 'error', title: 'Enter the claim amount' });
    await post('/api/insurance', { patient_id: Number(form.patient_id), provider: form.provider, policy_number: form.policy_number.trim(), claim_amount: Number(form.claim_amount), notes: form.notes || null, status: 'Submitted', filed_date: new Date().toISOString().slice(0, 10), filed_by: user!.name });
    toast({ kind: 'success', title: 'Claim filed', desc: `${form.provider} · ${inr(form.claim_amount)}` });
    setShowNew(false);
    setForm({ patient_id: '', provider: PROVIDERS[0], policy_number: '', claim_amount: '', notes: '' });
    load();
  };

  const inReview = rows.filter((r) => ['Submitted', 'Under Review'].includes(r.status));
  const settled = rows.filter((r) => r.status === 'Settled').reduce((s, r) => s + Number(r.claim_amount || 0), 0);

  return (
    <div>
      <SectionHead title="Insurance claims" desc="From filing to settlement, tracked per patient."
        action={canManage ? <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={15} /> File claim</button> : undefined} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Stat label="Total claims" value={rows.length} icon={<Wallet size={19} />} />
        <Stat label="In review" value={inReview.length} />
        <Stat label="Settled value" value={inr(settled)} />
        <Stat label="Rejected" value={rows.filter((r) => r.status === 'Rejected').length} />
      </div>

      {loading ? <div className="card p-4"><SkeletonRows rows={6} /></div>
        : err ? <div className="card"><LoadError message={err} onRetry={load} /></div>
        : rows.length === 0 ? <div className="card"><Empty title="No claims filed" /></div>
        : (
          <div className="grid gap-3">
            {rows.map((c) => (
              <div key={c.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 shrink-0"><Wallet size={18} /></div>
                  <div className="min-w-0 flex-1 basis-52">
                    <div className="font-bold">{c.provider} <span className="opacity-50 font-semibold text-sm">· {c.patient?.name} · {c.policy_number}</span></div>
                    <div className="text-xs opacity-55 mt-0.5">Filed {fmtDate(c.filed_date)} · {inr(c.claim_amount)}{c.notes ? ` · ${c.notes}` : ''}</div>
                  </div>
                  <Badge status={c.status} />
                  {canManage && (
                    <select className="input !w-auto !py-1.5 !text-[13px]" value={c.status} onChange={(e) => move(c, e.target.value)} aria-label="Claim status">
                      {[...FLOW, 'Rejected'].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-3">
                  {FLOW.map((s, i) => (
                    <div key={s} className="flex-1">
                      <div className="h-1.5 rounded-full" style={{ background: c.status === 'Rejected' ? '#e5eaf1' : FLOW.indexOf(c.status) >= i ? '#1470cc' : '#e5eaf1' }} />
                      <div className="text-[10px] font-semibold mt-1 opacity-60 hidden sm:block">{s}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      {showNew && (
        <Modal title="File insurance claim" onClose={() => setShowNew(false)}>
          <div className="space-y-4">
            <Field label="Patient" required>
              <select className="input" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                <option value="">Select patient…</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.insurance_provider || 'no insurer on file'}</option>)}
              </select>
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Provider"><select className="input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>{PROVIDERS.map((p) => <option key={p}>{p}</option>)}</select></Field>
              <Field label="Policy number" required><input className="input" value={form.policy_number} onChange={(e) => setForm({ ...form, policy_number: e.target.value })} /></Field>
            </div>
            <Field label="Claim amount (₹)" required><input type="number" className="input" value={form.claim_amount} onChange={(e) => setForm({ ...form, claim_amount: e.target.value })} /></Field>
            <Field label="Notes"><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Admission / procedure reference…" /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={file}>File claim</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
