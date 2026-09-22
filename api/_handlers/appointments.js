import supabase from './db-client.js';

async function enrich(rows) {
  if (!rows || rows.length === 0) return rows;
  const pIds = [...new Set(rows.map((r) => r.patient_id).filter(Boolean))];
  const dIds = [...new Set(rows.map((r) => r.doctor_id).filter(Boolean))];
  const pMap = {};
  const dMap = {};
  if (pIds.length) {
    const { data } = await supabase.from('patients').select('id,patient_id,name,age,gender,phone').in('id', pIds);
    (data || []).forEach((p) => { pMap[p.id] = p; });
  }
  if (dIds.length) {
    const { data } = await supabase.from('doctors').select('id,name,specialty').in('id', dIds);
    (data || []).forEach((d) => { dMap[d.id] = d; });
  }
  return rows.map((r) => ({ ...r, patient: pMap[r.patient_id] || null, doctor: dMap[r.doctor_id] || null }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      let q = supabase.from('appointments').select('*').order('date', { ascending: true }).order('time', { ascending: true });
      if (req.query?.date) q = q.eq('date', req.query.date);
      if (req.query?.doctor_id) q = q.eq('doctor_id', req.query.doctor_id);
      if (req.query?.patient_id) q = q.eq('patient_id', req.query.patient_id);
      if (req.query?.status) q = q.eq('status', req.query.status);
      if (req.query?.department) q = q.eq('department', req.query.department);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(await enrich(data));
    }
    if (req.method === 'POST') {
      const payload = { ...req.body };
      delete payload.id;
      delete payload.patient;
      delete payload.doctor;
      if (payload.patient_id !== undefined && payload.patient_id !== null && payload.patient_id !== '') {
        payload.patient_id = Number(payload.patient_id);
      }
      if (payload.doctor_id !== undefined && payload.doctor_id !== null && payload.doctor_id !== '') {
        payload.doctor_id = Number(payload.doctor_id);
      }
      const { data, error } = await supabase.from('appointments').insert(payload).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(201).json(one);
    }
    if (req.method === 'PUT') {
      const { id, created_at, ...payload } = req.body;
      delete payload.patient;
      delete payload.doctor;
      if (payload.patient_id !== undefined && payload.patient_id !== null && payload.patient_id !== '') {
        payload.patient_id = Number(payload.patient_id);
      }
      if (payload.doctor_id !== undefined && payload.doctor_id !== null && payload.doctor_id !== '') {
        payload.doctor_id = Number(payload.doctor_id);
      }
      const { data, error } = await supabase.from('appointments').update(payload).eq('id', id).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(200).json(one);
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (appointments):', err);
    res.status(500).json({ error: err.message });
  }
}
