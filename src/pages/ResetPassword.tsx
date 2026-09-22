import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';

export default function ResetPassword() {
  const nav = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if recovery session is active
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    }).catch(() => {
      setHasSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      return setError('Please enter a new password.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match. Please re-enter.');
    }

    setBusy(true);
    const res = await updatePassword(password);
    setBusy(false);

    if (!res.ok) {
      setError(res.error || 'Failed to update password. Your reset link may have expired.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      nav('/login', { replace: true });
    }, 3500);
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
            <div className="eyebrow text-teal-300 mb-4">Account Security</div>
            <div className="font-display text-white text-5xl leading-[1.04] max-w-md text-balance">
              Secure credentials. Uncompromised care.
            </div>
            <p className="text-white/60 mt-4 max-w-sm leading-relaxed text-[15px]">
              Set a strong, private password for your AbhiShree Hospital workspace account.
            </p>
            <div className="mt-7 flex items-center gap-5 text-white/55 text-[13px] font-medium">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-teal-300" /> End-to-end encrypted</span>
              <span className="flex items-center gap-1.5"><Lock size={14} className="text-teal-300" /> Verified session</span>
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

          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <h1 className="font-display text-3xl tracking-tight">Password Updated</h1>
              <p className="text-[15px] opacity-70 mt-3 leading-relaxed">
                Your password has been successfully reset. You will be redirected to the sign in page shortly.
              </p>
              <div className="mt-8">
                <Link to="/login" className="btn btn-primary w-full !py-3 !text-[15px]">
                  Continue to Sign In <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-display text-4xl tracking-tight">Set New Password</h1>
              <p className="text-[15px] opacity-60 mt-2">
                Choose a strong new password for your account.
              </p>

              {hasSession === false && (
                <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-amber-800 dark:text-amber-200 text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="font-bold">Notice:</span> If you didn't arrive via a password reset email link, this request may fail. If needed, you can request a new link from the <Link to="/login" className="underline font-semibold">sign in page</Link>.
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5" htmlFor="new-password">New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                    <input
                      id="new-password"
                      type={show ? 'text' : 'password'}
                      className="input !pl-10 !pr-11"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                      aria-label={show ? 'Hide password' : 'Show password'}
                    >
                      {show ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold mb-1.5" htmlFor="confirm-password">Confirm New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      className="input !pl-10 !pr-11"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-200 border border-red-200 dark:border-red-900 rounded-xl px-4 py-2.5">
                    {error}
                  </motion.div>
                )}

                <button type="submit" disabled={busy} className="btn btn-primary w-full !py-3 !text-[15px]">
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Updating…
                    </span>
                  ) : (
                    <>Update Password <ArrowRight size={17} /></>
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link to="/login" className="text-sm font-semibold text-med-600 dark:text-sky-300 hover:underline">
                    ← Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-xs opacity-50">Protected by role-based access · All sessions are audit-logged</p>
        </motion.div>
      </div>
    </div>
  );
}
