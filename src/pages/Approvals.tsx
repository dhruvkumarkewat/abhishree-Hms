import { useEffect, useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { get, post, put, fmtDate } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Modal, Field, Badge, Empty, LoadError, SkeletonRows, SectionHead, Avatar } from '../components/ui';

export default function Approvals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('Pending');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ type: 'Leave', reason: '', amount: '' });
  const [saving, setSaving] = useState(false);

  const canManage = user?.role === 'Admin';

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const data = await get('/api/approvals');
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusF && r.status !== statusF && statusF !== 'All') return false;
      if (!needle) return true;
      return [r.type, r.requester, r.requested_by, r.details, r.reason].filter(Boolean).join(' ').toLowerCase().includes(needle);
    });
  }, [rows, q, statusF]);

  const action = async (id: string | number, act: string) => {
    try {
      await put('/api/approvals', { id, status: act, approved_by: user?.name || 'Admin' });
      toast({ kind: 'success', title: `Request ${act.toLowerCase()}` });
      setRows(rows.map(r => r.id === id ? { ...r, status: act, approved_by: user?.name || 'Admin' } : r));
    } catch (e: any) {
      toast({ kind: 'error', title: 'Action failed', desc: e.message });
    }
  };

  const submitRequest = async () => {
    if (!form.reason.trim()) return toast({ kind: 'error', title: 'Please provide reason / details' });
    setSaving(true);
    try {
      await post('/api/approvals', {
        type: form.type,
        requested_by: user?.name || 'Staff Member',
        reason: form.reason.trim(),
        amount: form.amount ? Number(form.amount) : null,
        status: 'Pending',
      });
      await post('/api/notifications', {
        type: 'Approval',
        title: `New ${form.type} Request`,
        message: `${user?.name || 'Staff'} submitted a ${form.type.toLowerCase()} request: ${form.reason.slice(0, 50)}`,
        target_role: 'Admin',
      });
      toast({ kind: 'success', title: 'Request submitted for approval' });
      setShowNew(false);
      setForm({ type: 'Leave', reason: '', amount: '' });
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Submission failed', desc: e.message });
    }
    setSaving(false);
  };

  return (
    <div>
      <SectionHead
        title="Approval Center"
        desc="Manage requests for discounts, stock changes, and staff leaves."
        action={
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
            <Plus size={15} /> New request
          </button>
        }
      />
      
      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
          <input className="input !pl-10" placeholder="Search requests…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
          <option value="All">All statuses</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
      </div>

      {loading ? <div className="card p-4"><SkeletonRows rows={8} /></div>
        : err ? <div className="card"><LoadError message={err} onRetry={load} /></div>
        : filtered.length === 0 ? <div className="card"><Empty title="No requests found" desc="You're all caught up." /></div>
        : (
          <div className="table-wrap">
            <table className="grid-table">
              <thead><tr><th>Type</th><th>Requested By</th><th>Details</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold">{r.type}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={r.requester || r.requested_by} size={28} />
                        <div className="text-sm">
                          <span className="font-semibold">{r.requester || r.requested_by}</span>
                          {r.approved_by && <div className="text-xs opacity-50">by {r.approved_by}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm max-w-sm">
                      <div>{r.details || r.reason}</div>
                      {r.amount ? <div className="text-xs font-semibold text-emerald-600 mt-0.5">₹{Number(r.amount).toLocaleString('en-IN')}</div> : null}
                    </td>
                    <td className="text-[13px]">{fmtDate(r.date || r.created_at)}</td>
                    <td><Badge status={r.status} /></td>
                    <td>
                      {r.status === 'Pending' && canManage ? (
                        <div className="flex gap-2">
                          <button className="btn btn-primary btn-sm" onClick={() => action(r.id, 'Approved')}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => action(r.id, 'Rejected')}>Reject</button>
                        </div>
                      ) : <span className="opacity-40">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {showNew && (
        <Modal title="Submit request for approval" subtitle="Discounts, leaves, expense claims, or inventory adjustments." onClose={() => setShowNew(false)}>
          <div className="space-y-4">
            <Field label="Request type" required>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="Leave">Leave Request</option>
                <option value="Discount">Patient Discount</option>
                <option value="Stock Adjustment">Stock Adjustment</option>
                <option value="Refund">Invoice Refund</option>
                <option value="Expense">Expense Claim</option>
                <option value="General">Other Request</option>
              </select>
            </Field>

            {(form.type === 'Discount' || form.type === 'Refund' || form.type === 'Expense') && (
              <Field label="Amount (₹)">
                <input type="number" className="input" placeholder="e.g. 500" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </Field>
            )}

            <Field label="Reason & Details" required>
              <textarea
                className="input !h-24 resize-none"
                placeholder="Explain the reason and any relevant patient ID or reference..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitRequest} disabled={saving}>
              {saving ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
