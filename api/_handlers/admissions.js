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
      const payload = { ...req.body };
      delete payload.id;
      delete payload.patient;
      if (payload.patient_id !== undefined && payload.patient_id !== null && payload.patient_id !== '') {
        payload.patient_id = Number(payload.patient_id);
      }
      if (payload.doctor_id !== undefined && payload.doctor_id !== null && payload.doctor_id !== '') {
        payload.doctor_id = Number(payload.doctor_id);
      }
      if (payload.bed_id !== undefined && payload.bed_id !== null && payload.bed_id !== '') {
        payload.bed_id = Number(payload.bed_id);
      }
      const { data, error } = await supabase.from('admissions').insert(payload).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(201).json(one);
    }
    if (req.method === 'PUT') {
      const { id, created_at, ...payload } = req.body;
      delete payload.patient;
      if (payload.patient_id !== undefined && payload.patient_id !== null && payload.patient_id !== '') {
        payload.patient_id = Number(payload.patient_id);
      }
      if (payload.doctor_id !== undefined && payload.doctor_id !== null && payload.doctor_id !== '') {
        payload.doctor_id = Number(payload.doctor_id);
      }
      if (payload.bed_id !== undefined && payload.bed_id !== null && payload.bed_id !== '') {
        payload.bed_id = Number(payload.bed_id);
      }
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
