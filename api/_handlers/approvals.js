import supabase from './db-client.js';

function mapApproval(r) {
  if (!r) return r;
  return {
    ...r,
    requester: r.requested_by || r.requester || '',
    details: r.reason || r.details || '',
    date: r.created_at || r.date || new Date().toISOString(),
  };
}

function sanitizeApproval(body) {
  const p = { ...body };
  if (p.requester && !p.requested_by) {
    p.requested_by = p.requester;
  }
  if (p.details && !p.reason) {
    p.reason = p.details;
  }
  if (p.amount !== undefined && p.amount !== null && p.amount !== '') {
    p.amount = Number(p.amount);
  }
  delete p.requester;
  delete p.details;
  delete p.date;
  delete p.role;
  return p;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      let q = supabase.from('approvals').select('*').order('created_at', { ascending: false });
      if (req.query?.status && req.query.status !== 'All') q = q.eq('status', req.query.status);
      if (req.query?.type) q = q.eq('type', req.query.type);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json((data || []).map(mapApproval));
    }
    if (req.method === 'POST') {
      const payload = sanitizeApproval(req.body);
      delete payload.id;
      if (!payload.type) payload.type = 'General';
      if (!payload.requested_by) payload.requested_by = 'Staff';
      if (!payload.status) payload.status = 'Pending';
      const { data, error } = await supabase.from('approvals').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(mapApproval(data));
    }
    if (req.method === 'PUT') {
      const { id, created_at, ...raw } = req.body;
      const payload = sanitizeApproval(raw);
      payload.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('approvals').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(mapApproval(data));
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      const { error } = await supabase.from('approvals').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (approvals):', err);
    res.status(500).json({ error: err.message });
  }
}
