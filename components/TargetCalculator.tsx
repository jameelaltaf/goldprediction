'use client';

import { useState, useMemo } from 'react';
import type { PortfolioEntry } from '@/types';
import { CURRENCY_INFO, KARAT_PURITY, TROY_OZ_TO_GRAMS, LOCAL_MARKET_FACTOR } from '@/lib/constants';

interface TargetCalculatorProps {
  entry: PortfolioEntry;
  currentSpotUSD: number;
  exchangeRate: number;
}

export default function TargetCalculator({ entry, currentSpotUSD, exchangeRate }: TargetCalculatorProps) {
  const [targetSpot, setTargetSpot] = useState(Math.round(currentSpotUSD * 1.1));

  const { symbol } = CURRENCY_INFO[entry.currency];
  const isINR = entry.currency === 'INR' || entry.currency === 'PKR';
  const fmt = (n: number) => n.toLocaleString(isINR ? 'en-IN' : 'en-US', { maximumFractionDigits: 0 });

  const purity      = KARAT_PURITY[entry.karat];
  const localFactor = LOCAL_MARKET_FACTOR[entry.currency]?.factor ?? 1;
  const purchaseTotal = entry.purchasePrice * entry.weightGrams;

  const calc = useMemo(() => {
    const pricePerGram  = (targetSpot / TROY_OZ_TO_GRAMS) * purity * exchangeRate * localFactor;
    const totalValue    = pricePerGram * entry.weightGrams;
    const profit        = totalValue - purchaseTotal;
    const profitPct     = (profit / purchaseTotal) * 100;
    const changeFromNow = ((targetSpot - currentSpotUSD) / currentSpotUSD) * 100;
    return { pricePerGram, totalValue, profit, profitPct, changeFromNow };
  }, [targetSpot, entry, exchangeRate, purity, localFactor, purchaseTotal, currentSpotUSD]);

  const breakEvenSpot = useMemo(() => {
    const perGramUSD = entry.purchasePrice / exchangeRate / localFactor / purity;
    return Math.round(perGramUSD * TROY_OZ_TO_GRAMS);
  }, [entry, exchangeRate, purity, localFactor]);

  const sliderMin = Math.round(currentSpotUSD * 0.6);
  const sliderMax = Math.round(currentSpotUSD * 2.0);
  const sliderPct = ((targetSpot - sliderMin) / (sliderMax - sliderMin)) * 100;
  const isProfit = calc.profit >= 0;

  const presets = [
    { label: '-20%', spot: Math.round(currentSpotUSD * 0.8) },
    { label: '-10%', spot: Math.round(currentSpotUSD * 0.9) },
    { label: 'Now',  spot: Math.round(currentSpotUSD) },
    { label: '+10%', spot: Math.round(currentSpotUSD * 1.1) },
    { label: '+20%', spot: Math.round(currentSpotUSD * 1.2) },
    { label: '+50%', spot: Math.round(currentSpotUSD * 1.5) },
  ];

  return (
    <div className="gold-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🎯</span>
        <div>
          <h2 className="text-lg font-bold text-white">Target Price Calculator</h2>
          <p className="text-xs text-gray-500">Drag to see your profit at any gold price</p>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>${sliderMin.toLocaleString()}</span>
          <span className="font-bold text-yellow-300 text-sm">${targetSpot.toLocaleString()} / troy oz</span>
          <span>${sliderMax.toLocaleString()}</span>
        </div>
        <div className="relative h-3">
          <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gray-800" />
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500"
               style={{ width: `${sliderPct}%` }} />
          <input type="range" min={sliderMin} max={sliderMax} step={10}
            value={targetSpot}
            onChange={(e) => setTargetSpot(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
          <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-yellow-400 shadow-lg border-2 border-black pointer-events-none"
               style={{ left: `calc(${sliderPct}% - 10px)` }} />
        </div>

        {/* Break-even marker */}
        {breakEvenSpot >= sliderMin && breakEvenSpot <= sliderMax && (
          <div className="relative mt-1">
            <div className="absolute text-xs text-green-400 -translate-x-1/2 whitespace-nowrap"
                 style={{ left: `${((breakEvenSpot - sliderMin) / (sliderMax - sliderMin)) * 100}%` }}>
              ↑ Break-even ${breakEvenSpot.toLocaleString()}
            </div>
          </div>
        )}

        {/* Presets */}
        <div className="flex gap-1.5 mt-6">
          {presets.map((p) => (
            <button key={p.label} onClick={() => setTargetSpot(p.spot)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                p.spot === Math.round(currentSpotUSD)
                  ? 'border-yellow-400/60 bg-yellow-400/10 text-yellow-300'
                  : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-white'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result Hero */}
      <div className={`rounded-2xl p-5 border text-center mb-4 ${isProfit ? 'recommendation-sell-90' : 'recommendation-sell-now'}`}>
        <div className="text-xs text-gray-400 mb-1">Your Profit / Loss at this price</div>
        <div className={`text-4xl font-black mb-1 ${isProfit ? 'bullish' : 'bearish'}`}>
          {isProfit ? '+' : '-'}{symbol}{fmt(Math.abs(calc.profit))}
        </div>
        <div className={`text-lg font-bold ${isProfit ? 'bullish' : 'bearish'}`}>
          {isProfit ? '+' : ''}{calc.profitPct.toFixed(2)}% return
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Gold price change',   value: `${calc.changeFromNow >= 0 ? '+' : ''}${calc.changeFromNow.toFixed(1)}%`, color: calc.changeFromNow >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Value at target',     value: `${symbol}${fmt(calc.totalValue)}`,       color: 'text-white' },
          { label: `${entry.karat}K /gram at target`, value: `${symbol}${fmt(calc.pricePerGram)}`, color: 'text-yellow-300' },
          { label: 'Break-even spot',     value: `$${breakEvenSpot.toLocaleString()}`,     color: 'text-green-400' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl p-3 bg-black/30 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">{item.label}</div>
            <div className={`font-bold text-sm ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
