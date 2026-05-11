'use client';

import { useState, useEffect } from 'react';
import type { CityRate } from '@/types';

interface IndiaRatesData {
  mcxBase24k: number;
  spotUSD: number;
  inrRate: number;
  lastUpdated: string;
  source: string;
  cityRates: CityRate[];
}

function fmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function IndiaMarketPrices() {
  const [data, setData]       = useState<IndiaRatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [karat, setKarat]     = useState<'24k' | '22k' | '18k'>('24k');

  useEffect(() => {
    fetch('/api/india-rates')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const srinagar = data?.cityRates.find((c) => c.city === 'Srinagar');
  const others   = data?.cityRates.filter((c) => c.city !== 'Srinagar') ?? [];

  const getRate = (city: CityRate) =>
    karat === '24k' ? city.rate24k : karat === '22k' ? city.rate22k : city.rate18k;

  return (
    <div className="gold-card p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇮🇳</span>
          <div>
            <h2 className="text-lg font-bold text-white">India Live Gold Rates</h2>
            <p className="text-xs text-gray-500">
              MCX-equivalent rates with city premiums · Includes 6% import duty + 3% GST
              {data && <span className="ml-2 text-gray-600">via {data.source}</span>}
            </p>
          </div>
        </div>
        {/* Karat selector */}
        <div className="flex bg-black/40 rounded-lg p-0.5 border border-gray-800">
          {(['24k', '22k', '18k'] as const).map((k) => (
            <button key={k} onClick={() => setKarat(k)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                karat === k ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'
              }`}>
              {k.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
          <svg className="animate-spin w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Fetching live India gold rates…
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-400 text-sm">Failed to load India rates. Please refresh.</div>
      )}

      {data && srinagar && (
        <>
          {/* ── Srinagar Featured Card ── */}
          <div className="rounded-2xl p-5 mb-6 border-2 glow-gold"
               style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.12) 0%, rgba(255,140,0,0.06) 100%)', borderColor: 'rgba(255,215,0,0.4)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📍</span>
                  <span className="text-lg font-black text-white">Srinagar, J&K</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 font-semibold">FEATURED</span>
                </div>
                <p className="text-xs text-gray-400 max-w-xs leading-relaxed">{srinagar.note}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-gray-500 mb-0.5">Today's Rate ({karat.toUpperCase()})</div>
                <div className="text-3xl font-black text-yellow-300">₹{fmt(getRate(srinagar))}</div>
                <div className="text-xs text-gray-500">per gram</div>
                <div className="text-xs text-yellow-600 mt-1">+₹{srinagar.premium}/g premium</div>
              </div>
            </div>

            {/* Quick karat breakdown for Srinagar */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-yellow-400/10">
              {[
                { label: '24K (99.9%)', value: srinagar.rate24k },
                { label: '22K (91.7%)', value: srinagar.rate22k },
                { label: '18K (75.0%)', value: srinagar.rate18k },
              ].map((item) => (
                <div key={item.label} className="text-center rounded-xl p-2 bg-black/20">
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  <div className="font-bold text-white text-sm">₹{fmt(item.value)}</div>
                  <div className="text-xs text-gray-600">/gram</div>
                </div>
              ))}
            </div>

            {/* 10g / tola breakdown */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { label: 'Per 10 grams', value: getRate(srinagar) * 10 },
                { label: 'Per Tola (11.66g)', value: getRate(srinagar) * 11.6638 },
                { label: 'Per Troy Oz', value: getRate(srinagar) * 31.1035 },
              ].map((item) => (
                <div key={item.label} className="text-center rounded-xl p-2 bg-black/20">
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  <div className="font-bold text-yellow-300 text-sm">₹{fmt(item.value)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── National MCX Base ── */}
          <div className="rounded-xl p-3 bg-blue-500/5 border border-blue-500/15 mb-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-blue-400">National MCX Base Rate (24K)</div>
              <div className="text-xs text-gray-500 mt-0.5">
                ${ data.spotUSD.toFixed(0) } spot × ₹{ data.inrRate.toFixed(1) } + 6% duty + 3% GST
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-white">₹{fmt(data.mcxBase24k)}</div>
              <div className="text-xs text-gray-500">/gram</div>
            </div>
          </div>

          {/* ── Other Cities Grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {others.map((city) => (
              <div key={city.city} className="rounded-xl p-3 bg-black/30 border border-gray-800 hover:border-gray-600 transition-colors">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <div className="font-semibold text-white text-sm">{city.city}</div>
                    <div className="text-xs text-gray-600">{city.state}</div>
                  </div>
                  {city.premium > 0 && (
                    <span className="text-xs text-yellow-600 shrink-0">+{city.premium}</span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-base font-bold text-yellow-300">₹{fmt(getRate(city))}</div>
                  <div className="text-xs text-gray-600">/gram</div>
                </div>
                <div className="text-xs text-gray-700 mt-1">
                  10g = ₹{fmt(getRate(city) * 10)}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-700 mt-4 text-center leading-relaxed">
            Rates are MCX-equivalent estimates based on international spot price + import duty + GST + city premium.
            Actual jeweller rates may vary ±₹100–200/gram. Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}.
          </p>
        </>
      )}
    </div>
  );
}
