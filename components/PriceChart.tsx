'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine, Legend,
} from 'recharts';
import type { HistoricalDataPoint, PriceTargets } from '@/types';
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

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs shadow-xl">
      <div className="text-gray-400 mb-2">{label}</div>
      {payload.map((p: any) => (
        p.value != null && (
          <div key={p.dataKey} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-bold text-white">
              ${typeof p.value === 'number' ? p.value.toLocaleString('en-US', { minimumFractionDigits: 0 }) : '—'}
            </span>
          </div>
        )
      ))}
    </div>
  );
}

export default function PriceChart({ history, priceTargets, currentPrice, sma20, sma50, sma200 }: PriceChartProps) {
  const [range, setRange] = useState<Range>('1Y');
  const [showSMAs, setShowSMAs] = useState(true);
  const [showPrediction, setShowPrediction] = useState(true);

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

    // Append prediction points
    const today = new Date();
    const predPoints = [
      { days: 0,  price: currentPrice,          bull: currentPrice,              bear: currentPrice },
      { days: 30, price: priceTargets.day30,    bull: priceTargets.day30Bull,   bear: priceTargets.day30Bear },
      { days: 60, price: priceTargets.day60,    bull: priceTargets.day60Bull,   bear: priceTargets.day60Bear },
      { days: 90, price: priceTargets.day90,    bull: priceTargets.day90Bull,   bear: priceTargets.day90Bear },
    ];

    const predData = predPoints.map(({ days, price, bull, bear }) => ({
      date: format(addDays(today, days), 'MMM d'),
      price: null as number | null,
      predicted: Math.round(price),
      bull: Math.round(bull),
      bear: Math.round(bear),
    }));

    // Stitch: last historical point serves as prediction start
    if (filtered.length > 0) {
      const last = filtered[filtered.length - 1];
      filtered[filtered.length - 1] = { ...last, predicted: last.price };
    }

    return [...filtered, ...predData.slice(1)];
  }, [history, range, priceTargets, currentPrice, showPrediction]);

  const prices = chartData.map((d) => d.price ?? d.predicted ?? 0).filter((v) => v > 0);
  const yMin = Math.floor(Math.min(...prices) * 0.98 / 50) * 50;
  const yMax = Math.ceil(Math.max(...prices) * 1.02 / 50) * 50;

  const ranges: Range[] = ['1M', '3M', '6M', '1Y'];

  return (
    <div className="gold-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <div>
            <h2 className="text-lg font-bold text-white">Price Chart</h2>
            <p className="text-xs text-gray-500">Historical + 90-day forecast</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Toggles */}
          <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showSMAs}
              onChange={(e) => setShowSMAs(e.target.checked)}
              className="accent-yellow-400"
            />
            <span className="text-gray-400">Show MAs</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPrediction}
              onChange={(e) => setShowPrediction(e.target.checked)}
              className="accent-yellow-400"
            />
            <span className="text-gray-400">Forecast</span>
          </label>

          {/* Range selector */}
          <div className="flex bg-black/40 rounded-lg p-0.5 border border-gray-800">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  range === r
                    ? 'bg-yellow-400 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFD700" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#666', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: '#666', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Bear/Bull forecast band */}
            {showPrediction && (
              <Area dataKey="bull" fill="rgba(34,197,94,0.06)" stroke="rgba(34,197,94,0.3)"
                strokeWidth={1} strokeDasharray="4 3" name="Bull case" dot={false} connectNulls />
            )}
            {showPrediction && (
              <Area dataKey="bear" fill="rgba(239,68,68,0.06)" stroke="rgba(239,68,68,0.2)"
                strokeWidth={1} strokeDasharray="4 3" name="Bear case" dot={false} connectNulls />
            )}

            {/* Historical price */}
            <Area dataKey="price" fill="url(#priceGrad)" stroke="#FFD700"
              strokeWidth={2} name="Gold Price" dot={false} connectNulls />

            {/* Prediction line */}
            {showPrediction && (
              <Line dataKey="predicted" stroke="#22c55e" strokeWidth={2}
                strokeDasharray="6 3" name="Forecast" dot={false} connectNulls />
            )}

            {/* Moving averages */}
            {showSMAs && !isNaN(sma20) && (
              <ReferenceLine y={sma20} stroke="#60a5fa" strokeDasharray="3 3"
                label={{ value: `MA20 $${Math.round(sma20)}`, fill: '#60a5fa', fontSize: 10, position: 'insideRight' }} />
            )}
            {showSMAs && !isNaN(sma50) && (
              <ReferenceLine y={sma50} stroke="#a78bfa" strokeDasharray="3 3"
                label={{ value: `MA50 $${Math.round(sma50)}`, fill: '#a78bfa', fontSize: 10, position: 'insideRight' }} />
            )}
            {showSMAs && !isNaN(sma200) && (
              <ReferenceLine y={sma200} stroke="#f97316" strokeDasharray="3 3"
                label={{ value: `MA200 $${Math.round(sma200)}`, fill: '#f97316', fontSize: 10, position: 'insideRight' }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {showPrediction && (
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-800">
          {[
            { label: '30-Day Target', value: priceTargets.day30, bull: priceTargets.day30Bull, bear: priceTargets.day30Bear },
            { label: '60-Day Target', value: priceTargets.day60, bull: priceTargets.day60Bull, bear: priceTargets.day60Bear },
            { label: '90-Day Target', value: priceTargets.day90, bull: priceTargets.day90Bull, bear: priceTargets.day90Bear },
          ].map((t) => {
            const change = ((t.value - currentPrice) / currentPrice) * 100;
            return (
              <div key={t.label} className="flex-1 min-w-[120px] rounded-xl p-3 bg-black/30 border border-gray-800 text-center">
                <div className="text-xs text-gray-500 mb-1">{t.label}</div>
                <div className="font-bold text-white">${t.value.toLocaleString()}</div>
                <div className={`text-xs font-semibold ${change >= 0 ? 'bullish' : 'bearish'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
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
