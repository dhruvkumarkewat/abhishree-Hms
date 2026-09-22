import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import supabase from '../lib/supabase';
import { DEMO_USERS, type Role, type SessionUser } from '../lib/roles';

interface AuthCtx {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  signIn: async () => ({ ok: false }),
  signOut: async () => {},
  resetPasswordForEmail: async () => ({ ok: false }),
  updatePassword: async () => ({ ok: false }),
});

function resolveUserFromSession(sessionUser: any): SessionUser {
  const email = (sessionUser.email || '').toLowerCase();
  const meta = sessionUser.user_metadata || {};
  const demo = DEMO_USERS.find((d) => d.email.toLowerCase() === email);

  const role: Role = (meta.role as Role) || demo?.role || 'Patient';
  const name: string = meta.name || meta.full_name || demo?.name || email.split('@')[0];
  const link = meta.link || demo?.link;

  return { name, email, role, link };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check existing verified Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(resolveUserFromSession(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });

    // 2. Listen to real-time auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (!window.location.pathname.startsWith('/reset-password')) {
          const hash = window.location.hash || '';
          window.location.replace('/reset-password' + hash);
          return;
        }
      }
      if (session?.user) {
        setUser(resolveUserFromSession(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Strict Supabase Authentication (no bypass, passwords verified on server)
  const signIn = async (email: string, password: string) => {
    const e = email.trim().toLowerCase();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: e,
        password: password,
      });

      if (error) {
        return {
          ok: false,
          error: error.message || 'Invalid email or password. Please check your credentials.',
        };
      }

      if (!data.user || !data.session) {
        return { ok: false, error: 'Sign in failed. No active session established.' };
      }

      const verifiedUser = resolveUserFromSession(data.user);
      setUser(verifiedUser);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Authentication service error.' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* noop */
    }
    setUser(null);
  };

  const resetPasswordForEmail = async (email: string) => {
    const e = email.trim().toLowerCase();
    if (!e) return { ok: false, error: 'Please enter your email address.' };

    try {
      // 1. Verify if email exists in hospital records (staff, doctors, or patients)
      const [sRes, dRes, pRes] = await Promise.all([
        supabase.from('staff').select('id').ilike('email', e).limit(1),
        supabase.from('doctors').select('id').ilike('email', e).limit(1),
        supabase.from('patients').select('id').ilike('email', e).limit(1),
      ]);

      let exists = Boolean(
        (sRes.data && sRes.data.length > 0) ||
        (dRes.data && dRes.data.length > 0) ||
        (pRes.data && pRes.data.length > 0)
      );

      // If not found in primary tables, double check check-email API for Auth-only accounts
      if (!exists) {
        try {
          const apiCheck = await fetch(`/api/check-email?email=${encodeURIComponent(e)}`);
          if (apiCheck.ok) {
            const j = await apiCheck.json();
            if (j.exists) exists = true;
          }
        } catch {
          /* ignore */
        }
      }

      // If email is NOT found in the database, reject immediately and do NOT send mail
      if (!exists) {
        return {
          ok: false,
          error: 'This email address is not registered in our hospital database. Please check the spelling or contact your administrator.',
        };
      }

      // 2. Email is verified to exist — proceed to send recovery link
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to send password reset email.' };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters long.' };
    }
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Failed to update password.' };
    }
  };

  return (
    <Ctx.Provider value={{ user, loading, signIn, signOut, resetPasswordForEmail, updatePassword }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
