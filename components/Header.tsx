'use client';

import { useEffect } from 'react';
import type { GoldPrice } from '@/types';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { TROY_OZ_TO_GRAMS, LOCAL_MARKET_FACTOR, FALLBACK_EXCHANGE_RATES } from '@/lib/constants';

type Theme = 'dark' | 'light' | 'gold';

interface HeaderProps {
  goldPrice: GoldPrice | null;
  loading: boolean;
  inrRate?: number;
}

const THEMES: { id: Theme; label: string; icon: string }[] = [
  { id: 'dark',  label: 'Dark',  icon: '🌑' },
  { id: 'light', label: 'Light', icon: '☀️' },
  { id: 'gold',  label: 'Gold',  icon: '✨' },
];

export default function Header({ goldPrice, loading, inrRate }: HeaderProps) {
  const [theme, setTheme] = useLocalStorage<Theme>('gpp_theme', 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const change = goldPrice?.changePercent24h ?? 0;
  const isUp = change >= 0;

  const rate     = inrRate ?? FALLBACK_EXCHANGE_RATES.INR;
  const factor   = LOCAL_MARKET_FACTOR['INR']?.factor ?? 1;
  const inrPerGram = goldPrice
    ? Math.round((goldPrice.spotPrice / TROY_OZ_TO_GRAMS) * rate * factor)
    : null;

  return (
    <header className="border-b border-yellow-600/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">

        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
               style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', boxShadow: '0 4px 12px rgba(255,215,0,0.3)' }}>
            ⚡
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: '#FFD700' }}>
              Gold Price Predictor
            </h1>
            <p className="text-xs text-gray-500">Data-driven sell recommendations</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-wrap justify-end">

          {/* INR live rate */}
          {inrPerGram && (
            <div className="hidden sm:flex flex-col items-end">
              <div className="text-xs text-gray-500 uppercase tracking-wider">24K / gram (India)</div>
              <div className="text-lg font-bold" style={{ color: '#FFD700' }}>
                ₹{inrPerGram.toLocaleString('en-IN')}
              </div>
            </div>
          )}

          {/* USD price */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              Fetching live data…
            </div>
          ) : goldPrice ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wider">XAU / USD</div>
                <div className="text-2xl font-bold" style={{ color: '#FFD700' }}>
                  ${goldPrice.spotPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className={`flex flex-col items-end text-sm font-semibold px-3 py-2 rounded-lg ${isUp ? 'signal-bullish' : 'signal-bearish'}`}>
                <span>{isUp ? '▲' : '▼'} {Math.abs(goldPrice.change24h).toFixed(2)}</span>
                <span>{isUp ? '+' : ''}{change.toFixed(2)}% 24h</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Price unavailable</div>
          )}

          {/* Live dot */}
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <div className="live-dot" />
            <span className="hidden sm:inline">Live</span>
          </div>

          {/* Theme toggle */}
          <div className="flex items-center bg-black/30 rounded-xl border border-gray-800 p-0.5 gap-0.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={`${t.label} theme`}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  theme === t.id
                    ? 'bg-yellow-400 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile INR bar */}
      {inrPerGram && (
        <div className="sm:hidden border-t border-yellow-400/10 px-4 py-1.5 flex items-center justify-between bg-yellow-400/5">
          <span className="text-xs text-gray-500">India 24K gold per gram</span>
          <span className="text-sm font-bold" style={{ color: '#FFD700' }}>₹{inrPerGram.toLocaleString('en-IN')}</span>
        </div>
      )}
    </header>
  );
}
