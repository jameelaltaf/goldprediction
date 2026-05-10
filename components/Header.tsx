'use client';

import type { GoldPrice } from '@/types';

interface HeaderProps {
  goldPrice: GoldPrice | null;
  loading: boolean;
}

export default function Header({ goldPrice, loading }: HeaderProps) {
  const change = goldPrice?.changePercent24h ?? 0;
  const isUp = change >= 0;

  return (
    <header className="border-b border-yellow-600/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
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

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              Fetching live data…
            </div>
          ) : goldPrice ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wider">XAU / USD Spot</div>
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

          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <div className="live-dot" />
            <span>Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}
