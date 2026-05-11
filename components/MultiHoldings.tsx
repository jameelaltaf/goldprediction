'use client';

import { useState } from 'react';
import type { HoldingEntry, Karat, Currency } from '@/types';
import { CURRENCY_INFO, KARAT_PURITY, KARAT_OPTIONS, TROY_OZ_TO_GRAMS, LOCAL_MARKET_FACTOR } from '@/lib/constants';

interface MultiHoldingsProps {
  currentSpotUSD: number;
  defaultCurrency: Currency;
  exchangeRates: Partial<Record<Currency, number>>;
}

function uid() { return Math.random().toString(36).slice(2, 9); }

function calcHolding(h: HoldingEntry, spotUSD: number, rates: Partial<Record<Currency, number>>) {
  const purity      = KARAT_PURITY[h.karat];
  const rate        = rates[h.currency] ?? 1;
  const localFactor = LOCAL_MARKET_FACTOR[h.currency]?.factor ?? 1;
  const currentPPG  = (spotUSD / TROY_OZ_TO_GRAMS) * purity * rate * localFactor;
  const purchased   = h.purchasePrice * h.weightGrams;
  const current     = currentPPG * h.weightGrams;
  return { purchased, current, pl: current - purchased, plPct: ((current - purchased) / purchased) * 100 };
}

const DEFAULT_HOLDING: Omit<HoldingEntry, 'id'> = {
  label: '',
  purchasePrice: 0,
  karat: 22,
  weightGrams: 5,
  currency: 'INR',
  purchaseDate: new Date().toISOString().split('T')[0],
};

