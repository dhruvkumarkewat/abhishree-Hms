import { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle2, XCircle } from 'lucide-react';
import { get, post, put } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Modal, Field, Badge, Empty, LoadError, SkeletonRows, Pagination, SectionHead, Avatar } from '../components/ui';

export default function Approvals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('Pending');

  const canManage = user?.role === 'Admin';

  const load = async () => {
    setLoading(true); setErr('');
    try {
      // Dummy data for Approvals since API endpoint might not be wired up yet
      const dummy = [
        { id: 1, type: 'Discount', requester: 'Amit Sharma', role: 'Receptionist', details: '15% discount for poor background patient (ASH-00234)', status: 'Pending', date: new Date().toISOString() },
        { id: 2, type: 'Stock Adjustment', requester: 'Neha Gupta', role: 'Pharmacist', details: 'Write-off 5 bottles of expired Paracetamol', status: 'Pending', date: new Date().toISOString() },
        { id: 3, type: 'Leave', requester: 'Dr. Vivek Singh', role: 'Doctor', details: 'Casual leave from 15th to 18th Oct', status: 'Approved', date: new Date().toISOString() }
      ];
      setRows(dummy);
    } catch (e: any) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusF && r.status !== statusF && statusF !== 'All') return false;
      if (!needle) return true;
      return [r.type, r.requester, r.details].filter(Boolean).join(' ').toLowerCase().includes(needle);
    });
  }, [rows, q, statusF]);

  const action = async (id: number, act: string) => {
    toast({ kind: 'success', title: `Request ${act.toLowerCase()}` });
    setRows(rows.map(r => r.id === id ? { ...r, status: act } : r));
  };

  return (
    <div>
      <SectionHead title="Approval Center" desc="Manage requests for discounts, stock changes, and staff leaves." />
      
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
        : filtered.length === 0 ? <div className="card"><Empty title="No requests found" desc="You're all caught up." /></div>
        : (
          <div className="table-wrap">
            <table className="grid-table">
              <thead><tr><th>Type</th><th>Requested By</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold">{r.type}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={r.requester} size={28} />
                        <div className="text-sm">{r.requester}<br/><span className="text-xs opacity-60">{r.role}</span></div>
                      </div>
                    </td>
                    <td className="text-sm max-w-sm">{r.details}</td>
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
    </div>
  );
}
