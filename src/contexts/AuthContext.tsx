import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import supabase from '../lib/supabase';
import { DEMO_USERS, sessionFromDemo, type SessionUser } from '../lib/roles';

interface AuthCtx {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, signIn: async () => ({ ok: false }), signOut: async () => {} });

const KEY = 'abhishree_session';

function readLocal(): SessionUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) local demo session
    const local = readLocal();
    if (local) {
      setUser(local);
      setLoading(false);
      return;
    }
    // 2) real supabase session (email/google)
    const isDummy = import.meta.env.VITE_SUPABASE_URL?.includes('abcdefghijklmnopqr');
    if (isDummy) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const demo = DEMO_USERS.find((d) => d.email.toLowerCase() === session.user.email!.toLowerCase());
        if (demo) {
          const s = sessionFromDemo(demo);
          setUser(s);
          localStorage.setItem(KEY, JSON.stringify(s));
        } else {
          // Any other authenticated user becomes a Patient-role explorer
          const nm = session.user.user_metadata?.full_name || session.user.email!.split('@')[0];
          const s: SessionUser = { name: nm, email: session.user.email!, role: 'Patient' };
          setUser(s);
          localStorage.setItem(KEY, JSON.stringify(s));
        }
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) return;
      if (readLocal()) return;
      const email = session.user.email!;
      const demo = DEMO_USERS.find((d) => d.email.toLowerCase() === email.toLowerCase());
      const s = demo ? sessionFromDemo(demo) : { name: session.user.user_metadata?.full_name || email.split('@')[0], email, role: 'Patient' as const };
      setUser(s);
      localStorage.setItem(KEY, JSON.stringify(s));
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const e = email.trim().toLowerCase();
    const demo = DEMO_USERS.find((d) => d.email.toLowerCase() === e);
    const isDummy = import.meta.env.VITE_SUPABASE_URL?.includes('abcdefghijklmnopqr');
    if (demo) {
      if (password !== demo.password) {
        // still try real supabase auth (seeded users share these passwords)
        if (isDummy) return { ok: false, error: 'Incorrect password for this demo account.' };
        try {
          const { error } = await supabase.auth.signInWithPassword({ email: e, password });
          if (error) return { ok: false, error: 'Incorrect password for this demo account.' };
        } catch {
          return { ok: false, error: 'Incorrect password for this demo account.' };
        }
      }
      // Establish supabase session in background (best effort)
      if (!isDummy) supabase.auth.signInWithPassword({ email: e, password: demo.password }).catch(() => {});
      const s = sessionFromDemo(demo);
      setUser(s);
      localStorage.setItem(KEY, JSON.stringify(s));
      return { ok: true };
    }
    // Non-demo: real supabase auth
    if (isDummy) return { ok: false, error: 'Sign in failed. Ensure Supabase is configured.' };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: e, password });
      if (error) return { ok: false, error: error.message };
      const em = data.user?.email || e;
      const s: SessionUser = { name: data.user?.user_metadata?.full_name || em.split('@')[0], email: em, role: 'Patient' };
      setUser(s);
      localStorage.setItem(KEY, JSON.stringify(s));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Sign in failed.' };
    }
  };

  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch { /* noop */ }
    localStorage.removeItem(KEY);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, signIn, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
