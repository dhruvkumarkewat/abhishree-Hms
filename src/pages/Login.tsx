import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, ArrowLeft, Info } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle, googleAvailable } from '../lib/googleAuth';

export default function Login() {
  const nav = useNavigate();
  const { signIn, resetPasswordForEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const submitLogin = async (e: FormEvent) => {
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
      window.addEventListener('beforeunload', () => localStorage.removeItem('abhishree_session'), { once: true });
    }
    nav('/app', { replace: true });
  };

  const submitForgot = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim()) {
      return setForgotError('Please enter your email address.');
    }
    setForgotBusy(true);
    const res = await resetPasswordForEmail(forgotEmail);
    setForgotBusy(false);
    if (!res.ok) {
      setForgotError(res.error || 'Unable to send reset email. Please verify your email.');
      return;
    }
    setForgotSent(true);
  };

  const openForgot = () => {
    setForgotEmail(email);
    setForgotSent(false);
    setForgotError('');
    setMode('forgot');
  };

  const openLogin = () => {
    setError('');
    setMode('login');
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

      {/* RIGHT — form card */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-[#f6f8fb] dark:bg-[#0a1622] relative">
        <Link to="/" className="absolute top-6 left-6 lg:hidden"><Logo /></Link>
        <div className="w-full max-w-[420px]">
          <div className="hidden lg:block mb-8"><Logo /></div>
          <div className="lg:hidden mb-8 mt-14"><Logo /></div>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="font-display text-4xl tracking-tight">Welcome back</h1>
                <p className="text-[15px] opacity-60 mt-2">Secure access to connected hospital services.</p>

                <form onSubmit={submitLogin} className="mt-8 space-y-4" noValidate>
                  <div>
                    <label className="block text-[13px] font-semibold mb-1.5" htmlFor="email">Email address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                      <input
                        id="email"
                        type="email"
                        className="input !pl-10"
                        placeholder="you@abhishree.hospital"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[13px] font-semibold" htmlFor="password">Password</label>
                      <button
                        type="button"
                        onClick={openForgot}
                        className="text-[13px] font-semibold text-med-600 dark:text-sky-300 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                      <input
                        id="password"
                        type={show ? 'text' : 'password'}
                        className="input !pl-10 !pr-11"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShow(!show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 cursor-pointer"
                        aria-label={show ? 'Hide password' : 'Show password'}
                      >
                        {show ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#0e5aa7]"
                    />
                    <span className="opacity-70">Keep me signed in on this device</span>
                  </label>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-200 border border-red-200 dark:border-red-900 rounded-xl px-4 py-2.5">
                      {error}
                    </motion.div>
                  )}

                  <button type="submit" disabled={busy} className="btn btn-primary w-full !py-3 !text-[15px] cursor-pointer">
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
                      <button type="button" onClick={() => signInWithGoogle('AbhiShree Hospital')} className="btn btn-ghost w-full !py-3 cursor-pointer">
                        <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.5h6c-.3 1.4-1.1 2.5-2.3 3.3v2.8h3.7c2.2-2 3.2-5 3.2-8.3z" /><path fill="#34A853" d="M12 23c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v2.9C3.7 20.5 7.6 23 12 23z" /><path fill="#FBBC05" d="M5.6 13.8c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.3H1.8C.7 8.4 0 10.6 0 13s.7 4.6 1.8 6.7l3.8-2.9z" /><path fill="#EA4335" d="M12 5.5c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 2.1 15.1 1 12 1 7.6 1 3.7 3.5 1.8 7.3l3.8 2.9c.9-2.7 3.4-4.7 6.4-4.7z" /></svg>
                        Continue with Google
                      </button>
                    </>
                  )}
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="forgot-form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  type="button"
                  onClick={openLogin}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-med-600 dark:text-sky-300 hover:underline mb-4 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>

                <h1 className="font-display text-4xl tracking-tight">Reset password</h1>
                <p className="text-[15px] opacity-60 mt-2">
                  Enter your registered account email to receive password recovery instructions.
                </p>

                {forgotSent ? (
                  <div className="mt-7 p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={24} />
                    </div>
                    <div className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                      Reset Link Sent!
                    </div>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-2 leading-relaxed">
                      We sent a secure password reset link to <strong className="break-all">{forgotEmail}</strong>. Please check your inbox and spam folder.
                    </p>
                    <div className="mt-6 flex flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={() => setForgotSent(false)}
                        className="btn btn-ghost text-xs w-full cursor-pointer"
                      >
                        Didn't receive it? Resend link
                      </button>
                      <button
                        type="button"
                        onClick={openLogin}
                        className="btn btn-primary text-sm w-full cursor-pointer"
                      >
                        Return to Sign In
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={submitForgot} className="mt-8 space-y-4" noValidate>
                    <div>
                      <label className="block text-[13px] font-semibold mb-1.5" htmlFor="forgot-email">
                        Registered Email
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                        <input
                          id="forgot-email"
                          type="email"
                          className="input !pl-10"
                          placeholder="you@abhishree.hospital"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          autoComplete="email"
                          autoFocus
                        />
                      </div>
                    </div>

                    {forgotError && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-200 border border-red-200 dark:border-red-900 rounded-xl px-4 py-2.5">
                        {forgotError}
                      </motion.div>
                    )}

                    <button type="submit" disabled={forgotBusy} className="btn btn-primary w-full !py-3 !text-[15px] cursor-pointer">
                      {forgotBusy ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Sending Link…
                        </span>
                      ) : (
                        <>Send Reset Link <ArrowRight size={17} /></>
                      )}
                    </button>

                    {/* Hospital staff helpful tip */}
                    <div className="mt-5 p-3.5 rounded-xl bg-med-50/70 dark:bg-sky-950/40 border border-med-200/50 dark:border-sky-900/50 flex items-start gap-2.5 text-xs text-med-900 dark:text-sky-200 leading-relaxed">
                      <Info size={16} className="shrink-0 mt-0.5 text-med-600 dark:text-sky-300" />
                      <div>
                        <span className="font-bold">Hospital Staff Note:</span> If you cannot access external email or need urgent access, your Hospital Administrator can also reset your password directly in <strong>Admin &gt; Staff Management</strong>.
                      </div>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-xs opacity-50">Protected by role-based access · All sessions are audit-logged</p>
        </div>
      </div>
    </div>
  );
}
