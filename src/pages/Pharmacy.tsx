import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Plus, Minus, AlertTriangle, Search, X, Edit2, Trash2 } from 'lucide-react';
import { get, post, put, del, fmtDate, todayISO } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Modal, Field, Badge, Empty, LoadError, SkeletonRows, SectionHead, Meter, AlertBanner } from '../components/ui';
import { MEDICINE_CATEGORIES, MEDICINE_CATEGORY_GROUPS, MEDICINE_BADGE_COLORS } from '../lib/medicineCategories';

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
  const [catFilter, setCatFilter] = useState('');

  // Modals state
  const [showMed, setShowMed] = useState(false);
  const [editMed, setEditMed] = useState<any | null>(null);
  const [deleteMedConfirm, setDeleteMedConfirm] = useState<any | null>(null);

  // Forms state
  const [medForm, setMedForm] = useState({
    name: '',
    strength: '',
    category: 'Tablet',
    stock_quantity: '',
    reorder_level: '50',
    unit_price: '',
    expiry_date: '',
    supplier: ''
  });

  const [editMedForm, setEditMedForm] = useState({
    id: 0,
    name: '',
    strength: '',
    category: 'Tablet',
    stock_quantity: '',
    reorder_level: '50',
    unit_price: '',
    expiry_date: '',
    supplier: ''
  });

  const isPharma = ['Admin', 'Pharmacist'].includes(user?.role || '');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const [r, m] = await Promise.all([get('/api/prescriptions'), get('/api/medicines')]);
      setRx(Array.isArray(r) ? r : []);
      setMeds(Array.isArray(m) ? m : []);
    } catch (e: any) {
      setErr(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const pending = rx.filter((r) => r.status === 'Pending');
  const low = meds.filter((m) => Number(m.stock_quantity) <= Number(m.reorder_level));

  // Category counts across current medicines
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of meds) {
      if (m.category) {
        counts[m.category] = (counts[m.category] || 0) + 1;
      }
    }
    return counts;
  }, [meds]);

  // List of categories present in stock + default categories
  const activeStockCategories = useMemo(() => {
    const present = Object.keys(categoryCounts);
    const sorted = [...MEDICINE_CATEGORIES].filter((c) => present.includes(c));
    // Append any custom ones not in MEDICINE_CATEGORIES
    for (const c of present) {
      if (!sorted.includes(c as any)) sorted.push(c as any);
    }
    return sorted;
  }, [categoryCounts]);

  const stockShown = useMemo(
    () =>
      meds.filter((m) => {
        const matchQ =
          !q.trim() ||
          m.name.toLowerCase().includes(q.trim().toLowerCase()) ||
          (m.manufacturer && m.manufacturer.toLowerCase().includes(q.trim().toLowerCase()));
        const matchCat = !catFilter || m.category === catFilter;
        return matchQ && matchCat;
      }),
    [meds, q, catFilter]
  );

  const dispense = async (r: any) => {
    try {
      // decrement stock for matched medicines
      for (const it of r.items || []) {
        const match = meds.find(
          (m) =>
            m.name.toLowerCase() === String(it.medicine || '').toLowerCase().split(' ')[0].toLowerCase() ||
            m.name.toLowerCase().includes(String(it.medicine || '').toLowerCase().split(' ')[0])
        );
        if (match) {
          const qty = Math.max(1, parseInt(String(it.duration || '1')) || 1);
          await put('/api/medicines', { id: match.id, stock_quantity: Math.max(0, Number(match.stock_quantity) - qty) });
        }
      }
      await put('/api/prescriptions', {
        id: r.id,
        status: 'Dispensed',
        dispensed_date: todayISO(),
        dispensed_by: user!.name
      });
      await post('/api/audit', {
        user_name: user!.name,
        user_role: user!.role,
        action: `Dispensed prescription #${r.id} for ${r.patient?.name}`,
        module: 'Pharmacy'
      });
      toast({ kind: 'success', title: 'Prescription dispensed', desc: `${r.patient?.name} · stock updated` });
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Dispense failed', desc: e.message });
    }
  };

  const adjust = async (m: any, delta: number) => {
    try {
      const newQty = Math.max(0, Number(m.stock_quantity) + delta);
      await put('/api/medicines', { id: m.id, stock_quantity: newQty });
      toast({ kind: 'success', title: delta > 0 ? 'Stock added (+50)' : 'Stock reduced (-10)', desc: `${m.name}: ${newQty} in stock` });
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to adjust stock', desc: e.message });
    }
  };

  const addMed = async () => {
    if (!medForm.name.trim()) return toast({ kind: 'error', title: 'Medicine name is required' });
    try {
      await post('/api/medicines', {
        ...medForm,
        stock_quantity: Number(medForm.stock_quantity) || 0,
        reorder_level: Number(medForm.reorder_level) || 0,
        unit_price: Number(medForm.unit_price) || 0,
        expiry_date: medForm.expiry_date || null
      });
      await post('/api/audit', {
        user_name: user!.name,
        user_role: user!.role,
        action: `Added medicine ${medForm.name} (${medForm.category})`,
        module: 'Pharmacy'
      });
      toast({ kind: 'success', title: 'Medicine added to inventory', desc: medForm.name });
      setShowMed(false);
      setMedForm({
        name: '',
        strength: '',
        category: 'Tablet',
        stock_quantity: '',
        reorder_level: '50',
        unit_price: '',
        expiry_date: '',
        supplier: ''
      });
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to add medicine', desc: e.message });
    }
  };

  const startEditMed = (m: any) => {
    setEditMed(m);
    setEditMedForm({
      id: m.id,
      name: m.name || '',
      strength: m.strength || '',
      category: m.category || 'Tablet',
      stock_quantity: String(m.stock_quantity ?? ''),
      reorder_level: String(m.reorder_level ?? '50'),
      unit_price: String(m.unit_price ?? ''),
      expiry_date: m.expiry_date ? String(m.expiry_date).slice(0, 10) : '',
      supplier: m.manufacturer || m.supplier || ''
    });
  };

  const saveEditMed = async () => {
    if (!editMedForm.name.trim()) return toast({ kind: 'error', title: 'Medicine name is required' });
    try {
      await put('/api/medicines', {
        id: editMedForm.id,
        name: editMedForm.name.trim(),
        strength: editMedForm.strength.trim(),
        category: editMedForm.category,
        stock_quantity: Number(editMedForm.stock_quantity) || 0,
        reorder_level: Number(editMedForm.reorder_level) || 0,
        unit_price: Number(editMedForm.unit_price) || 0,
        expiry_date: editMedForm.expiry_date || null,
        manufacturer: editMedForm.supplier.trim() || null
      });
      await post('/api/audit', {
        user_name: user!.name,
        user_role: user!.role,
        action: `Updated medicine ${editMedForm.name} (${editMedForm.category})`,
        module: 'Pharmacy'
      });
      toast({ kind: 'success', title: 'Medicine updated', desc: editMedForm.name });
      setEditMed(null);
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to update medicine', desc: e.message });
    }
  };

  const deleteMed = async () => {
    if (!deleteMedConfirm) return;
    try {
      await del('/api/medicines', { id: deleteMedConfirm.id });
      await post('/api/audit', {
        user_name: user!.name,
        user_role: user!.role,
        action: `Deleted medicine ${deleteMedConfirm.name}`,
        module: 'Pharmacy'
      });
      toast({ kind: 'success', title: 'Medicine deleted', desc: deleteMedConfirm.name });
      setDeleteMedConfirm(null);
      load();
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to delete medicine', desc: e.message });
    }
  };

  return (
    <div>
      <SectionHead
        title="Pharmacy"
        desc={`${pending.length} waiting to dispense · ${low.length} low-stock alerts · ${meds.length} medicines in stock`}
        action={
          isPharma ? (
            <button className="btn btn-primary btn-sm flex items-center gap-1.5" onClick={() => setShowMed(true)}>
              <Plus size={15} /> Add medicine
            </button>
          ) : undefined
        }
      />

      {low.length > 0 && (
        <div className="mb-4">
          <AlertBanner
            level="warning"
            text={`${low.length} items at or below reorder level: ${low
              .slice(0, 4)
              .map((m) => m.name)
              .join(', ')}${low.length > 4 ? '…' : ''}`}
          />
        </div>
      )}

      <div className="flex gap-1.5 mb-4">
        <button onClick={() => setTab('queue')} className={`tab-btn ${tab === 'queue' ? 'active' : ''}`}>
          Prescription queue ({pending.length})
        </button>
        <button onClick={() => setTab('stock')} className={`tab-btn ${tab === 'stock' ? 'active' : ''}`}>
          Medicine stock ({meds.length})
        </button>
      </div>

      {loading ? (
        <div className="card p-4">
          <SkeletonRows rows={6} />
        </div>
      ) : err ? (
        <div className="card">
          <LoadError message={err} onRetry={load} />
        </div>
      ) : tab === 'queue' ? (
        pending.length === 0 ? (
          <div className="card">
            <Empty title="Queue is clear" desc="Doctor prescriptions land here the moment they are written." />
          </div>
        ) : (
          <div className="grid gap-3">
            {pending.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div
                    className="font-bold cursor-pointer hover:underline"
                    onClick={() => nav(`/app/patients/${r.patient_id}`)}
                  >
                    {r.patient?.name}{' '}
                    <span className="opacity-50 font-semibold text-sm">
                      · {r.doctor_name} · {fmtDate((r.created_at || '').slice(0, 10))}
                    </span>
                  </div>
                  <Badge status="Pending" />
                </div>
                {r.diagnosis && (
                  <div className="text-sm mb-2">
                    <span className="opacity-55">Diagnosis: </span>
                    <span className="font-semibold">{r.diagnosis}</span>
                  </div>
                )}
                <div className="table-wrap !border-0">
                  <table className="grid-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Dose</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>In stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(r.items || []).map((it: any, i: number) => {
                        const inStock = meds.some(
                          (m) =>
                            m.name.toLowerCase().includes(String(it.medicine || '').toLowerCase().split(' ')[0]) &&
                            Number(m.stock_quantity) > 0
                        );
                        return (
                          <tr key={i}>
                            <td className="font-semibold">{it.medicine}</td>
                            <td>{it.dose}</td>
                            <td>{it.frequency}</td>
                            <td>{it.duration}</td>
                            <td>
                              {inStock ? <span className="badge b-green">Yes</span> : <span className="badge b-red">Check</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button className="btn btn-ghost btn-sm" onClick={() => nav(`/app/prescription/${r.id}`)}>
                    View prescription
                  </button>
                  {isPharma && (
                    <button className="btn btn-primary btn-sm flex items-center gap-1.5" onClick={() => dispense(r)}>
                      <Pill size={14} /> Dispense & update stock
                    </button>
                  )}
                </div>
              </div>
            ))}
            {rx.filter((r) => r.status === 'Dispensed').length > 0 && (
              <div className="text-sm font-bold opacity-60 mt-2">Recently dispensed</div>
            )}
            {rx
              .filter((r) => r.status === 'Dispensed')
              .slice(0, 4)
              .map((r) => (
                <div key={r.id} className="card px-5 py-3 flex items-center gap-3 text-sm opacity-80">
                  <Pill size={15} className="opacity-50 shrink-0" />
                  <span className="font-semibold">{r.patient?.name}</span>
                  <span className="opacity-55 truncate">{(r.items || []).map((i: any) => i.medicine).join(', ')}</span>
                  <span className="ml-auto shrink-0">
                    <Badge status="Dispensed" />
                  </span>
                </div>
              ))}
          </div>
        )
      ) : (
        <div>
          {/* Stock Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
            <div className="relative flex-1">
              <input
                className="input w-full pl-9"
                placeholder="Search medicines, strength, manufacturer…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
              {q && (
                <button
                  onClick={() => setQ('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs opacity-50 hover:opacity-100 p-1"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              className="input sm:w-64"
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
            >
              <option value="">All Dosage Forms ({meds.length})</option>
              {activeStockCategories.map((c) => (
                <option key={c} value={c}>
                  {c} ({categoryCounts[c] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Quick-filter Category Pills */}
          {activeStockCategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar text-xs">
              <button
                onClick={() => setCatFilter('')}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition ${
                  catFilter === ''
                    ? 'bg-med-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                All ({meds.length})
              </button>
              {activeStockCategories.map((c) => {
                const count = categoryCounts[c] || 0;
                const isSelected = catFilter === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCatFilter(isSelected ? '' : c)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-med-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{c}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {stockShown.length === 0 ? (
            <div className="card">
              <Empty
                title={q || catFilter ? 'No medicines match filter' : 'No medicines in stock'}
                desc={
                  q || catFilter
                    ? `No medicine found under "${catFilter || 'All'}" matching "${q}". Try clearing filters.`
                    : 'Add pharmaceutical stock to make it available for doctors to prescribe.'
                }
                action={
                  q || catFilter ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setQ('');
                        setCatFilter('');
                      }}
                    >
                      Clear filters
                    </button>
                  ) : isPharma ? (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowMed(true)}>
                      <Plus size={15} /> Add first medicine
                    </button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="table-wrap">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Type / Category</th>
                    <th>Stock</th>
                    <th>Level</th>
                    <th>Price</th>
                    <th>Expiry</th>
                    {isPharma && <th className="!text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {stockShown.map((m) => {
                    const isLow = Number(m.stock_quantity) <= Number(m.reorder_level);
                    const badgeCls = MEDICINE_BADGE_COLORS[m.category] || 'b-slate';
                    return (
                      <tr key={m.id}>
                        <td>
                          <div>
                            <span className="font-semibold">{m.name}</span>{' '}
                            {m.strength && <span className="opacity-55 text-[13px]">{m.strength}</span>}
                            {isLow && (
                              <span className="ml-2 badge b-amber text-[10px] py-0.5">
                                <AlertTriangle size={10} /> Low
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${badgeCls}`}>{m.category || 'Tablet'}</span>
                        </td>
                        <td className="font-bold">
                          {m.stock_quantity}{' '}
                          <span className="font-normal opacity-50 text-xs">/ min {m.reorder_level}</span>
                        </td>
                        <td className="w-40">
                          <Meter
                            value={Number(m.stock_quantity)}
                            max={Math.max(Number(m.reorder_level) * 3, 10)}
                            color={isLow ? '#d99a0b' : '#0d9488'}
                          />
                        </td>
                        <td>₹{Number(m.unit_price || 0).toLocaleString('en-IN')}</td>
                        <td className="text-[13px]">{m.expiry_date ? fmtDate(m.expiry_date) : '—'}</td>
                        {isPharma && (
                          <td className="!text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                className="btn btn-ghost btn-sm !px-1.5"
                                onClick={() => adjust(m, -10)}
                                title="Issue 10 items"
                                aria-label="Reduce"
                              >
                                <Minus size={13} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm !px-1.5"
                                onClick={() => adjust(m, 50)}
                                title="Add 50 items"
                                aria-label="Add"
                              >
                                <Plus size={13} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm !px-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                onClick={() => startEditMed(m)}
                                title="Edit medicine"
                                aria-label="Edit medicine"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm !px-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                onClick={() => setDeleteMedConfirm(m)}
                                title="Delete medicine"
                                aria-label="Delete medicine"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
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

      {/* ============================================================== */}
      {/* ADD MEDICINE MODAL */}
      {/* ============================================================== */}
      {showMed && (
        <Modal title="Add medicine" subtitle="Adds to dispensary stock with dosage form classification." onClose={() => setShowMed(false)}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name" required>
              <input
                className="input"
                value={medForm.name}
                onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                placeholder="Paracetamol"
              />
            </Field>

            <Field label="Strength / Concentration">
              <input
                className="input"
                value={medForm.strength}
                onChange={(e) => setMedForm({ ...medForm, strength: e.target.value })}
                placeholder="500 mg, 100 ml, 10 mg/ml"
              />
            </Field>

            <Field label="Dosage Form / Category" required>
              <select
                className="input"
                value={medForm.category}
                onChange={(e) => setMedForm({ ...medForm, category: e.target.value })}
              >
                {MEDICINE_CATEGORY_GROUPS.map((grp) => (
                  <optgroup key={grp.group} label={grp.group}>
                    {grp.items.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>

            <Field label="Manufacturer / Supplier">
              <input
                className="input"
                value={medForm.supplier}
                onChange={(e) => setMedForm({ ...medForm, supplier: e.target.value })}
                placeholder="e.g. Cipla, Sun Pharma, Alkem"
              />
            </Field>

            <Field label="Opening stock">
              <input
                type="number"
                min="0"
                className="input"
                value={medForm.stock_quantity}
                onChange={(e) => setMedForm({ ...medForm, stock_quantity: e.target.value })}
                placeholder="100"
              />
            </Field>

            <Field label="Reorder level (Min stock alert)">
              <input
                type="number"
                min="0"
                className="input"
                value={medForm.reorder_level}
                onChange={(e) => setMedForm({ ...medForm, reorder_level: e.target.value })}
                placeholder="50"
              />
            </Field>

            <Field label="Unit price (₹)">
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={medForm.unit_price}
                onChange={(e) => setMedForm({ ...medForm, unit_price: e.target.value })}
                placeholder="12.50"
              />
            </Field>

            <Field label="Expiry date">
              <input
                type="date"
                className="input"
                value={medForm.expiry_date}
                onChange={(e) => setMedForm({ ...medForm, expiry_date: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-ghost" onClick={() => setShowMed(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={addMed}>
              Add medicine
            </button>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* EDIT MEDICINE MODAL */}
      {/* ============================================================== */}
      {editMed && (
        <Modal title="Edit medicine" subtitle={`ID #${editMed.id}`} onClose={() => setEditMed(null)}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name" required>
              <input
                className="input"
                value={editMedForm.name}
                onChange={(e) => setEditMedForm({ ...editMedForm, name: e.target.value })}
              />
            </Field>

            <Field label="Strength / Concentration">
              <input
                className="input"
                value={editMedForm.strength}
                onChange={(e) => setEditMedForm({ ...editMedForm, strength: e.target.value })}
                placeholder="500 mg, 100 ml"
              />
            </Field>

            <Field label="Dosage Form / Category" required>
              <select
                className="input"
                value={editMedForm.category}
                onChange={(e) => setEditMedForm({ ...editMedForm, category: e.target.value })}
              >
                {MEDICINE_CATEGORY_GROUPS.map((grp) => (
                  <optgroup key={grp.group} label={grp.group}>
                    {grp.items.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>

            <Field label="Manufacturer / Supplier">
              <input
                className="input"
                value={editMedForm.supplier}
                onChange={(e) => setEditMedForm({ ...editMedForm, supplier: e.target.value })}
              />
            </Field>

            <Field label="Current stock">
              <input
                type="number"
                min="0"
                className="input"
                value={editMedForm.stock_quantity}
                onChange={(e) => setEditMedForm({ ...editMedForm, stock_quantity: e.target.value })}
              />
            </Field>

            <Field label="Reorder level">
              <input
                type="number"
                min="0"
                className="input"
                value={editMedForm.reorder_level}
                onChange={(e) => setEditMedForm({ ...editMedForm, reorder_level: e.target.value })}
              />
            </Field>

            <Field label="Unit price (₹)">
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={editMedForm.unit_price}
                onChange={(e) => setEditMedForm({ ...editMedForm, unit_price: e.target.value })}
              />
            </Field>

            <Field label="Expiry date">
              <input
                type="date"
                className="input"
                value={editMedForm.expiry_date}
                onChange={(e) => setEditMedForm({ ...editMedForm, expiry_date: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-ghost" onClick={() => setEditMed(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={saveEditMed}>
              Save changes
            </button>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* DELETE MEDICINE CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {deleteMedConfirm && (
        <Modal title="Delete medicine" onClose={() => setDeleteMedConfirm(null)}>
          <div className="py-2">
            <p className="text-sm">
              Are you sure you want to delete <strong className="font-semibold text-red-600">{deleteMedConfirm.name}</strong> ({deleteMedConfirm.category}) from pharmacy stock?
            </p>
            <p className="text-xs opacity-60 mt-2">
              Current stock: {deleteMedConfirm.stock_quantity} units. This item will no longer appear in the pharmacy dispensary.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-ghost" onClick={() => setDeleteMedConfirm(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={deleteMed}>
              Confirm Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
