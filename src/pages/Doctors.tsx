import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Stethoscope } from 'lucide-react';
import { get, post, put } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Modal, Field, Badge, Empty, LoadError, SkeletonRows, SectionHead, Avatar } from '../components/ui';

const DEPTS = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine', 'Gynecology', 'Surgery', 'Radiology', 'Pathology', 'Emergency'];

export default function Doctors() {
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<'doctors' | 'staff'>('doctors');
  const [dept, setDept] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', specialty: 'General Medicine', department: 'General Medicine', qualification: '', phone: '', email: '', consultation_fee: '500', schedule: 'Mon–Sat · 10:00–14:00' });

  const isAdmin = user?.role === 'Admin';

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const [d, s] = await Promise.all([get('/api/doctors'), get('/api/staff')]);
      setDoctors(Array.isArray(d) ? d : []);
      setStaff(Array.isArray(s) ? s : []);
    } catch (e: any) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const shown = doctors.filter((d) => !dept || d.department === dept);

  const add = async () => {
    if (!form.name.trim()) return toast({ kind: 'error', title: 'Doctor name is required' });
    try {
      await post('/api/doctors', { ...form, consultation_fee: Number(form.consultation_fee) || 0, status: 'Available' });
      await post('/api/audit', { user_name: user!.name, user_role: user!.role, action: `Added doctor ${form.name} (${form.specialty})`, module: 'Staff' });
      toast({ kind: 'success', title: 'Doctor added', desc: form.name });
      setShowNew(false);
      setForm({ name: '', specialty: 'General Medicine', department: 'General Medicine', qualification: '', phone: '', email: '', consultation_fee: '500', schedule: 'Mon–Sat · 10:00–14:00' });
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to add doctor', desc: e.message });
    }
  };

  const toggle = async (d: any) => {
    const next = d.status === 'Available' ? 'On Leave' : 'Available';
    try {
      await put('/api/doctors', { id: d.id, status: next });
      toast({ kind: 'success', title: `${d.name} → ${next}` });
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to update doctor status', desc: e.message });
    }
  };

  return (
    <div>
      <SectionHead title="Doctors & staff" desc={`${doctors.length} doctors · ${staff.length} staff members across the hospital`}
        action={isAdmin ? <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={15} /> Add doctor</button> : undefined} />

      <div className="flex gap-1.5 mb-4">
        <button onClick={() => setTab('doctors')} className={`tab-btn ${tab === 'doctors' ? 'active' : ''}`}>Doctors</button>
        <button onClick={() => setTab('staff')} className={`tab-btn ${tab === 'staff' ? 'active' : ''}`}>Staff directory</button>
        {tab === 'doctors' && (
          <select className="input !w-auto ml-auto" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">All departments</option>
            {DEPTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        )}
      </div>

      {loading ? <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{[0, 1, 2].map((i) => <div key={i} className="card p-5"><div className="skeleton h-28" /></div>)}</div>
        : err ? <div className="card"><LoadError message={err} onRetry={load} /></div>
        : tab === 'doctors' ? (
          shown.length === 0 ? <div className="card"><Empty title="No doctors in this department" /></div> : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {shown.map((d) => (
                <div key={d.id} className="card p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3.5">
                    <Avatar name={d.name} size={52} />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[16px]">{d.name}</div>
                      <div className="text-[13px] opacity-60">{d.specialty} · {d.qualification}</div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="badge b-blue">{d.department}</span>
                        <Badge status={d.status === 'Available' ? 'Available' : 'Cancelled'}>{d.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3.5 pt-3.5 border-t hairline text-[13px] space-y-1 opacity-75">
                    <div className="flex justify-between"><span>Schedule</span><span className="font-semibold">{d.schedule || '—'}</span></div>
                    <div className="flex justify-between"><span>Consultation</span><span className="font-semibold">₹{Number(d.consultation_fee || 0).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Contact</span><span className="font-semibold">{d.phone || '—'}</span></div>
                  </div>
                  <div className="flex gap-2 mt-3.5">
                    <button className="btn btn-ghost btn-sm flex-1" onClick={() => nav(`/app/appointments?new=1`)}><Stethoscope size={14} /> Book visit</button>
                    {isAdmin && <button className="btn btn-ghost btn-sm flex-1" onClick={() => toggle(d)}>{d.status === 'Available' ? 'Mark on leave' : 'Mark available'}</button>}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          staff.length === 0 ? <div className="card"><Empty title="No staff records" /></div> : (
            <div className="table-wrap">
              <table className="grid-table">
                <thead><tr><th>Staff</th><th>Employee ID</th><th>Role</th><th>Department</th><th>Contact</th><th>Status</th></tr></thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id}>
                      <td><div className="flex items-center gap-2.5"><Avatar name={s.name} size={32} /><span className="font-semibold">{s.name}</span></div></td>
                      <td className="font-mono text-[13px]">{s.employee_id}</td>
                      <td><span className="badge b-slate">{s.role}</span></td>
                      <td className="text-[13px]">{s.department}</td>
                      <td className="text-[13px]">{s.phone}</td>
                      <td><Badge status={s.status || 'Active'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

      {showNew && (
        <Modal title="Add doctor" subtitle="Joins the roster and booking lists immediately." onClose={() => setShowNew(false)}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Field label="Full name" required><input className="input" placeholder="Dr. …" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
            <Field label="Specialty"><select className="input" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value, department: e.target.value })}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
            <Field label="Qualification"><input className="input" placeholder="MBBS, MD" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></Field>
            <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Email"><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Consultation fee (₹)"><input type="number" className="input" value={form.consultation_fee} onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })} /></Field>
            <Field label="Schedule"><input className="input" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={add}>Add doctor</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
