import React from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import useTheme from '@/hooks/useTheme';

export default function ThemePreferences() {
  const { theme, setTheme, mode, setMode } = useTheme();

  const modes = [
    { id: 'system', label: 'System', icon: <Laptop className="w-5 h-5" />, desc: 'Follows your operating system preferences' },
    { id: 'light', label: 'Light', icon: <Sun className="w-5 h-5" />, desc: 'Clean, high-contrast light theme' },
    { id: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" />, desc: 'Easy on the eyes in dark rooms' },
  ];

  const themes = [
    {
      id: 'classic',
      name: 'Classic Navy',
      primary: '#16355F',
      secondary: '#F59E0B',
      bg: '#F5F9FF',
      desc: 'TrueEd original brand theme'
    },
    {
      id: 'emerald',
      name: 'Emerald Sage',
      primary: '#064E3B',
      secondary: '#10B981',
      bg: '#F0FDF4',
      desc: 'Sophisticated botanical green & mint'
    },
    {
      id: 'amethyst',
      name: 'Royal Amethyst',
      primary: '#4C1D95',
      secondary: '#8B5CF6',
      bg: '#FAF5FF',
      desc: 'Luxurious violet & lavender'
    },
    {
      id: 'sunset',
      name: 'Sunset Crimson',
      primary: '#7C2D12',
      secondary: '#EA580C',
      bg: '#FFF7ED',
      desc: 'Warm orange & autumn gold'
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Mode Selector */}
      <div className="space-y-4">
        <div>
          <h3 className="font-sora text-lg font-bold text-navy mb-1">Theme Mode</h3>
          <p className="text-sm text-slate-500 font-medium">Choose how TrueEd appears on your device.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {modes.map((m) => {
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex flex-col items-start text-left p-4 rounded-xl border transition-all hover-lift relative overflow-hidden ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 border-navy dark:border-sky shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className={`p-2 rounded-lg mb-3 ${
                  isActive
                    ? 'bg-navy/10 text-navy dark:bg-sky/20 dark:text-sky'
                    : 'bg-slate-200/50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {m.icon}
                </div>
                <p className="font-bold text-navy dark:text-slate-200 mb-1">{m.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{m.desc}</p>
                
                {isActive && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-navy dark:bg-sky rounded-full flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Themes Selector */}
      <div className="space-y-4">
        <div>
          <h3 className="font-sora text-lg font-bold text-navy mb-1">Color Palette</h3>
          <p className="text-sm text-slate-500 font-medium">Personalize the brand accent and page background colors.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map((t) => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all hover-lift ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 border-navy dark:border-sky shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Color dots preview */}
                  <div className="flex items-center -space-x-1.5">
                    <span className="w-5 h-5 rounded-full border border-white dark:border-slate-800 shadow-sm" style={{ backgroundColor: t.primary }} />
                    <span className="w-4 h-4 rounded-full border border-white dark:border-slate-800 shadow-sm" style={{ backgroundColor: t.secondary }} />
                    <span className="w-3.5 h-3.5 rounded-full border border-white dark:border-slate-800 shadow-sm" style={{ backgroundColor: t.bg }} />
                  </div>
                  <div>
                    <p className="font-bold text-navy dark:text-slate-200 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.desc}</p>
                  </div>
                </div>

                {isActive && (
                  <div className="w-5 h-5 bg-navy dark:bg-sky rounded-full flex items-center justify-center text-white shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
