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

const ALLOWED_VITALS_COLS = new Set([
  'patient_id',
  'temperature',
  'blood_pressure',
  'heart_rate',
  'respiratory_rate',
  'spo2',
  'weight',
  'recorded_by',
  'recorded_at',
]);

function sanitizeVitals(body) {
  const raw = { ...body };
  if (raw.bp && !raw.blood_pressure) {
    raw.blood_pressure = String(raw.bp);
  }
  if (raw.pulse && !raw.heart_rate) {
    raw.heart_rate = Number(raw.pulse) || null;
  }
  if (raw.temp && !raw.temperature) {
    raw.temperature = String(raw.temp);
  }
  if (raw.oxygen_saturation !== undefined && raw.spo2 === undefined) {
    raw.spo2 = Number(raw.oxygen_saturation) || null;
  }
  if (!raw.recorded_at) {
    raw.recorded_at = new Date().toISOString();
  }
  const clean = {};
  for (const [k, v] of Object.entries(raw)) {
    if (ALLOWED_VITALS_COLS.has(k)) {
      clean[k] = v;
    }
  }
  if (clean.patient_id !== undefined && clean.patient_id !== null && clean.patient_id !== '') {
    clean.patient_id = Number(clean.patient_id);
  }
  if (clean.spo2 !== undefined && clean.spo2 !== null && clean.spo2 !== '') {
    clean.spo2 = Number(clean.spo2) || null;
  }
  if (clean.heart_rate !== undefined && clean.heart_rate !== null && clean.heart_rate !== '') {
    clean.heart_rate = Number(clean.heart_rate) || null;
  }
  if (clean.respiratory_rate !== undefined && clean.respiratory_rate !== null && clean.respiratory_rate !== '') {
    clean.respiratory_rate = Number(clean.respiratory_rate) || null;
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
