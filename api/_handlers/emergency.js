import supabase from './db-client.js';

function mapRow(r) {
  if (!r) return r;
  return {
    ...r,
    complaint: r.chief_complaint || r.complaint,
    doctor_name: r.attending_doctor || r.doctor_name,
  };
}

function sanitizePayload(body) {
  const p = { ...body };
  if (p.complaint && !p.chief_complaint) {
    p.chief_complaint = p.complaint;
  }
  if (p.doctor_name && !p.attending_doctor) {
    p.attending_doctor = p.doctor_name;
  }
  if (p.age !== undefined && p.age !== null && p.age !== '') {
    p.age = Number(p.age);
  }
  // Strip non-schema properties
  delete p.complaint;
  delete p.doctor_name;
  delete p.arrival_date;
  delete p.created_by;
  return p;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      let q = supabase.from('emergency_cases').select('*').order('id', { ascending: false });
      if (req.query?.status) q = q.eq('status', req.query.status);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json((data || []).map(mapRow));
    }
    if (req.method === 'POST') {
      const payload = sanitizePayload(req.body);
      delete payload.id;
      if (!payload.case_id || !String(payload.case_id).trim()) {
        payload.case_id = `EMG-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      const { data, error } = await supabase.from('emergency_cases').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(mapRow(data));
    }
    if (req.method === 'PUT') {
      const { id, created_at, ...raw } = req.body;
      const payload = sanitizePayload(raw);
      const { data, error } = await supabase.from('emergency_cases').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(mapRow(data));
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('emergency_cases').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (emergency):', err);
    res.status(500).json({ error: err.message });
  }
}
