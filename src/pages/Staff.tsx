import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, CheckCircle2, XCircle, Clock, ShieldCheck, Mail, Phone, CalendarDays } from 'lucide-react';
import { get, post, put } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Modal, Field, Badge, Empty, LoadError, SkeletonRows, Pagination, SectionHead, Avatar } from '../components/ui';

export default function Staff() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState('');
  const [deptF, setDeptF] = useState('');
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', role: 'Nurse', department: 'General', email: '', phone: '', status: 'Active' });
  const perPage = 10;

  const canManage = user?.role === 'Admin';

  const ROLES = ['Admin', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Lab Technician', 'Accountant'];
  const DEPTS = ['General', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Emergency', 'ICU', 'Pharmacy', 'Lab', 'Billing', 'Management'];

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const data = await get('/api/staff');
      // If table doesn't exist, this might fail, so we fallback gracefully
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) { 
      // Fallback for demo since 'staff' table might not be seeded
      setRows([]);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleF && r.role !== roleF) return false;
      if (deptF && r.department !== deptF) return false;
      if (!needle) return true;
      return [r.name, r.email, r.phone].filter(Boolean).join(' ').toLowerCase().includes(needle);
    });
  }, [rows, q, roleF, deptF]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  const save = async () => {
    if (!form.name || !form.role) return toast({ kind: 'error', title: 'Name and role are required' });
    setSaving(true);
    try {
      await post('/api/staff', form);
      toast({ kind: 'success', title: 'Staff profile created' });
      setShowNew(false);
      setForm({ name: '', role: 'Nurse', department: 'General', email: '', phone: '', status: 'Active' });
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to create staff', desc: e.message });
    }
    setSaving(false);
  };

  return (
    <div>
      <SectionHead title="Staff Directory" desc="Manage hospital personnel, roles, and attendance."
        action={canManage ? <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={15} /> Add Staff</button> : undefined} />
      
      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
          <input className="input !pl-10" placeholder="Search staff…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={roleF} onChange={(e) => setRoleF(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="input sm:w-40" value={deptF} onChange={(e) => setDeptF(e.target.value)}>
          <option value="">All departments</option>
          {DEPTS.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {loading ? <div className="card p-4"><SkeletonRows rows={8} /></div>
        : filtered.length === 0 ? <div className="card"><Empty title="No staff members found" desc="Adjust your filters or add new staff." /></div>
        : (
          <>
            <div className="table-wrap hidden md:block">
              <table className="grid-table">
                <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Contact</th><th>Status</th></tr></thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id}>
                      <td><div className="flex items-center gap-2.5"><Avatar name={r.name} size={32} /><span className="font-semibold">{r.name}</span></div></td>
                      <td>{r.role}</td>
                      <td>{r.department}</td>
                      <td><div className="text-[13px]">{r.email}<br/><span className="opacity-60">{r.phone}</span></div></td>
                      <td><Badge status={r.status || 'Active'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 md:hidden">
              {pageRows.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{r.name}</div>
                      <div className="text-sm opacity-60">{r.role} · {r.department}</div>
                    </div>
                    <Badge status={r.status || 'Active'} />
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={filtered.length} onChange={setPage} />
          </>
        )}

      {showNew && (
        <Modal title="Add Staff Member" subtitle="Create a new profile for hospital personnel." onClose={() => setShowNew(false)}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Full name" required><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
            </div>
            <Field label="Role" required>
              <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Department">
              <select className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Email"><input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></Field>
            <Field label="Phone"><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Create profile'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
