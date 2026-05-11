'use client';

import type { PortfolioEntry, Currency, Karat } from '@/types';
import { KARAT_OPTIONS, CURRENCY_INFO, WEIGHT_UNITS, type WeightUnit } from '@/lib/constants';
import { useLocalStorage } from '@/lib/useLocalStorage';

interface PortfolioFormProps {
  onAnalyze: (entry: PortfolioEntry) => void;
  loading: boolean;
}

type PriceMode = 'total' | 'per_gram';

interface SavedForm {
  karat: Karat;
  weightInput: number;
  weightUnit: WeightUnit;
  currency: Currency;
  priceMode: PriceMode;
  totalPrice: number;
  pricePerGram: number;
}

const DEFAULT_FORM: SavedForm = {
  karat: 24,
  weightInput: 0,
  weightUnit: 'g',
  currency: 'INR',
  priceMode: 'total',
  totalPrice: 0,
  pricePerGram: 0,
};

export default function PortfolioForm({ onAnalyze, loading }: PortfolioFormProps) {
  const [form, setForm, clearForm] = useLocalStorage<SavedForm>('gpp_portfolio_form', DEFAULT_FORM);

  const { symbol } = CURRENCY_INFO[form.currency];
  const unitFactor  = WEIGHT_UNITS.find((u) => u.value === form.weightUnit)?.toGrams ?? 1;
  const weightGrams = form.weightInput * unitFactor;

  const derivedPerGram = form.priceMode === 'total' && weightGrams > 0 ? form.totalPrice / weightGrams : form.pricePerGram;
  const derivedTotal   = form.priceMode === 'per_gram' && weightGrams > 0 ? form.pricePerGram * weightGrams : form.totalPrice;
  const canSubmit      = weightGrams > 0 && (form.priceMode === 'total' ? form.totalPrice > 0 : form.pricePerGram > 0);

  const set = (patch: Partial<SavedForm>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAnalyze({ purchasePrice: derivedPerGram, karat: form.karat, weightGrams, currency: form.currency });
  };

  const hasSavedData = form.weightInput > 0 && (form.totalPrice > 0 || form.pricePerGram > 0);

  return (
    <div className="gold-card p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💼</span>
          <div>
            <h2 className="text-lg font-bold text-white">Your Investment</h2>
            <p className="text-xs text-gray-500">Enter what you paid for your gold</p>
          </div>
        </div>
        {/* Saved indicator */}
        {hasSavedData && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              Auto-saved
            </span>
            <button onClick={() => clearForm()}
              className="text-xs text-gray-600 hover:text-red-400 transition-colors px-1"
              title="Clear saved data">
              ✕
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Currency */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Currency</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(CURRENCY_INFO) as [Currency, typeof CURRENCY_INFO[Currency]][]).map(([code, info]) => (
              <button key={code} type="button" onClick={() => set({ currency: code })}
                className={`flex flex-col items-center py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                  form.currency === code
                    ? 'border-yellow-400/60 bg-yellow-400/10 text-yellow-300'
                    : 'border-gray-700 text-gray-500 hover:border-gray-500'
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
          <select value={form.karat} onChange={(e) => set({ karat: Number(e.target.value) as Karat })}
            className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors">
            {KARAT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        {/* Weight + Unit */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Weight</label>
          <div className="flex gap-2">
            <input type="number" min="0.001" step="0.001" value={form.weightInput || ''}
              onChange={(e) => set({ weightInput: parseFloat(e.target.value) || 0 })}
              placeholder="e.g. 9"
              className="flex-1 bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors" />
            <div className="flex bg-black/40 rounded-xl border border-gray-700 p-0.5">
              {WEIGHT_UNITS.map((u) => (
                <button key={u.value} type="button" onClick={() => set({ weightUnit: u.value })}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    form.weightUnit === u.value ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'
                  }`}>
                  {u.value === 'g' ? 'g' : u.value === 'tola' ? 'Tola' : 'oz'}
                </button>
              ))}
            </div>
          </div>
          {form.weightInput > 0 && form.weightUnit !== 'g' && (
            <p className="text-xs text-gray-600 mt-1">= {weightGrams.toFixed(3)} grams</p>
          )}
        </div>

        {/* Price mode */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            How do you know your purchase price?
          </label>
          <div className="flex bg-black/40 rounded-xl p-1 border border-gray-800 mb-3">
            {(['total', 'per_gram'] as PriceMode[]).map((mode) => (
              <button key={mode} type="button" onClick={() => set({ priceMode: mode })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  form.priceMode === mode ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'
                }`}>
                {mode === 'total' ? 'Total I Paid' : 'Per Gram'}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 text-sm font-bold">{symbol}</span>
            {form.priceMode === 'total' ? (
              <input type="number" min="0" step="1" value={form.totalPrice || ''}
                onChange={(e) => set({ totalPrice: parseFloat(e.target.value) || 0 })}
                placeholder="Total amount paid (e.g. 142100)"
                className="w-full bg-black/40 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors" />
            ) : (
              <input type="number" min="0" step="0.01" value={form.pricePerGram || ''}
                onChange={(e) => set({ pricePerGram: parseFloat(e.target.value) || 0 })}
                placeholder="Price per gram (e.g. 9500)"
                className="w-full bg-black/40 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400/60 transition-colors" />
            )}
          </div>
          {canSubmit && (
            <p className="text-xs text-gray-600 mt-1">
              {form.priceMode === 'total'
                ? `= ${symbol}${derivedPerGram.toLocaleString('en-IN', { maximumFractionDigits: 2 })} per gram`
                : `= ${symbol}${derivedTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })} total`}
            </p>
          )}
        </div>

        {/* Summary preview */}
        {canSubmit && (
          <div className="rounded-xl p-3 bg-yellow-400/5 border border-yellow-400/10 space-y-1.5">
            {[
              ['Total paid',     `${symbol}${derivedTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`],
              ['Per gram',       `${symbol}${derivedPerGram.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`],
              ['Weight × Karat', `${weightGrams.toFixed(3)}g × ${form.karat}K`],
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
