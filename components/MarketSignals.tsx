'use client';

import { useState } from 'react';
import type { Signal, SignalCategory } from '@/types';

interface MarketSignalsProps {
  signals: Signal[];
}

const CATEGORY_LABELS: Record<SignalCategory, { label: string; emoji: string }> = {
  technical:   { label: 'Technical',   emoji: '📐' },
  fundamental: { label: 'Fundamental', emoji: '🏦' },
  seasonal:    { label: 'Seasonal',    emoji: '🗓️' },
};

function SignalBar({ score }: { score: number }) {
  const pct = ((score + 1) / 2) * 100;
  const color = score > 0.1 ? '#22c55e' : score < -0.1 ? '#ef4444' : '#eab308';
  return (
    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden w-16 mt-1">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl p-3 bg-black/20 border border-gray-800/50 cursor-pointer hover:border-gray-700 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              signal.signal === 'bullish' ? 'signal-bullish' :
              signal.signal === 'bearish' ? 'signal-bearish' : 'signal-neutral'
            }`}>
              {signal.signal === 'bullish' ? '▲ Bull' : signal.signal === 'bearish' ? '▼ Bear' : '◆ Neut'}
            </span>
            <span className="text-sm font-medium text-white truncate">{signal.name}</span>
          </div>
          <SignalBar score={signal.score} />
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-gray-400 font-mono">{signal.value}</div>
          <div className="text-xs text-gray-600 mt-0.5">wt: {(signal.weight * 100).toFixed(0)}%</div>
        </div>
        <span className={`text-gray-600 text-xs mt-1 transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-400 leading-relaxed fade-in">
          {signal.description}
        </div>
      )}
    </div>
  );
}

export default function MarketSignals({ signals }: MarketSignalsProps) {
  const [activeCategory, setActiveCategory] = useState<SignalCategory | 'all'>('all');

  const categories: (SignalCategory | 'all')[] = ['all', 'technical', 'fundamental', 'seasonal'];

  const filtered = activeCategory === 'all'
    ? signals
    : signals.filter((s) => s.category === activeCategory);

  const bullishCount = signals.filter((s) => s.signal === 'bullish').length;
  const bearishCount = signals.filter((s) => s.signal === 'bearish').length;
  const neutralCount = signals.filter((s) => s.signal === 'neutral').length;

  return (
    <div className="gold-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">📡</span>
        <div>
          <h2 className="text-lg font-bold text-white">Market Signals</h2>
          <p className="text-xs text-gray-500">Click any signal to see detailed analysis</p>
        </div>
      </div>

      {/* Signal summary */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: 'Bullish', count: bullishCount, colorClass: 'signal-bullish', emoji: '▲' },
          { label: 'Bearish', count: bearishCount, colorClass: 'signal-bearish', emoji: '▼' },
          { label: 'Neutral', count: neutralCount, colorClass: 'signal-neutral', emoji: '◆' },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl p-3 border text-center ${item.colorClass}`}>
            <div className="text-2xl font-black">{item.count}</div>
            <div className="text-xs mt-0.5">{item.emoji} {item.label}</div>
          </div>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex bg-black/40 rounded-lg p-0.5 border border-gray-800 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
              activeCategory === cat
                ? 'bg-yellow-400 text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {cat === 'all' ? 'All' : (
              <>
                <span className="sm:hidden">{CATEGORY_LABELS[cat].emoji}</span>
                <span className="hidden sm:inline">{CATEGORY_LABELS[cat].emoji} {CATEGORY_LABELS[cat].label}</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Signals list */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map((signal) => (
          <SignalRow key={signal.id} signal={signal} />
        ))}
      </div>

      {/* Data sources */}
      <div className="mt-5 pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-600 mb-2 font-medium uppercase tracking-wider">Data Sources</div>
        <div className="flex flex-wrap gap-2">
          {['Yahoo Finance (XAU/USD)', 'Yahoo Finance (DXY)', 'Federal Reserve (FRED)', 'Gold Futures (GC=F)'].map((src) => (
            <span key={src} className="text-xs px-2 py-1 rounded-md bg-gray-800/50 text-gray-500 border border-gray-700/50">
              {src}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
