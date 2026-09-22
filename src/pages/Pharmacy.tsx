import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Plus, Minus, AlertTriangle } from 'lucide-react';
import { get, post, fmtDate, todayISO } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Modal, Field, Badge, Empty, LoadError, SkeletonRows, SectionHead, Meter, AlertBanner } from '../components/ui';

export default function Pharmacy() {
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [rx, setRx] = useState<any[]>([]);
  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<'queue' | 'stock'>('queue');
  const [q, setQ] = useState('');
  const [showMed, setShowMed] = useState(false);
  const [medForm, setMedForm] = useState({ name: '', strength: '', category: 'Tablet', stock_quantity: '', reorder_level: '50', unit_price: '', expiry_date: '', supplier: '' });

  const isPharma = ['Admin', 'Pharmacist'].includes(user?.role || '');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const [r, m] = await Promise.all([get('/api/prescriptions'), get('/api/medicines')]);
      setRx(Array.isArray(r) ? r : []);
      setMeds(Array.isArray(m) ? m : []);
    } catch (e: any) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const pending = rx.filter((r) => r.status === 'Pending');
  const low = meds.filter((m) => Number(m.stock_quantity) <= Number(m.reorder_level));
  const stockShown = useMemo(() => meds.filter((m) => !q.trim() || m.name.toLowerCase().includes(q.trim().toLowerCase())), [meds, q]);

  const dispense = async (r: any) => {
    // decrement stock for matched medicines
    for (const it of (r.items || [])) {
      const match = meds.find((m) => m.name.toLowerCase() === String(it.medicine || '').toLowerCase().split(' ')[0].toLowerCase() || m.name.toLowerCase().includes(String(it.medicine || '').toLowerCase().split(' ')[0]));
      if (match) {
        const qty = Math.max(1, parseInt(String(it.duration || '1')) || 1);
        await fetch('/api/medicines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: match.id, stock_quantity: Math.max(0, Number(match.stock_quantity) - qty) }) });
      }
    }
    await fetch('/api/prescriptions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, status: 'Dispensed', dispensed_date: todayISO(), dispensed_by: user!.name }) });
    await post('/api/audit', { user_name: user!.name, user_role: user!.role, action: `Dispensed prescription #${r.id} for ${r.patient?.name}`, module: 'Pharmacy' });
    toast({ kind: 'success', title: 'Prescription dispensed', desc: `${r.patient?.name} · stock updated` });
    load();
  };

  const adjust = async (m: any, delta: number) => {
    await fetch('/api/medicines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, stock_quantity: Math.max(0, Number(m.stock_quantity) + delta) }) });
    toast({ kind: 'success', title: delta > 0 ? 'Stock added' : 'Stock reduced', desc: m.name });
    load();
  };

  const addMed = async () => {
    if (!medForm.name.trim()) return toast({ kind: 'error', title: 'Medicine name is required' });
    await post('/api/medicines', { ...medForm, stock_quantity: Number(medForm.stock_quantity) || 0, reorder_level: Number(medForm.reorder_level) || 0, unit_price: Number(medForm.unit_price) || 0, expiry_date: medForm.expiry_date || null });
    toast({ kind: 'success', title: 'Medicine added to inventory' });
    setShowMed(false);
    setMedForm({ name: '', strength: '', category: 'Tablet', stock_quantity: '', reorder_level: '50', unit_price: '', expiry_date: '', supplier: '' });
    load();
  };

  return (
    <div>
      <SectionHead title="Pharmacy" desc={`${pending.length} waiting to dispense · ${low.length} low-stock alerts`}
        action={isPharma ? <button className="btn btn-ghost btn-sm" onClick={() => setShowMed(true)}><Plus size={15} /> Add medicine</button> : undefined} />

      {low.length > 0 && <div className="mb-4"><AlertBanner level="warning" text={`${low.length} items at or below reorder level: ${low.slice(0, 4).map((m) => m.name).join(', ')}${low.length > 4 ? '…' : ''}`} /></div>}

      <div className="flex gap-1.5 mb-4">
        <button onClick={() => setTab('queue')} className={`tab-btn ${tab === 'queue' ? 'active' : ''}`}>Prescription queue ({pending.length})</button>
        <button onClick={() => setTab('stock')} className={`tab-btn ${tab === 'stock' ? 'active' : ''}`}>Medicine stock ({meds.length})</button>
      </div>

      {loading ? <div className="card p-4"><SkeletonRows rows={6} /></div>
        : err ? <div className="card"><LoadError message={err} onRetry={load} /></div>
        : tab === 'queue' ? (
          pending.length === 0 ? <div className="card"><Empty title="Queue is clear" desc="Doctor prescriptions land here the moment they are written." /></div> : (
            <div className="grid gap-3">
              {pending.map((r) => (
                <div key={r.id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="font-bold cursor-pointer hover:underline" onClick={() => nav(`/app/patients/${r.patient_id}`)}>
                      {r.patient?.name} <span className="opacity-50 font-semibold text-sm">· {r.doctor_name} · {fmtDate((r.created_at || '').slice(0, 10))}</span>
                    </div>
                    <Badge status="Pending" />
                  </div>
                  {r.diagnosis && <div className="text-sm mb-2"><span className="opacity-55">Diagnosis: </span><span className="font-semibold">{r.diagnosis}</span></div>}
                  <div className="table-wrap !border-0">
                    <table className="grid-table">
                      <thead><tr><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>In stock</th></tr></thead>
                      <tbody>
                        {(r.items || []).map((it: any, i: number) => {
                          const inStock = meds.some((m) => m.name.toLowerCase().includes(String(it.medicine || '').toLowerCase().split(' ')[0]) && Number(m.stock_quantity) > 0);
                          return (
                            <tr key={i}>
                              <td className="font-semibold">{it.medicine}</td><td>{it.dose}</td><td>{it.frequency}</td><td>{it.duration}</td>
                              <td>{inStock ? <span className="badge b-green">Yes</span> : <span className="badge b-red">Check</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button className="btn btn-ghost btn-sm" onClick={() => nav(`/app/prescription/${r.id}`)}>View prescription</button>
                    {isPharma && <button className="btn btn-primary btn-sm" onClick={() => dispense(r)}><Pill size={14} /> Dispense & update stock</button>}
                  </div>
                </div>
              ))}
              {rx.filter((r) => r.status === 'Dispensed').length > 0 && (
                <div className="text-sm font-bold opacity-60 mt-2">Recently dispensed</div>
              )}
              {rx.filter((r) => r.status === 'Dispensed').slice(0, 4).map((r) => (
                <div key={r.id} className="card px-5 py-3 flex items-center gap-3 text-sm opacity-80">
                  <Pill size={15} className="opacity-50" />
                  <span className="font-semibold">{r.patient?.name}</span>
                  <span className="opacity-55 truncate">{(r.items || []).map((i: any) => i.medicine).join(', ')}</span>
                  <span className="ml-auto shrink-0"><Badge status="Dispensed" /></span>
                </div>
              ))}
            </div>
          )
        ) : (
          <div>
            <input className="input mb-3 max-w-sm" placeholder="Search medicines…" value={q} onChange={(e) => setQ(e.target.value)} />
            {stockShown.length === 0 ? <div className="card"><Empty title="No medicines found" /></div> : (
              <div className="table-wrap">
                <table className="grid-table">
                  <thead><tr><th>Medicine</th><th>Category</th><th>Stock</th><th>Level</th><th>Price</th><th>Expiry</th>{isPharma && <th className="!text-right">Adjust</th>}</tr></thead>
                  <tbody>
                    {stockShown.map((m) => {
                      const isLow = Number(m.stock_quantity) <= Number(m.reorder_level);
                      return (
                        <tr key={m.id}>
                          <td><span className="font-semibold">{m.name}</span> <span className="opacity-55 text-[13px]">{m.strength}</span>
                            {isLow && <span className="ml-2 badge b-amber"><AlertTriangle size={10} /> Low</span>}</td>
                          <td className="text-[13px]">{m.category}</td>
                          <td className="font-bold">{m.stock_quantity} <span className="font-normal opacity-50 text-xs">/ reorder {m.reorder_level}</span></td>
                          <td className="w-40"><Meter value={Number(m.stock_quantity)} max={Math.max(Number(m.reorder_level) * 3, 10)} color={isLow ? '#d99a0b' : '#0d9488'} /></td>
                          <td>₹{Number(m.unit_price || 0).toLocaleString('en-IN')}</td>
                          <td className="text-[13px]">{m.expiry_date ? fmtDate(m.expiry_date) : '—'}</td>
                          {isPharma && (
                            <td className="!text-right whitespace-nowrap">
                              <button className="btn btn-ghost btn-sm !px-2 mr-1" onClick={() => adjust(m, -10)} aria-label="Reduce"><Minus size={14} /></button>
                              <button className="btn btn-ghost btn-sm !px-2" onClick={() => adjust(m, 50)} aria-label="Add"><Plus size={14} /></button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      {showMed && (
        <Modal title="Add medicine" subtitle="Adds to dispensary stock." onClose={() => setShowMed(false)}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name" required><input className="input" value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} placeholder="Paracetamol" /></Field>
            <Field label="Strength"><input className="input" value={medForm.strength} onChange={(e) => setMedForm({ ...medForm, strength: e.target.value })} placeholder="500 mg" /></Field>
            <Field label="Category"><select className="input" value={medForm.category} onChange={(e) => setMedForm({ ...medForm, category: e.target.value })}><option>Tablet</option><option>Capsule</option><option>Syrup</option><option>Injection</option><option>Ointment</option><option>Drops</option></select></Field>
            <Field label="Supplier"><input className="input" value={medForm.supplier} onChange={(e) => setMedForm({ ...medForm, supplier: e.target.value })} placeholder="Supplier name" /></Field>
            <Field label="Opening stock"><input type="number" className="input" value={medForm.stock_quantity} onChange={(e) => setMedForm({ ...medForm, stock_quantity: e.target.value })} /></Field>
            <Field label="Reorder level"><input type="number" className="input" value={medForm.reorder_level} onChange={(e) => setMedForm({ ...medForm, reorder_level: e.target.value })} /></Field>
            <Field label="Unit price (₹)"><input type="number" className="input" value={medForm.unit_price} onChange={(e) => setMedForm({ ...medForm, unit_price: e.target.value })} /></Field>
            <Field label="Expiry"><input type="date" className="input" value={medForm.expiry_date} onChange={(e) => setMedForm({ ...medForm, expiry_date: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-ghost" onClick={() => setShowMed(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addMed}>Add medicine</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
