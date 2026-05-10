'use client';

import { useState } from 'react';
import type { PortfolioEntry, Currency, Karat } from '@/types';
import { KARAT_OPTIONS, CURRENCY_INFO } from '@/lib/constants';

interface PortfolioFormProps {
  onAnalyze: (entry: PortfolioEntry) => void;
  loading: boolean;
}

type PriceMode = 'total' | 'per_gram';

export default function PortfolioForm({ onAnalyze, loading }: PortfolioFormProps) {
  const [karat, setKarat] = useState<Karat>(24);
  const [weightGrams, setWeightGrams] = useState<number>(0);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [priceMode, setPriceMode] = useState<PriceMode>('total');
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [pricePerGram, setPricePerGram] = useState<number>(0);

  const currencies = Object.entries(CURRENCY_INFO) as [Currency, (typeof CURRENCY_INFO)[Currency]][];
  const { symbol } = CURRENCY_INFO[currency];

  // Derived values
  const derivedPerGram = priceMode === 'total' && weightGrams > 0 ? totalPrice / weightGrams : pricePerGram;
  const derivedTotal   = priceMode === 'per_gram' && weightGrams > 0 ? pricePerGram * weightGrams : totalPrice;
  const canSubmit = weightGrams > 0 && (priceMode === 'total' ? totalPrice > 0 : pricePerGram > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAnalyze({
      purchasePrice: derivedPerGram, // always stored as per-gram internally
      karat,
      weightGrams,
      currency,
    });
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
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Currency
          </label>
          <div className="grid grid-cols-4 gap-2">
            {currencies.map(([code, info]) => (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                  currency === code
                    ? 'border-yellow-400/60 bg-yellow-400/10 text-yellow-300'
                    : 'border-gray-700 text-gray-500 hover:border-gray-500'
                }`}
              >
                <span className="text-lg leading-none mb-1">{info.flag}</span>
                <span>{code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Karat */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Gold Karat (Purity)
          </label>
          <select
            value={karat}
            onChange={(e) => setKarat(Number(e.target.value) as Karat)}
            className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors"
          >
            {KARAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Weight */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Weight (Grams)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={weightGrams || ''}
              onChange={(e) => setWeightGrams(parseFloat(e.target.value) || 0)}
              placeholder="e.g. 9"
              className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors pr-14"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">g</span>
          </div>
        </div>

        {/* Price mode toggle */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            How do you know your purchase price?
          </label>
          <div className="flex bg-black/40 rounded-xl p-1 border border-gray-800 mb-3">
            <button
              type="button"
              onClick={() => setPriceMode('total')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                priceMode === 'total'
                  ? 'bg-yellow-400 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Total I Paid
            </button>
            <button
              type="button"
              onClick={() => setPriceMode('per_gram')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                priceMode === 'per_gram'
                  ? 'bg-yellow-400 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Price Per Gram
            </button>
          </div>

          {priceMode === 'total' ? (
            <div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 text-sm font-bold">
                  {symbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={totalPrice || ''}
                  onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 142100"
                  className="w-full bg-black/40 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors"
                />
              </div>
              {totalPrice > 0 && weightGrams > 0 && (
                <p className="text-xs text-gray-500 mt-1.5">
                  = {symbol}{derivedPerGram.toLocaleString('en-IN', { maximumFractionDigits: 2 })} per gram
                </p>
              )}
            </div>
          ) : (
            <div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 text-sm font-bold">
                  {symbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricePerGram || ''}
                  onChange={(e) => setPricePerGram(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 9500"
                  className="w-full bg-black/40 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors"
                />
              </div>
              {pricePerGram > 0 && weightGrams > 0 && (
                <p className="text-xs text-gray-500 mt-1.5">
                  = {symbol}{derivedTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })} total
                </p>
              )}
            </div>
          )}
        </div>

        {/* Summary preview */}
        {canSubmit && weightGrams > 0 && (
          <div className="rounded-xl p-3 bg-yellow-400/5 border border-yellow-400/10 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Total paid</span>
              <span className="font-bold text-yellow-300">
                {symbol}{derivedTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Price per gram</span>
              <span className="text-gray-300">
                {symbol}{derivedPerGram.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Weight × Karat</span>
              <span className="text-gray-300">{weightGrams}g × {karat}K</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full py-4 rounded-xl font-bold text-black text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', boxShadow: '0 4px 20px rgba(255,215,0,0.3)' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analyzing Markets…
            </span>
          ) : (
            '⚡ Analyze My Investment'
          )}
        </button>
      </form>
    </div>
  );
}
