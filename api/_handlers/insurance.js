import supabase from './db-client.js';

async function enrich(rows) {
  if (!rows || rows.length === 0) return rows;
  const pIds = [...new Set(rows.map((r) => r.patient_id).filter(Boolean))];
  if (!pIds.length) return rows;
  const { data } = await supabase.from('patients').select('id,patient_id,name').in('id', pIds);
  const map = {};
  (data || []).forEach((p) => { map[p.id] = p; });
  return rows.map((r) => ({ ...r, patient: map[r.patient_id] || null }));
}

const ALLOWED_INSURANCE_COLS = new Set([
  'patient_id',
  'provider',
  'policy_number',
  'claim_amount',
  'approved_amount',
  'status',
  'filed_date',
  'filed_by',
  'notes',
]);

function sanitizeInsurance(body) {
  const raw = { ...body };
  if (raw.provider_name && !raw.provider) {
    raw.provider = raw.provider_name;
  }
  if (raw.claim_date && !raw.filed_date) {
    raw.filed_date = raw.claim_date;
  }
  if (!raw.filed_date) {
    raw.filed_date = new Date().toISOString().slice(0, 10);
  }
  const clean = {};
  for (const [k, v] of Object.entries(raw)) {
    if (ALLOWED_INSURANCE_COLS.has(k)) {
      clean[k] = v;
    }
  }
  if (clean.patient_id !== undefined && clean.patient_id !== null && clean.patient_id !== '') {
    clean.patient_id = Number(clean.patient_id);
  }
  if (clean.claim_amount !== undefined && clean.claim_amount !== null && clean.claim_amount !== '') {
    clean.claim_amount = Number(clean.claim_amount);
  }
  if (clean.approved_amount !== undefined && clean.approved_amount !== null && clean.approved_amount !== '') {
    clean.approved_amount = Number(clean.approved_amount);
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
      let q = supabase.from('insurance_claims').select('*').order('id', { ascending: false });
      if (req.query?.patient_id) q = q.eq('patient_id', req.query.patient_id);
      if (req.query?.status) q = q.eq('status', req.query.status);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(await enrich(data));
    }
    if (req.method === 'POST') {
      const payload = sanitizeInsurance(req.body);
      delete payload.id;
      const { data, error } = await supabase.from('insurance_claims').insert(payload).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(201).json(one);
    }
    if (req.method === 'PUT') {
      const { id, created_at, ...raw } = req.body;
      const payload = sanitizeInsurance(raw);
      const { data, error } = await supabase.from('insurance_claims').update(payload).eq('id', id).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(200).json(one);
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('insurance_claims').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (insurance):', err);
    res.status(500).json({ error: err.message });
  }
}
