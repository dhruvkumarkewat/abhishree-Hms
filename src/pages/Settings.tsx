import { useState } from 'react';
import { Sun, Moon, Monitor, UserRound, Lock, Bell, Building2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { Field, SectionHead } from '../components/ui';
import supabase from '../lib/supabase';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [notif, setNotif] = useState({ email: true, sms: false, push: true, critical: true });

  const saveProfile = async () => {
    if (!name.trim()) return toast({ kind: 'error', title: 'Name cannot be empty' });
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: name.trim(), full_name: name.trim() }
      });
      if (error) throw error;
      toast({ kind: 'success', title: 'Profile updated', desc: 'Your display name was saved.' });
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to update profile', desc: e.message });
    }
  };

  const changePwd = async () => {
    if (!pwd.next) return toast({ kind: 'error', title: 'Enter a new password' });
    if (pwd.next.length < 6) return toast({ kind: 'error', title: 'New password must be at least 6 characters' });
    if (pwd.next !== pwd.confirm) return toast({ kind: 'error', title: 'New passwords do not match' });
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd.next });
      if (error) throw error;
      setPwd({ current: '', next: '', confirm: '' });
      toast({ kind: 'success', title: 'Password changed successfully', desc: 'Your login password has been updated in Supabase.' });
    } catch (e: any) {
      toast({ kind: 'error', title: 'Failed to change password', desc: e.message });
    }
  };

  const saveNotif = () => toast({ kind: 'success', title: 'Notification preferences saved' });

  return (
    <div className="max-w-3xl">
      <SectionHead title="Settings" desc="Your account, appearance and notification preferences." />

      {/* appearance */}
      <div className="card p-5 sm:p-6 mb-4">
        <div className="font-bold flex items-center gap-2 mb-1"><Monitor size={17} className="opacity-60" /> Appearance</div>
        <div className="text-[13px] opacity-55 mb-4">Theme applies across the whole hospital system and is remembered.</div>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { k: 'light', label: 'Light', icon: <Sun size={17} /> },
            { k: 'dark', label: 'Dark', icon: <Moon size={17} /> },
            { k: 'system', label: 'System', icon: <Monitor size={17} /> },
          ].map((t) => (
            <button key={t.k} onClick={() => { setTheme(t.k as any); toast({ kind: 'success', title: `${t.label} theme applied` }); }}
              className={`rounded-xl border p-3.5 flex flex-col items-center gap-1.5 text-sm font-bold transition-all ${theme === t.k ? 'border-med-600 bg-med-50 dark:bg-sky-950 text-med-700 dark:text-sky-200' : 'hairline opacity-70 hover:opacity-100'}`}>
              {t.icon}{t.label}
              {theme === t.k && <Check size={14} className="text-med-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* profile */}
      <div className="card p-5 sm:p-6 mb-4">
        <div className="font-bold flex items-center gap-2 mb-1"><UserRound size={17} className="opacity-60" /> Profile</div>
        <div className="text-[13px] opacity-55 mb-4">Signed in as <span className="font-semibold">{user?.email}</span> · Role: <span className="font-semibold">{user?.role}</span></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Display name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email (sign-in ID)"><input className="input opacity-60" value={user?.email || ''} disabled /></Field>
        </div>
        <div className="flex justify-end mt-4"><button className="btn btn-primary btn-sm" onClick={saveProfile}>Save profile</button></div>
      </div>

      {/* security */}
      <div className="card p-5 sm:p-6 mb-4">
        <div className="font-bold flex items-center gap-2 mb-1"><Lock size={17} className="opacity-60" /> Security</div>
        <div className="text-[13px] opacity-55 mb-4">Change the password you use to sign in to the portal.</div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Current password"><input type="password" className="input" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} /></Field>
          <Field label="New password"><input type="password" className="input" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} /></Field>
          <Field label="Confirm new"><input type="password" className="input" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end mt-4"><button className="btn btn-dark btn-sm" onClick={changePwd}>Change password</button></div>
      </div>

      {/* notifications */}
      <div className="card p-5 sm:p-6 mb-4">
        <div className="font-bold flex items-center gap-2 mb-1"><Bell size={17} className="opacity-60" /> Notifications</div>
        <div className="text-[13px] opacity-55 mb-4">Choose how the hospital reaches you.</div>
        <div className="space-y-3">
          {[
            { k: 'email', label: 'Email notifications', desc: 'Appointment confirmations and reports' },
            { k: 'sms', label: 'SMS alerts', desc: 'Reminders and queue updates' },
            { k: 'push', label: 'In-app notifications', desc: 'The bell icon in the top bar' },
            { k: 'critical', label: 'Critical alerts', desc: 'Emergency and escalation notices (recommended)' },
          ].map((n) => (
            <label key={n.k} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={(notif as any)[n.k]} onChange={(e) => setNotif({ ...notif, [n.k]: e.target.checked })} className="w-4.5 h-4.5 w-[18px] h-[18px] rounded accent-[#0e5aa7]" />
              <div><div className="text-sm font-semibold">{n.label}</div><div className="text-xs opacity-55">{n.desc}</div></div>
            </label>
          ))}
        </div>
        <div className="flex justify-end mt-4"><button className="btn btn-primary btn-sm" onClick={saveNotif}>Save preferences</button></div>
      </div>

      {/* hospital */}
      <div className="card p-5 sm:p-6">
        <div className="font-bold flex items-center gap-2 mb-1"><Building2 size={17} className="opacity-60" /> Hospital</div>
        <div className="text-sm opacity-70 leading-relaxed mt-2">
          <span className="font-bold text-[15px]">AbhiShree Hospital</span><br />
          14 Health Avenue, Bengaluru 560001<br />
          Emergency: 1800 123 456 · care@abhishree.hospital<br />
          OPD hours: Mon–Sat, 9:00 AM – 8:00 PM · Emergency: 24×7
        </div>
      </div>
    </div>
  );
}
