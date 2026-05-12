'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine, Brush,
} from 'recharts';
import type { HistoricalDataPoint, PriceTargets } from '@/types';
import { TROY_OZ_TO_GRAMS, LOCAL_MARKET_FACTOR, FALLBACK_EXCHANGE_RATES } from '@/lib/constants';
import { format, parseISO, addDays } from 'date-fns';

interface PriceChartProps {
  history: HistoricalDataPoint[];
  priceTargets: PriceTargets;
  currentPrice: number;
  sma20: number;
  sma50: number;
  sma200: number;
}

type Range = '1M' | '3M' | '6M' | '1Y';
const RANGE_DAYS: Record<Range, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
const INR_RATE   = FALLBACK_EXCHANGE_RATES.INR;
const INR_FACTOR = LOCAL_MARKET_FACTOR['INR']?.factor ?? 1;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const priceEntry     = payload.find((p: any) => p.dataKey === 'price');
  const predictedEntry = payload.find((p: any) => p.dataKey === 'predicted');
  const priceUSD       = priceEntry?.value ?? predictedEntry?.value;
  const inrPerGram     = priceUSD ? Math.round((priceUSD / TROY_OZ_TO_GRAMS) * INR_RATE * INR_FACTOR) : null;
  const isForecasted   = !priceEntry?.value && !!predictedEntry?.value;

  return (
    <div className="bg-gray-900 border border-yellow-400/20 rounded-xl p-3 text-xs shadow-2xl min-w-[170px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 font-medium">{label}</span>
        {isForecasted && <span className="text-green-400 text-[10px] px-1.5 py-0.5 rounded-full bg-green-400/10 border border-green-400/20">Forecast</span>}
      </div>
      {payload.map((p: any) =>
        p.value != null ? (
          <div key={p.dataKey} className="flex justify-between gap-4 mb-1">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-bold text-white">${p.value.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
          </div>
        ) : null
      )}
      {inrPerGram && (
        <div className="mt-2 pt-2 border-t border-gray-700/50 flex justify-between gap-4">
          <span className="text-gray-500">≈ ₹/g India (24K)</span>
          <span className="font-semibold" style={{ color: '#FFD700' }}>₹{inrPerGram.toLocaleString('en-IN')}</span>
        </div>
      )}
    </div>
  );
}

