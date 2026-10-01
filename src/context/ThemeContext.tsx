'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type WallpaperStyle = 'default' | 'doodle' | 'dots' | 'solid' | 'slate';
export type FontScale = 'sm' | 'base' | 'lg';

export interface ThemeSettings {
  mode: ThemeMode;
  wallpaper: WallpaperStyle;
  wallpaperOpacity: number;
  fontScale: FontScale;
}

const DEFAULT_SETTINGS: ThemeSettings = {
  mode: 'system',
  wallpaper: 'default',
  wallpaperOpacity: 0.6,
  fontScale: 'base',
};

const STORAGE_KEY = 'whatsapp_archive_theme_settings';

interface ThemeContextType {
  settings: ThemeSettings;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  setWallpaper: (wallpaper: WallpaperStyle) => void;
  setWallpaperOpacity: (opacity: number) => void;
  setFontScale: (scale: FontScale) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen to system dark mode changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const isDark = settings.mode === 'dark' || (settings.mode === 'system' && systemDark);

  // Sync `.dark` class on <html> document element
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Persist settings
  const updateSettings = (partial: Partial<ThemeSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage full or unavailable
      }
      return updated;
    });
  };

  const setMode = (mode: ThemeMode) => updateSettings({ mode });
  const setWallpaper = (wallpaper: WallpaperStyle) => updateSettings({ wallpaper });
  const setWallpaperOpacity = (wallpaperOpacity: number) => updateSettings({ wallpaperOpacity });
  const setFontScale = (fontScale: FontScale) => updateSettings({ fontScale });
  const resetTheme = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        settings,
        isDark,
        setMode,
        setWallpaper,
        setWallpaperOpacity,
        setFontScale,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      settings: DEFAULT_SETTINGS,
      isDark: false,
      setMode: () => {},
      setWallpaper: () => {},
      setWallpaperOpacity: () => {},
      setFontScale: () => {},
      resetTheme: () => {},
    };
  }
  return context;
}
