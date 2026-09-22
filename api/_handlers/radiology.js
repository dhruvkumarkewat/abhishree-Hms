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

function mapRadiology(r) {
  if (!r) return r;
  return {
    ...r,
    report: r.findings || r.report || '',
    report_date: r.reported_date || r.report_date || null,
  };
}

function sanitizeRadiology(body) {
  const p = { ...body };
  delete p.patient;
  if (p.report !== undefined && !p.findings) {
    p.findings = p.report;
  }
  if (p.report_date !== undefined && !p.reported_date) {
    p.reported_date = p.report_date;
  }
  if (p.patient_id !== undefined && p.patient_id !== null && p.patient_id !== '') {
    p.patient_id = Number(p.patient_id);
  }
  delete p.report;
  delete p.report_date;
  return p;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      let q = supabase.from('radiology').select('*').order('id', { ascending: false });
      if (req.query?.patient_id) q = q.eq('patient_id', req.query.patient_id);
      if (req.query?.status) q = q.eq('status', req.query.status);
      const { data, error } = await q;
      if (error) throw error;
      const enriched = await enrich(data);
      return res.status(200).json(enriched.map(mapRadiology));
    }
    if (req.method === 'POST') {
      const payload = sanitizeRadiology(req.body);
      delete payload.id;
      const { data, error } = await supabase.from('radiology').insert(payload).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(201).json(mapRadiology(one));
    }
    if (req.method === 'PUT') {
      const { id, created_at, ...raw } = req.body;
      const payload = sanitizeRadiology(raw);
      const { data, error } = await supabase.from('radiology').update(payload).eq('id', id).select().single();
      if (error) throw error;
      const [one] = await enrich([data]);
      return res.status(200).json(mapRadiology(one));
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('radiology').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (radiology):', err);
    res.status(500).json({ error: err.message });
  }
}
