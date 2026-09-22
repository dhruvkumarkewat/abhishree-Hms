import type { ReactNode } from 'react';
import { X, Search, AlertTriangle, Inbox, WifiOff } from 'lucide-react';

/* ---------- Status badge ---------- */
const STATUS_MAP: Record<string, string> = {
  // appointments / general
  Scheduled: 'b-blue', Confirmed: 'b-teal', 'Checked-in': 'b-purple', 'In consultation': 'b-amber',
  Completed: 'b-green', Cancelled: 'b-slate', 'No-show': 'b-red',
  // admissions / beds
  Admitted: 'b-blue', Discharged: 'b-slate', Occupied: 'b-red', Available: 'b-green', Reserved: 'b-amber',
  Cleaning: 'b-purple', Maintenance: 'b-slate',
  // lab
  Ordered: 'b-blue', 'Sample Collected': 'b-purple', Processing: 'b-amber', Verified: 'b-green',
  Reported: 'b-green', 'Result Entry': 'b-amber',
  // pharmacy
  Pending: 'b-amber', Dispensed: 'b-green', 'Partially Dispensed': 'b-teal',
  // billing
  Paid: 'b-green', Partial: 'b-amber', Refunded: 'b-purple', Unpaid: 'b-red',
  // triage
  Critical: 'b-red', High: 'b-amber', Medium: 'b-blue', Low: 'b-slate',
  // misc
  Active: 'b-green', Inactive: 'b-slate', Stable: 'b-green', Serious: 'b-red', Observation: 'b-amber',
  Approved: 'b-green', Rejected: 'b-red', Submitted: 'b-blue', 'Under Review': 'b-amber', Settled: 'b-teal', Draft: 'b-slate',
  Success: 'b-green', Failed: 'b-red',
};

export function Badge({ status, children }: { status?: string; children?: ReactNode }) {
  const label = children ?? status ?? '—';
  const cls = (status && STATUS_MAP[status]) || 'b-slate';
  return <span className={`badge ${cls}`}>{label}</span>;
}

/* ---------- Modal ---------- */
export function Modal({ title, subtitle, onClose, children, wide }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-panel ${wide ? 'max-w-3xl' : 'max-w-lg'}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b hairline sticky top-0 bg-inherit z-10" style={{ background: 'inherit', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            {subtitle && <p className="text-sm opacity-60 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm !px-2" aria-label="Close"><X size={16} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Field ---------- */
export function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="block text-xs text-red-600 mt-1 font-medium">{error}</span>}
      {!error && hint && <span className="block text-xs opacity-55 mt-1">{hint}</span>}
    </label>
  );
}

/* ---------- Empty / Error states ---------- */
export function Empty({ title, desc, action, icon }: { title: string; desc?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        {icon || <Inbox size={22} className="opacity-50" />}
      </div>
      <div className="font-semibold">{title}</div>
      {desc && <div className="text-sm opacity-60 mt-1 max-w-sm">{desc}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center mb-3">
        <WifiOff size={22} className="text-red-500" />
      </div>
      <div className="font-semibold">Something went wrong</div>
      <div className="text-sm opacity-60 mt-1">{message}</div>
      <button onClick={onRetry} className="btn btn-ghost btn-sm mt-4">Try again</button>
    </div>
  );
}

export function NoResults({ onClear }: { onClear?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      <Search size={22} className="opacity-40 mb-2" />
      <div className="font-semibold">No matching records</div>
      <div className="text-sm opacity-60 mt-1">Try adjusting the search or filters.</div>
      {onClear && <button onClick={onClear} className="btn btn-ghost btn-sm mt-3">Clear filters</button>}
    </div>
  );
}

/* ---------- Skeletons ---------- */
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-11" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-8 w-1/2" />
          <div className="skeleton h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

/* ---------- Alert banner ---------- */
export function AlertBanner({ level, text }: { level: 'danger' | 'warning' | 'info'; text: string }) {
  const styles = {
    danger: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200',
    warning: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200',
    info: 'bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/40 dark:border-sky-900 dark:text-sky-200',
  } as const;
  return (
    <div className={`flex items-center gap-2.5 border rounded-xl px-4 py-2.5 text-sm font-medium ${styles[level]}`}>
      <AlertTriangle size={16} className="shrink-0" />
      <span>{text}</span>
    </div>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ name, size = 36 }: { name?: string | null; size?: number }) {
  const initials = (name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  let h = 0;
  const n = name || 'x';
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 997;
  const colors = ['#0e5aa7', '#0d9488', '#6a3fd4', '#9a6b0a', '#b4232a', '#475569', '#0e7490', '#7c2d12'];
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ width: size, height: size, fontSize: size * 0.36, background: colors[h % colors.length] }}>
      {initials}
    </div>
  );
}

/* ---------- Pagination ---------- */
export function Pagination({ page, totalPages, onChange, total }: { page: number; totalPages: number; onChange: (p: number) => void; total: number }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <span className="opacity-60">{total} records · Page {page} of {totalPages}</span>
      <div className="flex gap-1.5">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
          let p = i + 1;
          if (totalPages > 5) {
            const start = Math.min(Math.max(page - 2, 1), totalPages - 4);
            p = start + i;
          }
          return <button key={p} onClick={() => onChange(p)} className={`btn btn-sm ${p === page ? 'btn-dark' : 'btn-ghost'}`}>{p}</button>;
        })}
        <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}

/* ---------- Stat card ---------- */
export function Stat({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon?: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-medium opacity-60">{label}</div>
          <div className="text-[26px] leading-8 font-bold mt-1 tracking-tight">{value}</div>
          {sub && <div className="text-xs opacity-55 mt-1">{sub}</div>}
        </div>
        {icon && <div className="w-10 h-10 rounded-xl bg-med-50 dark:bg-sky-950 flex items-center justify-center text-med-600 dark:text-sky-300 shrink-0">{icon}</div>}
      </div>
    </div>
  );
}

/* ---------- Progress bar ---------- */
export function Meter({ value, max = 100, color = '#1470cc' }: { value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="bar-track h-2 w-full">
      <div className="bar-fill h-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/* ---------- Section heading ---------- */
export function SectionHead({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {desc && <p className="text-sm opacity-60 mt-0.5">{desc}</p>}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}
