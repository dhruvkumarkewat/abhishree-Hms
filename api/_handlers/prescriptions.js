import supabase from './db-client.js';

async function enrich(rows) {
  if (!rows || rows.length === 0) return rows;
  const pIds = [...new Set(rows.map((r) => r.patient_id).filter(Boolean))];
  if (!pIds.length) return rows;
  const { data } = await supabase.from('patients').select('id,patient_id,name,age,gender').in('id', pIds);
  const map = {};
  (data || []).forEach((p) => { map[p.id] = p; });
  return rows.map((r) => ({ ...r, patient: map[r.patient_id] || null }));
}

const ALLOWED_PRESCRIPTION_COLS = new Set([
  'patient_id',
  'doctor_id',
  'doctor_name',
  'diagnosis',
  'items',
  'instructions',
  'status',
  'prescribed_date',
  'dispensed_at',
]);

function sanitizePrescription(body) {
  const raw = { ...body };
  if (raw.medicines && !raw.items) {
    raw.items = raw.medicines;
  }
  if (raw.notes && !raw.instructions) {
    raw.instructions = raw.notes;
  }
  if (raw.dispensed_date && !raw.dispensed_at) {
    raw.dispensed_at = raw.dispensed_date;
  }
  if (!raw.prescribed_date) {
    raw.prescribed_date = new Date().toISOString().split('T')[0];
  }
  const clean = {};
  for (const [k, v] of Object.entries(raw)) {
    if (ALLOWED_PRESCRIPTION_COLS.has(k)) {
      clean[k] = v;
    }
  }
  if (clean.patient_id !== undefined && clean.patient_id !== null && clean.patient_id !== '') {
    clean.patient_id = Number(clean.patient_id);
  }
  if (clean.doctor_id !== undefined && clean.doctor_id !== null && clean.doctor_id !== '') {
    clean.doctor_id = Number(clean.doctor_id);
  }
  if (!clean.items || !Array.isArray(clean.items)) {
    clean.items = [];
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
      let q = supabase.from('prescriptions').select('*').order('id', { ascending: false });
      if (req.query?.patient_id) q = q.eq('patient_id', req.query.patient_id);
      if (req.query?.status) q = q.eq('status', req.query.status);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(await enrich(data));
    }
    if (req.method === 'POST') {
      const payload = sanitizePrescription(req.body);
      delete payload.id;
      const { data, error } = await supabase.from('prescriptions').insert(payload).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(201).json(one);
    }
    if (req.method === 'PUT') {
      const { id, created_at, ...raw } = req.body;
      const payload = sanitizePrescription(raw);
      const { data, error } = await supabase.from('prescriptions').update(payload).eq('id', id).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(200).json(one);
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('prescriptions').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (prescriptions):', err);
    res.status(500).json({ error: err.message });
  }
}
