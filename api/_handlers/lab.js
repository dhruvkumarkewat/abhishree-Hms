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

function mapLab(r) {
  if (!r) return r;
  return {
    ...r,
    result: r.report_text || r.result || '',
    result_date: r.completed_date || r.result_date || null,
  };
}

const ALLOWED_LAB_COLS = new Set([
  'patient_id',
  'test_name',
  'category',
  'priority',
  'status',
  'results',
  'report_text',
  'ordered_date',
  'completed_date',
  'ordered_by',
  'conducted_by',
  'notes',
]);

function sanitizeLab(body) {
  const raw = { ...body };
  if (raw.doctor_name && !raw.ordered_by) {
    raw.ordered_by = raw.doctor_name;
  }
  if (raw.result !== undefined && !raw.report_text) {
    raw.report_text = raw.result;
  }
  if (raw.result_date !== undefined && !raw.completed_date) {
    raw.completed_date = raw.result_date;
  }
  if (raw.patient_id !== undefined && raw.patient_id !== null && raw.patient_id !== '') {
    raw.patient_id = Number(raw.patient_id);
  }
  const clean = {};
  for (const [k, v] of Object.entries(raw)) {
    if (ALLOWED_LAB_COLS.has(k)) {
      clean[k] = v;
    }
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
      let q = supabase.from('lab_tests').select('*').order('id', { ascending: false });
      if (req.query?.patient_id) q = q.eq('patient_id', req.query.patient_id);
      if (req.query?.status) q = q.eq('status', req.query.status);
      const { data, error } = await q;
      if (error) throw error;
      const enriched = await enrich(data);
      return res.status(200).json(enriched.map(mapLab));
    }
    if (req.method === 'POST') {
      const payload = sanitizeLab(req.body);
      delete payload.id;
      const { data, error } = await supabase.from('lab_tests').insert(payload).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(201).json(mapLab(one));
    }
    if (req.method === 'PUT') {
      const { id, created_at, ...raw } = req.body;
      const payload = sanitizeLab(raw);
      const { data, error } = await supabase.from('lab_tests').update(payload).eq('id', id).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(200).json(mapLab(one));
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('lab_tests').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (lab):', err);
    res.status(500).json({ error: err.message });
  }
}
