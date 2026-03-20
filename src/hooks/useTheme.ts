import { useState, useEffect, useCallback } from 'react';
import { ThemeMode } from '@/types/crawl';
import { getTheme, setThemeStorage } from '@/lib/localStorage';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => getTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setThemeStorage(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  return { theme, toggle };
}
