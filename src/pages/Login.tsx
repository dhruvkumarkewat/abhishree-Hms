import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, ChevronDown } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle, googleAvailable } from '../lib/googleAuth';
import { DEMO_USERS } from '../lib/roles';

export default function Login() {
  const nav = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('admin@abhishree.hospital');
  const [password, setPassword] = useState('admin123');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Please enter your email address.');
    if (!password) return setError('Please enter your password.');
    setBusy(true);
    await new Promise((r) => setTimeout(r, 650));
    const res = await signIn(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'Sign in failed. Please try again.');
      return;
    }
    if (!remember) {
      // session-only: keep in memory behavior by clearing on unload
      window.addEventListener('beforeunload', () => localStorage.removeItem('abhishree_session'), { once: true });
    }
    nav('/app', { replace: true });
  };

  const fill = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
    setError('');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink-950">
      {/* LEFT — cinematic visual */}
      <div className="relative hidden lg:block overflow-hidden">
        <video autoPlay muted loop playsInline poster="/media/building.jpg" className="absolute inset-0 w-full h-full object-cover kenburns">
          <source src="/media/hero-team.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(100deg, rgba(7,17,28,.25) 0%, rgba(7,17,28,.55) 70%, rgba(11,28,44,.95) 100%)' }} />
        <div className="absolute top-8 left-8"><Logo light /></div>
        <div className="absolute bottom-0 left-0 right-0 p-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <div className="eyebrow text-teal-300 mb-4">Secure staff & patient portal</div>
            <div className="font-display text-white text-5xl leading-[1.04] max-w-md text-balance">
              One hospital. Every role. Total clarity.
            </div>
            <p className="text-white/60 mt-4 max-w-sm leading-relaxed text-[15px]">
              Sign in to open your workspace — the same live hospital, shaped around what you need to do today.
            </p>
            <div className="mt-7 flex items-center gap-5 text-white/55 text-[13px] font-medium">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-teal-300" /> Role-based access</span>
              <span className="flex items-center gap-1.5"><Lock size={14} className="text-teal-300" /> Audit-logged sessions</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-[#f6f8fb] dark:bg-[#0a1622] relative">
        <Link to="/" className="absolute top-6 left-6 lg:hidden"><Logo /></Link>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="hidden lg:block mb-8"><Logo /></div>
          <div className="lg:hidden mb-8 mt-14"><Logo /></div>

          <h1 className="font-display text-4xl tracking-tight">Welcome back</h1>
          <p className="text-[15px] opacity-60 mt-2">Secure access to connected hospital services.</p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <div>
              <label className="block text-[13px] font-semibold mb-1.5" htmlFor="email">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  id="email" type="email" className="input !pl-10" placeholder="you@abhishree.hospital"
                  value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-semibold" htmlFor="password">Password</label>
                <button type="button" className="text-[13px] font-semibold text-med-600 dark:text-sky-300 hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  id="password" type={show ? 'text' : 'password'} className="input !pl-10 !pr-11" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 rounded accent-[#0e5aa7]" />
              <span className="opacity-70">Keep me signed in on this device</span>
            </label>

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-200 border border-red-200 dark:border-red-900 rounded-xl px-4 py-2.5">
                {error}
              </motion.div>
            )}

            <button type="submit" disabled={busy} className="btn btn-primary w-full !py-3 !text-[15px]">
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Verifying…
                </span>
              ) : (
                <>Sign in <ArrowRight size={17} /></>
              )}
            </button>

            {googleAvailable() && (
              <>
                <div className="flex items-center gap-3 text-xs opacity-50 font-semibold">
                  <span className="flex-1 h-px bg-current opacity-30" /> or <span className="flex-1 h-px bg-current opacity-30" />
                </div>
                <button type="button" onClick={() => signInWithGoogle('AbhiShree Hospital')} className="btn btn-ghost w-full !py-3">
                  <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.5h6c-.3 1.4-1.1 2.5-2.3 3.3v2.8h3.7c2.2-2 3.2-5 3.2-8.3z" /><path fill="#34A853" d="M12 23c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v2.9C3.7 20.5 7.6 23 12 23z" /><path fill="#FBBC05" d="M5.6 13.8c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.3H1.8C.7 8.4 0 10.6 0 13s.7 4.6 1.8 6.7l3.8-2.9z" /><path fill="#EA4335" d="M12 5.5c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 2.1 15.1 1 12 1 7.6 1 3.7 3.5 1.8 7.3l3.8 2.9c.9-2.7 3.4-4.7 6.4-4.7z" /></svg>
                  Continue with Google
                </button>
              </>
            )}
          </form>

          {/* demo accounts */}
          <div className="mt-7 border hairline rounded-2xl overflow-hidden bg-white dark:bg-ink-900">
            <button type="button" onClick={() => setShowAccounts(!showAccounts)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold">
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-teal-600" /> Explore with a demo account</span>
              <ChevronDown size={16} className={`transition-transform ${showAccounts ? 'rotate-180' : ''}`} />
            </button>
            {showAccounts && (
              <div className="px-2 pb-2 max-h-64 overflow-y-auto scroll-thin">
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => fill(u.email, u.password)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 hover:bg-med-50 dark:hover:bg-sky-950 transition-colors ${email === u.email ? 'bg-med-50 dark:bg-sky-950' : ''}`}
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold truncate">{u.name} <span className="opacity-50 font-semibold">· {u.role}</span></div>
                      <div className="text-xs opacity-55 truncate">{u.email}</div>
                    </div>
                    <span className="text-[11px] font-mono opacity-50 shrink-0">{u.password}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-xs opacity-50">Protected by role-based access · All sessions are audit-logged</p>
        </motion.div>
      </div>
    </div>
  );
}
