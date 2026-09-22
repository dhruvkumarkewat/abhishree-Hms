import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface Toast { id: number; title: string; desc?: string; kind: 'success' | 'error' | 'info'; }

const Ctx = createContext<{ toast: (t: Omit<Toast, 'id'>) => void }>({ toast: () => {} });

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = nextId++;
    setToasts((p) => [...p.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[min(360px,92vw)]">
        {toasts.map((t) => (
          <div key={t.id} className="toast-enter card !rounded-xl p-3.5 flex gap-3 items-start shadow-xl">
            {t.kind === 'success' && <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />}
            {t.kind === 'error' && <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />}
            {t.kind === 'info' && <Info size={20} className="text-sky-600 shrink-0 mt-0.5" />}
            <div className="min-w-0">
              <div className="text-sm font-semibold">{t.title}</div>
              {t.desc && <div className="text-xs opacity-70 mt-0.5">{t.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
