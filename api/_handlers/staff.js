import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // 1. GET all staff
    if (req.method === 'GET') {
      let q = supabase.from('staff').select('*').order('id', { ascending: true });
      if (req.query?.role) q = q.eq('role', req.query.role);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }

    // 2. CREATE new staff + Auth credentials
    if (req.method === 'POST') {
      const { password, ...staffData } = req.body;
      const { data, error } = await supabase.from('staff').insert(staffData).select().single();
      if (error) throw error;

      if (staffData.email && password && password.trim().length >= 6) {
        try {
          await supabase.auth.admin.createUser({
            email: staffData.email.trim().toLowerCase(),
            password: password.trim(),
            email_confirm: true,
            user_metadata: {
              name: staffData.name,
              full_name: staffData.name,
              role: staffData.role,
              department: staffData.department,
            },
          });
        } catch (authErr) {
          console.warn('Supabase Auth user creation note:', authErr.message);
        }
      }

      return res.status(201).json(data);
    }

    // 3. UPDATE staff details + Edit Email & Password in Supabase Auth
    if (req.method === 'PUT') {
      const { id, password, ...payload } = req.body;

      // Find current staff record to check previous email
      let oldEmail = null;
      try {
        const { data: current } = await supabase.from('staff').select('email').eq('id', id).single();
        if (current?.email) oldEmail = current.email.trim().toLowerCase();
      } catch (e) {
        console.warn('Could not find existing staff email:', e);
      }

      // Update staff table
      const { data, error } = await supabase.from('staff').update(payload).eq('id', id).select().single();
      if (error) throw error;

      // Sync Email & Password changes to Supabase Auth
      const newEmail = payload.email ? payload.email.trim().toLowerCase() : oldEmail;
      try {
        const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (!listErr && usersData?.users) {
          const allUsers = usersData.users;
          const existing = allUsers.find(
            (u) =>
              (oldEmail && u.email?.toLowerCase() === oldEmail) ||
              (newEmail && u.email?.toLowerCase() === newEmail)
          );

          if (existing) {
            const updateParams = {
              user_metadata: {
                ...(existing.user_metadata || {}),
                name: payload.name || existing.user_metadata?.name,
                full_name: payload.name || existing.user_metadata?.name,
                role: payload.role || existing.user_metadata?.role,
                department: payload.department || existing.user_metadata?.department,
              },
            };

            if (newEmail && newEmail !== existing.email?.toLowerCase()) {
              updateParams.email = newEmail;
              updateParams.email_confirm = true;
            }

            if (password && password.trim().length >= 6) {
              updateParams.password = password.trim();
            }

            await supabase.auth.admin.updateUserById(existing.id, updateParams);
          } else if (newEmail && password && password.trim().length >= 6) {
            // If user did not exist in Auth, create them now
            await supabase.auth.admin.createUser({
              email: newEmail,
              password: password.trim(),
              email_confirm: true,
              user_metadata: {
                name: payload.name,
                full_name: payload.name,
                role: payload.role,
                department: payload.department,
              },
            });
          }
        }
      } catch (authErr) {
        console.warn('Supabase Auth sync error in staff PUT:', authErr.message);
      }

      return res.status(200).json(data);
    }

    // 4. DELETE staff + Remove from Supabase Auth
    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;

      try {
        const { data: current } = await supabase.from('staff').select('email').eq('id', id).single();
        if (current?.email) {
          const email = current.email.trim().toLowerCase();
          const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          const existing = usersData?.users?.find((u) => u.email?.toLowerCase() === email);
          if (existing) {
            await supabase.auth.admin.deleteUser(existing.id);
          }
        }
      } catch (err) {
        console.warn('Error deleting user from Auth:', err.message);
      }

      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error (staff):', err);
    res.status(500).json({ error: err.message });
  }
}
