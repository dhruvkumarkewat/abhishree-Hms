import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeCtx {
  theme: Theme;
  effective: 'light' | 'dark';
  setTheme: (t: Theme) => void;
}

const Ctx = createContext<ThemeCtx>({ theme: 'light', effective: 'light', setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try { return (localStorage.getItem('abhishree_theme') as Theme) || 'light'; } catch { return 'light'; }
  });
  const [effective, setEffective] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const eff: 'light' | 'dark' = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme;
      setEffective(eff);
      document.documentElement.classList.toggle('dark', eff === 'dark');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem('abhishree_theme', t); } catch { /* noop */ }
  };

  return <Ctx.Provider value={{ theme, effective, setTheme }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
