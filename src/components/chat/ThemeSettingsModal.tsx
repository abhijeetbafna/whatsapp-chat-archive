'use client';

import React from 'react';
import { 
  Sun, 
  Moon, 
  Laptop, 
  X, 
  Sliders, 
  Type, 
  Image as ImageIcon,
  Check,
  RotateCcw
} from 'lucide-react';
import { useTheme, ThemeMode, WallpaperStyle, FontScale } from '../../context/ThemeContext';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSettingsModal({ isOpen, onClose }: ThemeSettingsModalProps) {
  const { 
    settings, 
    isDark, 
    setMode, 
    setWallpaper, 
    setWallpaperOpacity, 
    setFontScale, 
    resetTheme 
  } = useTheme();

  if (!isOpen) return null;

  const modeOptions: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: 'Light', icon: <Sun size={17} /> },
    { id: 'dark', label: 'Dark', icon: <Moon size={17} /> },
    { id: 'system', label: 'System', icon: <Laptop size={17} /> },
  ];

  const wallpaperOptions: { id: WallpaperStyle; label: string; previewBg: string; darkPreviewBg: string }[] = [
    { id: 'default', label: 'WhatsApp Doodle', previewBg: '#efeae2', darkPreviewBg: '#0b141a' },
    { id: 'dots', label: 'Classic Dots', previewBg: '#efeae2', darkPreviewBg: '#0b141a' },
    { id: 'solid', label: 'Clean Solid', previewBg: '#f8fafc', darkPreviewBg: '#090e11' },
    { id: 'slate', label: 'Midnight Slate', previewBg: '#e2e8f0', darkPreviewBg: '#0f172a' },
  ];

  const fontOptions: { id: FontScale; label: string; size: string }[] = [
    { id: 'sm', label: 'Small', size: '13px' },
    { id: 'base', label: 'Medium', size: '14.5px' },
    { id: 'lg', label: 'Large', size: '16px' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div 
        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#111b21] p-6 shadow-2xl border border-slate-200 dark:border-[#222e35] text-slate-900 dark:text-[#e9edef] transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222e35]">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Sliders size={20} />
            <h3 id="theme-modal-title" className="text-lg font-bold text-slate-900 dark:text-[#e9edef]">
              Display & Theme
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#202c33] hover:text-slate-700 dark:hover:text-[#e9edef] transition-colors"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Theme Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-[#8696a0] mb-2 uppercase tracking-wider">
              Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {modeOptions.map((opt) => {
                const active = settings.mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMode(opt.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 border text-xs font-semibold transition-all ${
                      active
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-[#222e35] bg-slate-50 dark:bg-[#202c33] text-slate-700 dark:text-[#e9edef] hover:border-slate-300 dark:hover:border-[#2a3942]'
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Wallpaper */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-[#8696a0] mb-2 uppercase tracking-wider">
              <ImageIcon size={14} />
              <span>Chat Wallpaper</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {wallpaperOptions.map((wp) => {
                const active = settings.wallpaper === wp.id;
                const bg = isDark ? wp.darkPreviewBg : wp.previewBg;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => setWallpaper(wp.id)}
                    className={`flex items-center gap-2 rounded-2xl p-2.5 border text-left text-xs font-medium transition-all ${
                      active
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-[#222e35] bg-white dark:bg-[#202c33] text-slate-700 dark:text-[#e9edef] hover:border-slate-300 dark:hover:border-[#2a3942]'
                    }`}
                  >
                    <span 
                      className="h-6 w-6 rounded-lg border border-slate-300 dark:border-[#2a3942] shrink-0" 
                      style={{ backgroundColor: bg }} 
                    />
                    <span className="truncate flex-1">{wp.label}</span>
                    {active && <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Pattern Opacity Slider (visible when doodle or dots selected) */}
            {(settings.wallpaper === 'default' || settings.wallpaper === 'dots') && (
              <div className="mt-3 rounded-2xl bg-slate-50 dark:bg-[#202c33]/60 p-3 border border-slate-200 dark:border-[#222e35]">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-[#8696a0] mb-1.5 font-medium">
                  <span>Pattern Intensity:</span>
                  <span>{Math.round(settings.wallpaperOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.wallpaperOpacity}
                  onChange={(e) => setWallpaperOpacity(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-[#2a3942] rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Font Size Scaling */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-[#8696a0] mb-2 uppercase tracking-wider">
              <Type size={14} />
              <span>Message Text Size</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {fontOptions.map((f) => {
                const active = settings.fontScale === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontScale(f.id)}
                    className={`rounded-2xl p-2.5 border text-center text-xs font-semibold transition-all ${
                      active
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500 dark:text-emerald-300 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-[#222e35] bg-slate-50 dark:bg-[#202c33] text-slate-700 dark:text-[#e9edef] hover:border-slate-300 dark:hover:border-[#2a3942]'
                    }`}
                  >
                    <div>{f.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">{f.size}</div>
                  </button>
                );
              })}
            </div>

            {/* Live Message Bubble Preview */}
            <div className="mt-3 rounded-2xl bg-slate-100 dark:bg-[#0b141a] p-3 border border-slate-200 dark:border-[#222e35]">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Live Preview</div>
              <div className="flex flex-col gap-1.5">
                <div 
                  className="self-start rounded-2xl rounded-tl-xs px-3 py-1.5 shadow-2xs border border-slate-200/60 dark:border-[#2a3942] bg-white dark:bg-[#202c33] text-slate-900 dark:text-[#e9edef]"
                  style={{
                    fontSize: settings.fontScale === 'sm' ? '13px' : settings.fontScale === 'lg' ? '16px' : '14.5px',
                  }}
                >
                  Incoming message sample
                </div>
                <div 
                  className="self-end rounded-2xl rounded-tr-xs px-3 py-1.5 shadow-2xs bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] border border-[#c7e9b0]/50 dark:border-[#025143]"
                  style={{
                    fontSize: settings.fontScale === 'sm' ? '13px' : settings.fontScale === 'lg' ? '16px' : '14.5px',
                  }}
                >
                  Looks crisp and easy to read!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-[#222e35] flex items-center justify-between">
          <button
            type="button"
            onClick={resetTheme}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-[#8696a0] hover:text-slate-800 dark:hover:text-[#e9edef] transition-colors"
          >
            <RotateCcw size={13} />
            <span>Reset to default</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-900 dark:bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
