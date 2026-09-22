import supabase from './db-client.js';

async function enrich(rows) {
  if (!rows || rows.length === 0) return rows;
  const pIds = [...new Set(rows.map((r) => r.patient_id).filter(Boolean))];
  if (!pIds.length) return rows;
  const { data } = await supabase.from('patients').select('id,patient_id,name,age,gender,phone').in('id', pIds);
  const map = {};
  (data || []).forEach((p) => { map[p.id] = p; });
  return rows.map((r) => ({ ...r, patient: map[r.patient_id] || null }));
}

const ALLOWED_ADMISSION_COLS = new Set([
  'patient_id',
  'doctor_id',
  'doctor_name',
  'department',
  'ward',
  'room_number',
  'bed_id',
  'bed_number',
  'admission_date',
  'discharge_date',
  'expected_discharge',
  'reason',
  'status',
  'condition',
  'admitted_by',
]);

function sanitizeAdmission(body) {
  const raw = { ...body };
  if (raw.attending_doctor && !raw.doctor_name) {
    raw.doctor_name = raw.attending_doctor;
  }
  if (raw.diagnosis && !raw.reason) {
    raw.reason = raw.diagnosis;
  }
  const clean = {};
  for (const [k, v] of Object.entries(raw)) {
    if (ALLOWED_ADMISSION_COLS.has(k)) {
      clean[k] = v;
    }
  }
  if (clean.patient_id !== undefined && clean.patient_id !== null && clean.patient_id !== '') {
    clean.patient_id = Number(clean.patient_id);
  }
  if (clean.doctor_id !== undefined && clean.doctor_id !== null && clean.doctor_id !== '') {
    clean.doctor_id = Number(clean.doctor_id);
  }
  if (clean.bed_id !== undefined && clean.bed_id !== null && clean.bed_id !== '') {
    clean.bed_id = Number(clean.bed_id);
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
      let q = supabase.from('admissions').select('*').order('id', { ascending: false });
      if (req.query?.status) q = q.eq('status', req.query.status);
      if (req.query?.patient_id) q = q.eq('patient_id', req.query.patient_id);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(await enrich(data));
    }
    if (req.method === 'POST') {
      const payload = sanitizeAdmission(req.body);
      delete payload.id;
      const { data, error } = await supabase.from('admissions').insert(payload).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(201).json(one);
    }
    if (req.method === 'PUT') {
      const { id, created_at, ...raw } = req.body;
      const payload = sanitizeAdmission(raw);
      const { data, error } = await supabase.from('admissions').update(payload).eq('id', id).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(200).json(one);
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('admissions').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (admissions):', err);
    res.status(500).json({ error: err.message });
  }
}
