'use client';

import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { settings, setMode, isDark } = useTheme();

  const toggleMode = () => {
    if (settings.mode === 'light') {
      setMode('dark');
    } else if (settings.mode === 'dark') {
      setMode('system');
    } else {
      setMode('light');
    }
  };

  const getLabel = () => {
    if (settings.mode === 'system') return 'Theme: Auto (System)';
    if (settings.mode === 'dark') return 'Theme: Dark';
    return 'Theme: Light';
  };

  return (
    <button
      type="button"
      onClick={toggleMode}
      title={getLabel()}
      aria-label={getLabel()}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-[#222e35] bg-white dark:bg-[#202c33] text-slate-700 dark:text-[#e9edef] hover:bg-slate-100 dark:hover:bg-[#2a3942] transition-colors shadow-2xs ${className}`}
    >
      {settings.mode === 'system' ? (
        <Laptop size={16} />
      ) : isDark ? (
        <Moon size={16} className="text-emerald-400" />
      ) : (
        <Sun size={16} className="text-amber-500" />
      )}
    </button>
  );
}
