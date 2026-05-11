'use client';

import { useState, useMemo } from 'react';
import type { PortfolioEntry } from '@/types';
import { CURRENCY_INFO, KARAT_PURITY, TROY_OZ_TO_GRAMS, LOCAL_MARKET_FACTOR, INDIA_GOLD_TAX } from '@/lib/constants';

interface LTCGCalculatorProps {
  entry: PortfolioEntry;
  currentSpotUSD: number;
  exchangeRate: number;
}

const TAX_SLABS = [
  { label: '0% (Below ₹3L)', rate: 0 },
  { label: '5% (₹3L–7L)',    rate: 5 },
  { label: '10% (₹7L–10L)',  rate: 10 },
  { label: '15% (₹10L–12L)', rate: 15 },
  { label: '20% (₹12L–15L)', rate: 20 },
  { label: '30% (Above ₹15L)',rate: 30 },
];

export default function LTCGCalculator({ entry, currentSpotUSD, exchangeRate }: LTCGCalculatorProps) {
  const today = new Date().toISOString().split('T')[0];
  const [purchaseDate, setPurchaseDate] = useState('2023-01-01');
  const [stcgSlab, setStcgSlab]         = useState(20);
  const [saleSpot, setSaleSpot]         = useState(Math.round(currentSpotUSD));

  const { symbol } = CURRENCY_INFO[entry.currency];
  const isINR      = entry.currency === 'INR' || entry.currency === 'PKR';
  const fmt        = (n: number) => n.toLocaleString(isINR ? 'en-IN' : 'en-US', { maximumFractionDigits: 0 });

  const analysis = useMemo(() => {
    const purity      = KARAT_PURITY[entry.karat];
    const localFactor = LOCAL_MARKET_FACTOR[entry.currency]?.factor ?? 1;

    const purchaseValue = entry.purchasePrice * entry.weightGrams;
    const salePricePerGram = (saleSpot / TROY_OZ_TO_GRAMS) * purity * exchangeRate * localFactor;
    const saleValue = salePricePerGram * entry.weightGrams;
    const gain      = saleValue - purchaseValue;

    const purchaseDateObj = new Date(purchaseDate);
    const monthsHeld = Math.floor((Date.now() - purchaseDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const isLTCG     = monthsHeld >= INDIA_GOLD_TAX.ltcgHoldingMonths;

    let taxAmount = 0;
    let effectiveRate = 0;
    if (gain > 0) {
      if (isLTCG) {
        taxAmount     = gain * INDIA_GOLD_TAX.ltcgRate;
        effectiveRate = INDIA_GOLD_TAX.ltcgRate * 100;
      } else {
        taxAmount     = gain * (stcgSlab / 100);
        effectiveRate = stcgSlab;
      }
    }

    const afterTaxGain = gain - taxAmount;
    const afterTaxReturn = purchaseValue > 0 ? (afterTaxGain / purchaseValue) * 100 : 0;
    const monthsToLTCG = Math.max(0, INDIA_GOLD_TAX.ltcgHoldingMonths - monthsHeld);

    return { purchaseValue, saleValue, gain, taxAmount, afterTaxGain, afterTaxReturn, isLTCG, monthsHeld, monthsToLTCG, effectiveRate, salePricePerGram };
  }, [entry, currentSpotUSD, exchangeRate, purchaseDate, stcgSlab, saleSpot]);

  return (
    <div className="gold-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🧾</span>
        <div>
          <h2 className="text-lg font-bold text-white">LTCG Tax Calculator</h2>
          <p className="text-xs text-gray-500">India capital gains tax on physical gold (post Jul 2024 budget)</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {/* Purchase date */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Purchase Date
          </label>
          <input type="date" value={purchaseDate} max={today}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60" />
        </div>

        {/* Sale spot price */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Sale Spot Price (USD / troy oz)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input type="number" value={saleSpot} min={500} step={10}
              onChange={(e) => setSaleSpot(Number(e.target.value))}
              className="w-full bg-black/40 border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60" />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Sale value in {entry.currency}: {symbol}{fmt(analysis.salePricePerGram)}/g = {symbol}{fmt(analysis.saleValue)} total
          </p>
        </div>

        {/* STCG slab (only if not LTCG) */}
        {!analysis.isLTCG && (
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Your Income Tax Slab (for STCG)
            </label>
            <select value={stcgSlab} onChange={(e) => setStcgSlab(Number(e.target.value))}
              className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60">
              {TAX_SLABS.map((s) => <option key={s.rate} value={s.rate}>{s.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Holding period badge */}
      <div className={`rounded-xl p-3 mb-4 border flex items-center justify-between ${
        analysis.isLTCG ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'
      }`}>
        <div>
          <div className={`text-xs font-bold ${analysis.isLTCG ? 'text-green-400' : 'text-yellow-400'}`}>
            {analysis.isLTCG ? '✅ Long-Term Capital Gain (LTCG)' : '⚠️ Short-Term Capital Gain (STCG)'}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            Held for {analysis.monthsHeld} months
            {!analysis.isLTCG && ` — hold ${analysis.monthsToLTCG} more months for LTCG`}
          </div>
        </div>
        <div className={`text-lg font-black ${analysis.isLTCG ? 'text-green-400' : 'text-yellow-400'}`}>
          {analysis.effectiveRate}%
        </div>
      </div>

      {/* Tax breakdown */}
      <div className="rounded-xl overflow-hidden border border-gray-800 mb-4">
        {[
          { label: 'Sale Value',         value: `${symbol}${fmt(analysis.saleValue)}`,        bold: false },
          { label: 'Purchase Cost',      value: `− ${symbol}${fmt(analysis.purchaseValue)}`,  bold: false },
          { label: 'Capital Gain',       value: `${symbol}${fmt(analysis.gain)}`,             bold: true  },
          { label: `Tax (${analysis.effectiveRate}%)`, value: `− ${symbol}${fmt(analysis.taxAmount)}`, bold: false, red: true },
          { label: 'After-Tax Profit',   value: `${symbol}${fmt(analysis.afterTaxGain)}`,     bold: true, green: analysis.afterTaxGain >= 0 },
        ].map((row, i) => (
          <div key={i} className={`flex justify-between px-4 py-2.5 border-b border-gray-800/50 last:border-0 ${row.bold ? 'bg-black/20' : ''}`}>
            <span className="text-xs text-gray-400">{row.label}</span>
            <span className={`text-xs font-bold ${row.red ? 'text-red-400' : row.green ? 'text-green-400' : 'text-white'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className={`rounded-xl p-4 border text-center ${analysis.afterTaxGain >= 0 ? 'recommendation-sell-90' : 'recommendation-sell-now'}`}>
        <div className="text-xs text-gray-400 mb-1">After-Tax Return on Investment</div>
        <div className={`text-3xl font-black ${analysis.afterTaxGain >= 0 ? 'bullish' : 'bearish'}`}>
          {analysis.afterTaxReturn >= 0 ? '+' : ''}{analysis.afterTaxReturn.toFixed(2)}%
        </div>
      </div>

      <p className="text-xs text-gray-700 mt-4 text-center leading-relaxed">
        Based on India Finance Act 2024. LTCG @ 12.5% without indexation (assets held 24+ months).
        Does not include surcharge or cess. Consult a CA for personalised advice.
      </p>
    </div>
  );
}
