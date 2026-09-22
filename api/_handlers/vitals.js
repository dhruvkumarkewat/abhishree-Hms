import supabase from './db-client.js';

function mapVitals(r) {
  if (!r) return r;
  return {
    ...r,
    bp: r.blood_pressure || r.bp || '',
    pulse: r.heart_rate || r.pulse || null,
    temp: r.temperature || r.temp || '',
  };
}

function sanitizeVitals(body) {
  const p = { ...body };
  if (p.bp && !p.blood_pressure) {
    p.blood_pressure = String(p.bp);
  }
  if (p.pulse && !p.heart_rate) {
    p.heart_rate = Number(p.pulse) || null;
  }
  if (p.temp && !p.temperature) {
    p.temperature = String(p.temp);
  }
  if (p.spo2 !== undefined && p.spo2 !== null && p.spo2 !== '') {
    p.spo2 = Number(p.spo2) || null;
  }
  if (p.patient_id !== undefined && p.patient_id !== null && p.patient_id !== '') {
    p.patient_id = Number(p.patient_id);
  }
  delete p.bp;
  delete p.pulse;
  delete p.temp;
  delete p.note;
  return p;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      let q = supabase.from('vitals').select('*').order('id', { ascending: false }).limit(100);
      if (req.query?.patient_id) q = q.eq('patient_id', req.query.patient_id);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json((data || []).map(mapVitals));
    }
    if (req.method === 'POST') {
      const payload = sanitizeVitals(req.body);
      delete payload.id;
      const { data, error } = await supabase.from('vitals').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(mapVitals(data));
    }
    if (req.method === 'PUT') {
      const { id, created_at, ...raw } = req.body;
      const payload = sanitizeVitals(raw);
      const { data, error } = await supabase.from('vitals').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(mapVitals(data));
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('vitals').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (vitals):', err);
    res.status(500).json({ error: err.message });
  }
}
