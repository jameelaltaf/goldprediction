'use client';

import { useState } from 'react';
import type { PortfolioEntry, Currency, Karat } from '@/types';
import { KARAT_OPTIONS, CURRENCY_INFO, WEIGHT_UNITS, type WeightUnit } from '@/lib/constants';

interface PortfolioFormProps {
  onAnalyze: (entry: PortfolioEntry) => void;
  loading: boolean;
}

type PriceMode = 'total' | 'per_gram';

export default function PortfolioForm({ onAnalyze, loading }: PortfolioFormProps) {
  const [karat, setKarat]             = useState<Karat>(24);
  const [weightInput, setWeightInput] = useState<number>(0);
  const [weightUnit, setWeightUnit]   = useState<WeightUnit>('g');
  const [currency, setCurrency]       = useState<Currency>('INR');
  const [priceMode, setPriceMode]     = useState<PriceMode>('total');
  const [totalPrice, setTotalPrice]   = useState<number>(0);
  const [pricePerGram, setPricePerGram] = useState<number>(0);

  const currencies  = Object.entries(CURRENCY_INFO) as [Currency, (typeof CURRENCY_INFO)[Currency]][];
  const { symbol }  = CURRENCY_INFO[currency];
  const unitFactor  = WEIGHT_UNITS.find((u) => u.value === weightUnit)?.toGrams ?? 1;
  const weightGrams = weightInput * unitFactor;

  const derivedPerGram = priceMode === 'total' && weightGrams > 0 ? totalPrice / weightGrams : pricePerGram;
  const derivedTotal   = priceMode === 'per_gram' && weightGrams > 0 ? pricePerGram * weightGrams : totalPrice;
  const canSubmit      = weightGrams > 0 && (priceMode === 'total' ? totalPrice > 0 : pricePerGram > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAnalyze({ purchasePrice: derivedPerGram, karat, weightGrams, currency });
  };

  return (
    <div className="gold-card p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">💼</span>
        <div>
          <h2 className="text-lg font-bold text-white">Your Investment</h2>
          <p className="text-xs text-gray-500">Enter what you paid for your gold</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Currency */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Currency</label>
          <div className="grid grid-cols-4 gap-2">
            {currencies.map(([code, info]) => (
              <button key={code} type="button" onClick={() => setCurrency(code)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                  currency === code ? 'border-yellow-400/60 bg-yellow-400/10 text-yellow-300' : 'border-gray-700 text-gray-500 hover:border-gray-500'
                }`}>
                <span className="text-lg leading-none mb-1">{info.flag}</span>
                <span>{code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Karat */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gold Karat (Purity)</label>
          <select value={karat} onChange={(e) => setKarat(Number(e.target.value) as Karat)}
            className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors">
            {KARAT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        {/* Weight + Unit */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Weight</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input type="number" min="0.001" step="0.001" value={weightInput || ''}
                onChange={(e) => setWeightInput(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 9"
                className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors" />
            </div>
            <div className="flex bg-black/40 rounded-xl border border-gray-700 p-0.5">
              {WEIGHT_UNITS.map((u) => (
                <button key={u.value} type="button" onClick={() => setWeightUnit(u.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    weightUnit === u.value ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'
                  }`}>
                  {u.value === 'g' ? 'g' : u.value === 'tola' ? 'Tola' : 'oz'}
                </button>
              ))}
            </div>
          </div>
          {weightInput > 0 && weightUnit !== 'g' && (
            <p className="text-xs text-gray-600 mt-1">= {weightGrams.toFixed(3)} grams</p>
          )}
        </div>

        {/* Price Mode Toggle */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            How do you know your purchase price?
          </label>
          <div className="flex bg-black/40 rounded-xl p-1 border border-gray-800 mb-3">
            {(['total', 'per_gram'] as PriceMode[]).map((mode) => (
              <button key={mode} type="button" onClick={() => setPriceMode(mode)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  priceMode === mode ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'
                }`}>
                {mode === 'total' ? 'Total I Paid' : 'Per Gram'}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 text-sm font-bold">{symbol}</span>
            {priceMode === 'total' ? (
              <input type="number" min="0" step="1" value={totalPrice || ''}
                onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)}
                placeholder="Total amount paid (e.g. 142100)"
                className="w-full bg-black/40 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors" />
            ) : (
              <input type="number" min="0" step="0.01" value={pricePerGram || ''}
                onChange={(e) => setPricePerGram(parseFloat(e.target.value) || 0)}
                placeholder="Price per gram (e.g. 9500)"
                className="w-full bg-black/40 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors" />
            )}
          </div>
          {canSubmit && weightGrams > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              {priceMode === 'total'
                ? `= ${symbol}${derivedPerGram.toLocaleString('en-IN', { maximumFractionDigits: 2 })} per gram`
                : `= ${symbol}${derivedTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })} total`}
            </p>
          )}
        </div>

        {/* Summary Preview */}
        {canSubmit && weightGrams > 0 && (
          <div className="rounded-xl p-3 bg-yellow-400/5 border border-yellow-400/10 space-y-1.5">
            {[
              ['Total paid',      `${symbol}${derivedTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`],
              ['Per gram',        `${symbol}${derivedPerGram.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`],
              ['Weight × Karat',  `${weightGrams.toFixed(3)}g × ${karat}K`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-gray-400">{label}</span>
                <span className="font-bold text-yellow-300">{value}</span>
              </div>
            ))}
          </div>
        )}

        <button type="submit" disabled={loading || !canSubmit}
          className="w-full py-4 rounded-xl font-bold text-black text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', boxShadow: '0 4px 20px rgba(255,215,0,0.3)' }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analyzing Markets…
            </span>
          ) : '⚡ Analyze My Investment'}
        </button>
      </form>
    </div>
  );
}
