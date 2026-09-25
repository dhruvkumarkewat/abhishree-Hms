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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const resetPasswordForEmail = async (_email: string) => {
    return {
      ok: false,
      error: 'Self-service password reset is disabled. Account passwords are created once by the Hospital Administrator and cannot be changed.',
    };
  };

  const updatePassword = async (_newPassword: string) => {
    return {
      ok: false,
      error: 'Password modification is disabled by hospital security policy. Passwords are set once at creation.',
    };
  };

  return (
    <Ctx.Provider value={{ user, loading, signIn, signOut, resetPasswordForEmail, updatePassword }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
