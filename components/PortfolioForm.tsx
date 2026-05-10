'use client';

import { useState } from 'react';
import type { PortfolioEntry, Currency, Karat } from '@/types';
import { KARAT_OPTIONS, CURRENCY_INFO } from '@/lib/constants';

interface PortfolioFormProps {
  onAnalyze: (entry: PortfolioEntry) => void;
  loading: boolean;
}

export default function PortfolioForm({ onAnalyze, loading }: PortfolioFormProps) {
  const [form, setForm] = useState<PortfolioEntry>({
    purchasePrice: 0,
    karat: 24,
    weightGrams: 10,
    currency: 'USD',
  });

  const currencies = Object.entries(CURRENCY_INFO) as [Currency, (typeof CURRENCY_INFO)[Currency]][];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.purchasePrice > 0 && form.weightGrams > 0) {
      onAnalyze(form);
    }
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
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {currencies.map(([code, info]) => (
              <button
                key={code}
                type="button"
                onClick={() => setForm((f) => ({ ...f, currency: code }))}
                className={`flex flex-col items-center py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                  form.currency === code
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
            value={form.karat}
            onChange={(e) => setForm((f) => ({ ...f, karat: Number(e.target.value) as Karat }))}
            className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors"
          >
            {KARAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
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
              value={form.weightGrams || ''}
              onChange={(e) => setForm((f) => ({ ...f, weightGrams: parseFloat(e.target.value) || 0 }))}
              placeholder="e.g. 10"
              className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors pr-14"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">g</span>
          </div>
        </div>

        {/* Purchase Price */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            What You Paid (per gram in {form.currency})
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 text-sm font-bold">
              {CURRENCY_INFO[form.currency].symbol}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.purchasePrice || ''}
              onChange={(e) => setForm((f) => ({ ...f, purchasePrice: parseFloat(e.target.value) || 0 }))}
              placeholder="Enter price per gram"
              className="w-full bg-black/40 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors"
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Tip: enter the total price ÷ grams
          </p>
        </div>

        {/* Total Cost Preview */}
        {form.purchasePrice > 0 && form.weightGrams > 0 && (
          <div className="rounded-xl p-3 bg-yellow-400/5 border border-yellow-400/10 flex justify-between items-center">
            <span className="text-xs text-gray-400">Total you paid</span>
            <span className="font-bold text-yellow-300">
              {CURRENCY_INFO[form.currency].symbol}
              {(form.purchasePrice * form.weightGrams).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !form.purchasePrice || !form.weightGrams}
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
