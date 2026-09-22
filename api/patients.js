import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      let q = supabase.from('patients').select('*').order('id', { ascending: true });
      if (req.query?.status) q = q.eq('status', req.query.status);
      if (req.query?.search) q = q.or(`name.ilike.%${req.query.search}%,patient_id.ilike.%${req.query.search}%,phone.ilike.%${req.query.search}%`);
      if (req.query?.user_email) q = q.eq('user_email', req.query.user_email);
      if (req.query?.limit) q = q.limit(Number(req.query.limit));
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { data, error } = await supabase.from('patients').insert(req.body).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...payload } = req.body;
      const { data, error } = await supabase.from('patients').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (patients):', err);
    res.status(500).json({ error: err.message });
  }
}