export default function MultiHoldings({ currentSpotUSD, defaultCurrency, exchangeRates }: MultiHoldingsProps) {
  const [holdings, setHoldings] = useState<HoldingEntry[]>([]);
  const [adding, setAdding]     = useState(false);
  const [form, setForm]         = useState<Omit<HoldingEntry, 'id'>>({ ...DEFAULT_HOLDING, currency: defaultCurrency });
  const [priceMode, setPriceMode] = useState<'total' | 'per_gram'>('total');
  const [totalInput, setTotalInput] = useState(0);

  const isINR = (c: Currency) => c === 'INR' || c === 'PKR';
  const fmt = (n: number, c: Currency) => n.toLocaleString(isINR(c) ? 'en-IN' : 'en-US', { maximumFractionDigits: 0 });

  const addHolding = () => {
    const perGram = priceMode === 'total' && form.weightGrams > 0 ? totalInput / form.weightGrams : form.purchasePrice;
    if (perGram <= 0 || form.weightGrams <= 0) return;
    setHoldings((prev) => [...prev, { ...form, id: uid(), purchasePrice: perGram }]);
    setAdding(false);
    setForm({ ...DEFAULT_HOLDING, currency: defaultCurrency });
    setTotalInput(0);
  };

  const removeHolding = (id: string) => setHoldings((prev) => prev.filter((h) => h.id !== id));

  const totals = holdings.reduce((acc, h) => {
    const r = calcHolding(h, currentSpotUSD, exchangeRates);
    // Normalise to USD for summing across currencies
    const rateH = exchangeRates[h.currency] ?? 1;
    return {
      invested: acc.invested + r.purchased / rateH,
      current:  acc.current  + r.current  / rateH,
    };
  }, { invested: 0, current: 0 });

  const totalPL    = totals.current - totals.invested;
  const totalPLPct = totals.invested > 0 ? (totalPL / totals.invested) * 100 : 0;

  return (
    <div className="gold-card p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📦</span>
          <div>
            <h2 className="text-lg font-bold text-white">Portfolio Tracker</h2>
            <p className="text-xs text-gray-500">Track multiple gold purchases in one place</p>
          </div>
        </div>
        <button onClick={() => setAdding(true)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-black transition-all"
          style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}>
          + Add Holding
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="rounded-2xl p-5 border border-yellow-400/20 bg-yellow-400/5 mb-6 fade-in">
          <h3 className="text-sm font-bold text-white mb-4">New Holding</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Label (optional)</label>
              <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Wedding gold"
                className="w-full bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400/60" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Purchase Date</label>
              <input type="date" value={form.purchaseDate}
                onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                className="w-full bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400/60" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Karat</label>
              <select value={form.karat} onChange={(e) => setForm((f) => ({ ...f, karat: Number(e.target.value) as Karat }))}
                className="w-full bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400/60">
                {KARAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value}K</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Currency</label>
              <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as Currency }))}
                className="w-full bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400/60">
                {Object.entries(CURRENCY_INFO).map(([c, i]) => <option key={c} value={c}>{i.flag} {c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Weight (grams)</label>
              <input type="number" min="0.1" step="0.1" value={form.weightGrams || ''}
                onChange={(e) => setForm((f) => ({ ...f, weightGrams: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400/60" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                {priceMode === 'total' ? 'Total Paid' : 'Per Gram'} ({CURRENCY_INFO[form.currency].symbol})
              </label>
              <div className="flex gap-1">
                <input type="number" min="0" step="1"
                  value={(priceMode === 'total' ? totalInput : form.purchasePrice) || ''}
                  onChange={(e) => priceMode === 'total'
                    ? setTotalInput(parseFloat(e.target.value) || 0)
                    : setForm((f) => ({ ...f, purchasePrice: parseFloat(e.target.value) || 0 }))}
                  className="flex-1 bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400/60" />
                <button onClick={() => setPriceMode((m) => m === 'total' ? 'per_gram' : 'total')}
                  className="px-2 py-1 rounded-lg border border-gray-700 text-gray-400 text-xs hover:border-gray-500 transition-colors">
                  {priceMode === 'total' ? '÷g' : '×g'}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addHolding}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}>
              Add to Portfolio
            </button>
            <button onClick={() => setAdding(false)}
              className="px-4 py-2.5 rounded-xl text-sm text-gray-400 border border-gray-700 hover:border-gray-500">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Holdings list */}
      {holdings.length === 0 ? (
        <div className="text-center py-10 text-gray-600">
          <div className="text-5xl mb-3 opacity-20">🏅</div>
          <p className="text-sm">No holdings yet. Click <span className="text-yellow-400">+ Add Holding</span> to start tracking.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-5">
            {holdings.map((h) => {
              const r       = calcHolding(h, currentSpotUSD, exchangeRates);
              const { symbol } = CURRENCY_INFO[h.currency];
              const isP = r.pl >= 0;
              return (
                <div key={h.id} className="rounded-xl p-4 bg-black/30 border border-gray-800 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">{h.label || `${h.weightGrams}g ${h.karat}K`}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{h.karat}K</span>
                      <span className="text-xs text-gray-600">{h.currency}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {h.weightGrams}g · Bought {new Date(h.purchaseDate).toLocaleDateString()} · {symbol}{fmt(r.purchased, h.currency)} paid
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-white">{symbol}{fmt(r.current, h.currency)}</div>
                    <div className={`text-xs font-bold ${isP ? 'bullish' : 'bearish'}`}>
                      {isP ? '+' : '-'}{symbol}{fmt(Math.abs(r.pl), h.currency)} ({isP ? '+' : ''}{r.plPct.toFixed(1)}%)
                    </div>
                  </div>
                  <button onClick={() => removeHolding(h.id)} className="text-gray-700 hover:text-red-400 transition-colors text-lg">×</button>
                </div>
              );
            })}
          </div>

          {/* Portfolio total */}
          <div className={`rounded-2xl p-5 border text-center ${totalPL >= 0 ? 'recommendation-sell-90' : 'recommendation-sell-now'}`}>
            <div className="text-xs text-gray-400 mb-1">Portfolio Total (USD equivalent)</div>
            <div className="text-xl font-bold text-white mb-1">${totals.current.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            <div className={`text-2xl font-black ${totalPL >= 0 ? 'bullish' : 'bearish'}`}>
              {totalPL >= 0 ? '+' : '-'}${Math.abs(totalPL).toLocaleString('en-US', { maximumFractionDigits: 0 })} ({totalPL >= 0 ? '+' : ''}{totalPLPct.toFixed(2)}%)
            </div>
            <div className="text-xs text-gray-500 mt-1">{holdings.length} holding{holdings.length !== 1 ? 's' : ''} · ${totals.invested.toLocaleString('en-US', { maximumFractionDigits: 0 })} invested</div>
          </div>
        </>
      )}
    </div>
  );
}
