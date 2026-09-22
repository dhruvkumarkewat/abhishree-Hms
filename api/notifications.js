import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      let q = supabase.from('notifications').select('*').order('id', { ascending: false }).limit(60);
      if (req.query?.role) q = q.or(`target_role.eq.${req.query.role},target_role.eq.All`);
      if (req.query?.unread === 'true') q = q.eq('is_read', false);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { data, error } = await supabase.from('notifications').insert(req.body).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      if (req.body?.mark_all && req.body?.role) {
        const { error } = await supabase.from('notifications').update({ is_read: true }).or(`target_role.eq.${req.body.role},target_role.eq.All`);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }
      const { id, ...payload } = req.body;
      const { data, error } = await supabase.from('notifications').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (notifications):', err);
    res.status(500).json({ error: err.message });
  }
}
