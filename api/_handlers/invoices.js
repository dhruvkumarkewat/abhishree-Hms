import supabase from './db-client.js';

async function enrich(rows) {
  if (!rows || rows.length === 0) return rows;
  const pIds = [...new Set(rows.map((r) => r.patient_id).filter(Boolean))];
  if (!pIds.length) return rows;
  const { data } = await supabase.from('patients').select('id,patient_id,name,phone').in('id', pIds);
  const map = {};
  (data || []).forEach((p) => { map[p.id] = p; });
  return rows.map((r) => ({ ...r, patient: map[r.patient_id] || null }));
}

const ALLOWED_INVOICE_COLS = new Set([
  'invoice_number',
  'patient_id',
  'total',
  'paid',
  'balance',
  'status',
  'payment_method',
  'items',
  'invoice_date',
]);

function sanitizeInvoice(body) {
  const raw = { ...body };
  if (raw.total_amount !== undefined && raw.total === undefined) {
    raw.total = raw.total_amount;
  }
  if (raw.paid_amount !== undefined && raw.paid === undefined) {
    raw.paid = raw.paid_amount;
  }
  if (raw.balance === undefined && raw.total !== undefined) {
    raw.balance = Math.max(0, Number(raw.total || 0) - Number(raw.paid || 0));
  }
  const clean = {};
  for (const [k, v] of Object.entries(raw)) {
    if (ALLOWED_INVOICE_COLS.has(k)) {
      clean[k] = v;
    }
  }
  if (clean.patient_id !== undefined && clean.patient_id !== null && clean.patient_id !== '') {
    clean.patient_id = Number(clean.patient_id);
  }
  if (clean.total !== undefined && clean.total !== null && clean.total !== '') {
    clean.total = Number(clean.total);
  }
  if (clean.paid !== undefined && clean.paid !== null && clean.paid !== '') {
    clean.paid = Number(clean.paid);
  }
  if (clean.balance !== undefined && clean.balance !== null && clean.balance !== '') {
    clean.balance = Number(clean.balance);
  }
  return clean;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      let q = supabase.from('invoices').select('*').order('id', { ascending: false });
      if (req.query?.patient_id) q = q.eq('patient_id', req.query.patient_id);
      if (req.query?.status) q = q.eq('status', req.query.status);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(await enrich(data));
    }
    if (req.method === 'POST') {
      const payload = sanitizeInvoice(req.body);
      delete payload.id;
      if (!payload.invoice_number || !String(payload.invoice_number).trim()) {
        payload.invoice_number = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      const { data, error } = await supabase.from('invoices').insert(payload).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(201).json(one);
    }
    if (req.method === 'PUT') {
      const { id, created_at, ...raw } = req.body;
      const payload = sanitizeInvoice(raw);
      const { data, error } = await supabase.from('invoices').update(payload).eq('id', id).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(200).json(one);
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (invoices):', err);
    res.status(500).json({ error: err.message });
  }
}
