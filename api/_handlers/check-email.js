import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const email = (req.query?.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email parameter required', exists: false });

  try {
    // 1. Check staff, doctors, patients
    const [s, d, p] = await Promise.all([
      supabase.from('staff').select('id').ilike('email', email).limit(1),
      supabase.from('doctors').select('id').ilike('email', email).limit(1),
      supabase.from('patients').select('id').ilike('email', email).limit(1),
    ]);

    let exists = Boolean(
      (s.data && s.data.length > 0) ||
      (d.data && d.data.length > 0) ||
      (p.data && p.data.length > 0)
    );

    // 2. If not found in tables, check Supabase Auth users via Admin API
    if (!exists && supabase.auth?.admin?.listUsers) {
      try {
        const { data } = await supabase.auth.admin.listUsers();
        if (data?.users?.some((u) => u.email?.toLowerCase() === email)) {
          exists = true;
        }
      } catch {
        /* ignore */
      }
    }

    return res.status(200).json({ exists });
  } catch (err) {
    return res.status(500).json({ error: err.message, exists: false });
  }
}
