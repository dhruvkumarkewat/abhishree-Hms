import supabase from './db-client.js';

function mapDoctor(d) {
  if (!d) return d;
  return {
    ...d,
    schedule: d.schedule || (d.available_days && d.available_time ? `${d.available_days} · ${d.available_time}` : d.available_days || d.available_time || 'Mon–Sat · 10:00–14:00'),
  };
}

function sanitizeDoctor(body) {
  const p = { ...body };
  if (p.schedule && (!p.available_days || !p.available_time)) {
    const parts = String(p.schedule).split(/[·•|]/);
    if (parts.length >= 2) {
      p.available_days = p.available_days || parts[0].trim();
      p.available_time = p.available_time || parts[1].trim();
    } else {
      p.available_days = p.available_days || p.schedule;
    }
  }
  delete p.schedule;
  if (p.consultation_fee !== undefined && p.consultation_fee !== null && p.consultation_fee !== '') {
    p.consultation_fee = Number(p.consultation_fee);
  }
  if (p.experience_years !== undefined && p.experience_years !== null && p.experience_years !== '') {
    p.experience_years = Number(p.experience_years);
  }
  return p;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      let q = supabase.from('doctors').select('*').order('id', { ascending: true });
      if (req.query?.department_id) q = q.eq('department_id', req.query.department_id);
      if (req.query?.status) q = q.eq('status', req.query.status);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json((data || []).map(mapDoctor));
    }
    if (req.method === 'POST') {
      const payload = sanitizeDoctor(req.body);
      delete payload.id;
      const { data, error } = await supabase.from('doctors').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(mapDoctor(data));
    }
    if (req.method === 'PUT') {
      const { id, created_at, ...raw } = req.body;
      const payload = sanitizeDoctor(raw);
      const { data, error } = await supabase.from('doctors').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(mapDoctor(data));
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('doctors').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (doctors):', err);
    res.status(500).json({ error: err.message });
  }
}
