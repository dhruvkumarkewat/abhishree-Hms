import supabase from './db-client.js';

function sanitizeMedicine(body) {
  const p = { ...body };
  if (p.supplier && !p.manufacturer) {
    p.manufacturer = p.supplier;
  }
  if (p.strength && p.name && !p.name.includes(p.strength)) {
    p.name = `${p.name} ${p.strength}`.trim();
  }
  delete p.supplier;
  delete p.strength;
  if (p.stock_quantity !== undefined && p.stock_quantity !== null && p.stock_quantity !== '') {
    p.stock_quantity = Number(p.stock_quantity);
  }
  if (p.reorder_level !== undefined && p.reorder_level !== null && p.reorder_level !== '') {
    p.reorder_level = Number(p.reorder_level);
  }
  if (p.unit_price !== undefined && p.unit_price !== null && p.unit_price !== '') {
    p.unit_price = Number(p.unit_price);
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
      let q = supabase.from('medicines').select('*').order('name', { ascending: true });
      if (req.query?.category) q = q.eq('category', req.query.category);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const payload = sanitizeMedicine(req.body);
      delete payload.id;
      const { data, error } = await supabase.from('medicines').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, created_at, ...raw } = req.body;
      const payload = sanitizeMedicine(raw);
      const { data, error } = await supabase.from('medicines').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('medicines').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (medicines):', err);
    res.status(500).json({ error: err.message });
  }
}