export default function PriceChart({ history, priceTargets, currentPrice, sma20, sma50, sma200 }: PriceChartProps) {
  const [range, setRange]               = useState<Range>('1Y');
  const [showSMAs, setShowSMAs]         = useState(true);
  const [showPrediction, setShowPrediction] = useState(true);
  const [showBrush, setShowBrush]       = useState(false);

  const chartData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range]);

    const filtered = history
      .filter((d) => d.price > 0 && new Date(d.date) >= cutoff)
      .map((d) => ({
        date: format(parseISO(d.date), 'MMM d'),
        price: Math.round(d.price),
        predicted: null as number | null,
        bull: null as number | null,
        bear: null as number | null,
      }));

    if (!showPrediction || filtered.length === 0) return filtered;

    const today = new Date();
    const predPoints = [
      { days: 0,  price: currentPrice,        bull: currentPrice,             bear: currentPrice },
      { days: 30, price: priceTargets.day30,  bull: priceTargets.day30Bull,  bear: priceTargets.day30Bear },
      { days: 60, price: priceTargets.day60,  bull: priceTargets.day60Bull,  bear: priceTargets.day60Bear },
      { days: 90, price: priceTargets.day90,  bull: priceTargets.day90Bull,  bear: priceTargets.day90Bear },
    ];

    const predData = predPoints.map(({ days, price, bull, bear }) => ({
      date: format(addDays(today, days), 'MMM d'),
      price: null as number | null,
      predicted: Math.round(price),
      bull: Math.round(bull),
      bear: Math.round(bear),
    }));

    if (filtered.length > 0) {
      const last = filtered[filtered.length - 1];
      filtered[filtered.length - 1] = { ...last, predicted: last.price };
    }

    return [...filtered, ...predData.slice(1)];
  }, [history, range, priceTargets, currentPrice, showPrediction]);

  const rangeChange = useMemo(() => {
    const prices = chartData.filter((d) => (d.price ?? 0) > 0);
    if (prices.length < 2) return null;
    const first = prices[0].price!;
    const last  = prices[prices.length - 1].price!;
    return ((last - first) / first) * 100;
  }, [chartData]);

  const allPrices = chartData.map((d) => d.price ?? d.predicted ?? 0).filter((v) => v > 0);
  const yMin = Math.floor(Math.min(...allPrices) * 0.98 / 50) * 50;
  const yMax = Math.ceil(Math.max(...allPrices) * 1.02 / 50) * 50;

  return (
    <div className="gold-card p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">Price Chart</h2>
              {rangeChange != null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  rangeChange >= 0 ? 'signal-bullish' : 'signal-bearish'
                }`}>
                  {rangeChange >= 0 ? '▲ +' : '▼ '}{rangeChange.toFixed(1)}% ({range})
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">Historical · 90-day forecast · tap to inspect</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle buttons */}
          <button onClick={() => setShowSMAs((v) => !v)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all"
            style={showSMAs ? { borderColor: 'rgba(96,165,250,0.4)', background: 'rgba(96,165,250,0.1)', color: '#93c5fd' } : { borderColor: '#374151', color: '#6b7280' }}>
            MAs
          </button>
          <button onClick={() => setShowPrediction((v) => !v)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all"
            style={showPrediction ? { borderColor: 'rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.1)', color: '#86efac' } : { borderColor: '#374151', color: '#6b7280' }}>
            Forecast
          </button>
          <button onClick={() => setShowBrush((v) => !v)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all"
            style={showBrush ? { borderColor: 'rgba(255,215,0,0.4)', background: 'rgba(255,215,0,0.1)', color: '#FFD700' } : { borderColor: '#374151', color: '#6b7280' }}>
            🔍 Zoom
          </button>

          {/* Range selector */}
          <div className="flex bg-black/40 rounded-lg p-0.5 border border-gray-800">
            {(['1M', '3M', '6M', '1Y'] as Range[]).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  range === r ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[240px] sm:h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: showBrush ? 8 : 5 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#FFD700" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />

            <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={[yMin, yMax]} tick={{ fill: '#555', fontSize: 10 }} tickLine={false} axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} width={46} />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(255,215,0,0.25)', strokeWidth: 1, strokeDasharray: '5 3' }}
            />

            {/* Current price reference line */}
            <ReferenceLine y={currentPrice} stroke="rgba(255,215,0,0.45)" strokeDasharray="3 3"
              label={{ value: `Now $${Math.round(currentPrice).toLocaleString()}`, fill: '#FFD700', fontSize: 9, position: 'insideTopRight' }} />

            {/* Forecast bands */}
            {showPrediction && (
              <Area dataKey="bull" fill="rgba(34,197,94,0.07)" stroke="rgba(34,197,94,0.35)"
                strokeWidth={1} strokeDasharray="4 3" name="Bull case" dot={false} connectNulls />
            )}
            {showPrediction && (
              <Area dataKey="bear" fill="rgba(239,68,68,0.05)" stroke="rgba(239,68,68,0.25)"
                strokeWidth={1} strokeDasharray="4 3" name="Bear case" dot={false} connectNulls />
            )}

            {/* Historical price */}
            <Area dataKey="price" fill="url(#priceGrad)" stroke="#FFD700" strokeWidth={2}
              name="Gold Price" dot={false} connectNulls
              activeDot={{ r: 5, fill: '#FFD700', stroke: '#000', strokeWidth: 2 }} />

            {/* Forecast line */}
            {showPrediction && (
              <Line dataKey="predicted" stroke="#22c55e" strokeWidth={2} strokeDasharray="6 3"
                name="Forecast" dot={false} connectNulls
                activeDot={{ r: 5, fill: '#22c55e', stroke: '#000', strokeWidth: 2 }} />
            )}

            {/* Moving averages */}
            {showSMAs && !isNaN(sma20) && (
              <ReferenceLine y={sma20} stroke="#60a5fa" strokeDasharray="3 3"
                label={{ value: `MA20`, fill: '#60a5fa', fontSize: 9, position: 'insideRight' }} />
            )}
            {showSMAs && !isNaN(sma50) && (
              <ReferenceLine y={sma50} stroke="#a78bfa" strokeDasharray="3 3"
                label={{ value: `MA50`, fill: '#a78bfa', fontSize: 9, position: 'insideRight' }} />
            )}
            {showSMAs && !isNaN(sma200) && (
              <ReferenceLine y={sma200} stroke="#f97316" strokeDasharray="3 3"
                label={{ value: `MA200`, fill: '#f97316', fontSize: 9, position: 'insideRight' }} />
            )}

            {/* Zoom brush */}
            {showBrush && (
              <Brush dataKey="date" height={24} stroke="#444" fill="rgba(17,17,17,0.9)"
                travellerWidth={7}
                style={{ fontSize: 10 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 mb-1 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t-2 border-yellow-400" />Gold Price</span>
        {showPrediction && <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t-2 border-dashed border-green-400" />Forecast</span>}
        {showSMAs && <>
          <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t border-dashed border-blue-400" />MA20</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t border-dashed border-purple-400" />MA50</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t border-dashed border-orange-400" />MA200</span>
        </>}
        {showBrush && <span className="text-yellow-500 ml-auto">← Drag handles below chart to zoom</span>}
      </div>

      {/* Price targets */}
      {showPrediction && (
        <div className="grid grid-cols-3 gap-2 mt-3 pt-4 border-t border-gray-800">
          {[
            { label: '30-Day', value: priceTargets.day30, bull: priceTargets.day30Bull, bear: priceTargets.day30Bear },
            { label: '60-Day', value: priceTargets.day60, bull: priceTargets.day60Bull, bear: priceTargets.day60Bear },
            { label: '90-Day', value: priceTargets.day90, bull: priceTargets.day90Bull, bear: priceTargets.day90Bear },
          ].map((t) => {
            const change = ((t.value - currentPrice) / currentPrice) * 100;
            return (
              <div key={t.label} className="rounded-xl p-2.5 sm:p-3 bg-black/30 border border-gray-800 text-center">
                <div className="text-xs text-gray-500 mb-1">{t.label}</div>
                <div className="font-bold text-white text-sm sm:text-base">${t.value.toLocaleString()}</div>
                <div className={`text-xs font-semibold ${change >= 0 ? 'bullish' : 'bearish'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5 hidden sm:block">
                  ${t.bear.toLocaleString()} – ${t.bull.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
