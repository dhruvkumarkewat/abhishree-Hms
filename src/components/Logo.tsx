export default function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#0e5aa7 0%,#0d9488 130%)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" fill="#fff" />
          <path d="M4 17.5c2.5 0 3.5-1.2 5-1.2s2 1.2 3.5 1.2 2-1.2 3.5-1.2 2.5 1.2 4 1.2" stroke="#0e5aa7" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-none">
          <div className={`text-[17px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink-900 dark:text-white'}`}>
            AbhiShree
          </div>
          <div className={`text-[10px] font-semibold tracking-[.14em] uppercase mt-1 ${light ? 'text-white/60' : 'text-slate-500 dark:text-slate-400'}`}>
            Hospital
          </div>
        </div>
      )}
    </div>
  );
}
