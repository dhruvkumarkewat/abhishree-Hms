import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      let q = supabase.from('beds').select('*').order('ward', { ascending: true }).order('bed_number', { ascending: true });
      if (req.query?.status) q = q.eq('status', req.query.status);
      if (req.query?.category) q = q.eq('category', req.query.category);
      if (req.query?.ward) q = q.eq('ward', req.query.ward);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { data, error } = await supabase.from('beds').insert(req.body).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...payload } = req.body;
      const { data, error } = await supabase.from('beds').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('beds').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (beds):', err);
    res.status(500).json({ error: err.message });
  }
}
