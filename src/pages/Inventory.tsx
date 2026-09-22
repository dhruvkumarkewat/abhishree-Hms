import { useEffect, useMemo, useState } from 'react';
import { Package, Plus, Minus, Truck } from 'lucide-react';
import { get, post, put } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Modal, Field, Badge, Empty, LoadError, SkeletonRows, SectionHead, Meter, AlertBanner } from '../components/ui';

const CATS = ['Medicines', 'Surgical', 'Consumables', 'Equipment', 'General'];

export default function Inventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ item_name: '', category: 'Consumables', stock_quantity: '', reorder_level: '20', unit: 'pcs', supplier: '', expiry_date: '' });

  const canManage = ['Admin', 'Pharmacist', 'Accountant'].includes(user?.role || '');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const d = await get('/api/inventory');
      setRows(Array.isArray(d) ? d : []);
    } catch (e: any) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const low = rows.filter((r) => Number(r.stock_quantity) <= Number(r.reorder_level));
  const shown = useMemo(() => rows.filter((r) => (!cat || r.category === cat) && (!q.trim() || r.item_name.toLowerCase().includes(q.trim().toLowerCase()))), [rows, cat, q]);

  const adjust = async (r: any, delta: number) => {
    try {
      await put('/api/inventory', { id: r.id, stock_quantity: Math.max(0, Number(r.stock_quantity) + delta) });
      toast({ kind: 'success', title: delta > 0 ? 'Stock received' : 'Stock issued', desc: r.item_name });
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to adjust stock', desc: e.message });
    }
  };

  const add = async () => {
    if (!form.item_name.trim()) return toast({ kind: 'error', title: 'Item name is required' });
    try {
      await post('/api/inventory', { ...form, stock_quantity: Number(form.stock_quantity) || 0, reorder_level: Number(form.reorder_level) || 0, expiry_date: form.expiry_date || null });
      await post('/api/audit', { user_name: user!.name, user_role: user!.role, action: `Added inventory item ${form.item_name}`, module: 'Inventory' });
      toast({ kind: 'success', title: 'Item added to inventory' });
      setShowNew(false);
      setForm({ item_name: '', category: 'Consumables', stock_quantity: '', reorder_level: '20', unit: 'pcs', supplier: '', expiry_date: '' });
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to add item', desc: e.message });
    }
  };

  return (
    <div>
      <SectionHead title="Inventory" desc={`${rows.length} items tracked · ${low.length} below reorder level`}
        action={canManage ? <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={15} /> Add item</button> : undefined} />

      {low.length > 0 && <div className="mb-4"><AlertBanner level="warning" text={`${low.length} items need reordering — raise purchase orders with suppliers before stock runs out.`} /></div>}

      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <input className="input flex-1" placeholder="Search items…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input sm:w-52" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <div className="card p-4"><SkeletonRows rows={8} /></div>
        : err ? <div className="card"><LoadError message={err} onRetry={load} /></div>
        : shown.length === 0 ? <div className="card"><Empty title="No items found" /></div>
        : (
          <div className="table-wrap">
            <table className="grid-table">
              <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Level</th><th>Supplier</th><th>Expiry</th>{canManage && <th className="!text-right">Move stock</th>}</tr></thead>
              <tbody>
                {shown.map((r) => {
                  const isLow = Number(r.stock_quantity) <= Number(r.reorder_level);
                  return (
                    <tr key={r.id}>
                      <td><span className="font-semibold flex items-center gap-2"><Package size={14} className="opacity-50" />{r.item_name}</span>
                        {isLow && <span className="ml-1 badge b-amber">Reorder</span>}</td>
                      <td><span className="badge b-slate">{r.category}</span></td>
                      <td className="font-bold">{r.stock_quantity} <span className="font-normal opacity-50 text-xs">{r.unit} / reorder {r.reorder_level}</span></td>
                      <td className="w-40"><Meter value={Number(r.stock_quantity)} max={Math.max(Number(r.reorder_level) * 3, 10)} color={isLow ? '#d99a0b' : '#0d9488'} /></td>
                      <td className="text-[13px]">{r.supplier || '—'}</td>
                      <td className="text-[13px]">{r.expiry_date ? new Date(r.expiry_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</td>
                      {canManage && (
                        <td className="!text-right whitespace-nowrap">
                          <button className="btn btn-ghost btn-sm !px-2 mr-1" onClick={() => adjust(r, -5)} title="Issue 5" aria-label="Issue"><Minus size={14} /></button>
                          <button className="btn btn-ghost btn-sm !px-2" onClick={() => adjust(r, 25)} title="Receive 25" aria-label="Receive"><Truck size={14} /></button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      {showNew && (
        <Modal title="Add inventory item" onClose={() => setShowNew(false)}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Field label="Item name" required><input className="input" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="e.g. Sterile gloves (box)" /></Field></div>
            <Field label="Category"><select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Unit"><select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}><option>pcs</option><option>boxes</option><option>bottles</option><option>vials</option><option>rolls</option><option>kits</option></select></Field>
            <Field label="Opening stock"><input type="number" className="input" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} /></Field>
            <Field label="Reorder level"><input type="number" className="input" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} /></Field>
            <Field label="Supplier"><input className="input" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></Field>
            <Field label="Expiry"><input type="date" className="input" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={add}>Add item</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
