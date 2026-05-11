'use client';

import { useMemo } from 'react';
import type { PortfolioEntry } from '@/types';
import { CURRENCY_INFO, KARAT_PURITY, TROY_OZ_TO_GRAMS, LOCAL_MARKET_FACTOR, COMPARISON_RATES } from '@/lib/constants';

interface ComparisonWidgetProps {
  entry: PortfolioEntry;
  currentSpotUSD: number;
  exchangeRate: number;
}

interface Alternative {
  name: string;
  emoji: string;
  currentValue: number;
  gain: number;
  gainPct: number;
  annualizedReturn: number;
  pros: string;
  cons: string;
  color: string;
}

export default function ComparisonWidget({ entry, currentSpotUSD, exchangeRate }: ComparisonWidgetProps) {
  const { symbol } = CURRENCY_INFO[entry.currency];
  const isINR = entry.currency === 'INR' || entry.currency === 'PKR';
  const fmt = (n: number) => n.toLocaleString(isINR ? 'en-IN' : 'en-US', { maximumFractionDigits: 0 });

  const analysis = useMemo(() => {
    const purity      = KARAT_PURITY[entry.karat];
    const localFactor = LOCAL_MARKET_FACTOR[entry.currency]?.factor ?? 1;
    const invested    = entry.purchasePrice * entry.weightGrams;
    const goldCurrent = (currentSpotUSD / TROY_OZ_TO_GRAMS) * purity * exchangeRate * localFactor * entry.weightGrams;
    const goldGain    = goldCurrent - invested;
    const goldGainPct = (goldGain / invested) * 100;

    // Assume 1 year holding for comparison (simplified)
    const years = 1;

    const alts: Alternative[] = [
      {
        name: 'Your Gold',
        emoji: '🥇',
        currentValue: goldCurrent,
        gain: goldGain,
        gainPct: goldGainPct,
        annualizedReturn: goldGainPct,
        pros: 'Tangible asset, inflation hedge, no counterparty risk',
        cons: 'Storage cost, making charges, illiquid, GST on purchase',
        color: '#FFD700',
      },
      {
        name: 'Sovereign Gold Bond',
        emoji: '📜',
        currentValue: goldCurrent + invested * (COMPARISON_RATES.sgbInterest / 100) * years,
        gain: goldGain + invested * (COMPARISON_RATES.sgbInterest / 100) * years,
        gainPct: goldGainPct + COMPARISON_RATES.sgbInterest * years,
        annualizedReturn: goldGainPct + COMPARISON_RATES.sgbInterest,
        pros: '+2.5% annual interest, no GST, no storage, tax-free on maturity (8yr)',
        cons: '8-year lock-in, early exit only after 5th year via exchange',
        color: '#22c55e',
      },
      {
        name: 'SBI Fixed Deposit (1Y)',
        emoji: '🏦',
        currentValue: invested * (1 + COMPARISON_RATES.sbiFD1Y / 100),
        gain: invested * (COMPARISON_RATES.sbiFD1Y / 100),
        gainPct: COMPARISON_RATES.sbiFD1Y,
        annualizedReturn: COMPARISON_RATES.sbiFD1Y,
        pros: 'Capital guaranteed, DICGC insured up to ₹5L, predictable',
        cons: 'Returns taxed as income, no inflation protection, low real return',
        color: '#60a5fa',
      },
      {
        name: 'PPF (Public Provident Fund)',
        emoji: '🏛️',
        currentValue: invested * (1 + COMPARISON_RATES.ppfRate / 100),
        gain: invested * (COMPARISON_RATES.ppfRate / 100),
        gainPct: COMPARISON_RATES.ppfRate,
        annualizedReturn: COMPARISON_RATES.ppfRate,
        pros: 'Tax-free returns (EEE), government-backed, 80C deduction',
        cons: '15-year lock-in, partial withdrawal only after 7 years',
        color: '#a78bfa',
      },
      {
        name: 'Nifty 50 Index Fund',
        emoji: '📈',
        currentValue: invested * (1 + COMPARISON_RATES.nifty1YReturn / 100),
        gain: invested * (COMPARISON_RATES.nifty1YReturn / 100),
        gainPct: COMPARISON_RATES.nifty1YReturn,
        annualizedReturn: COMPARISON_RATES.nifty1YReturn,
        pros: 'Higher long-term returns historically, high liquidity, diversified',
        cons: 'Market risk, volatility, 10% LTCG after ₹1L gain, emotional swings',
        color: '#f97316',
      },
    ];

    return { invested, alts };
  }, [entry, currentSpotUSD, exchangeRate]);

  const best = [...analysis.alts].sort((a, b) => b.gainPct - a.gainPct)[0];

  return (
    <div className="gold-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">⚖️</span>
        <div>
          <h2 className="text-lg font-bold text-white">Gold vs Alternatives</h2>
          <p className="text-xs text-gray-500">
            How your {symbol}{fmt(analysis.invested)} would perform across investment options (1-year estimate)
          </p>
        </div>
      </div>

      {/* Winner banner */}
      <div className="rounded-xl p-3 mb-5 flex items-center gap-3 border"
           style={{ borderColor: `${best.color}40`, background: `${best.color}10` }}>
        <span className="text-2xl">{best.emoji}</span>
        <div>
          <div className="text-xs text-gray-400">Best performer in this scenario</div>
          <div className="font-bold text-white">{best.name} — <span style={{ color: best.color }}>+{best.gainPct.toFixed(2)}%</span></div>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {analysis.alts.map((alt, i) => {
          const isGold    = i === 0;
          const isWinner  = alt.name === best.name;
          const isPositive = alt.gainPct >= 0;

          return (
            <div key={alt.name}
                 className={`rounded-xl p-4 border transition-all ${isWinner ? 'border-2' : 'border'}`}
                 style={{ borderColor: isWinner ? `${alt.color}60` : 'rgba(75,75,75,0.5)', background: isGold ? `${alt.color}08` : 'rgba(0,0,0,0.2)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{alt.emoji}</span>
                    <span className="font-bold text-white">{alt.name}</span>
                    {isWinner && <span className="text-xs px-1.5 py-0.5 rounded-full text-black font-bold" style={{ background: alt.color }}>BEST</span>}
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    <span className="text-green-500">✓ </span>{alt.pros}
                  </div>
                  <div className="text-xs text-gray-600 leading-relaxed mt-0.5">
                    <span className="text-red-500">✗ </span>{alt.cons}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-white">{symbol}{fmt(alt.currentValue)}</div>
                  <div className={`text-xs font-bold ${isPositive ? 'bullish' : 'bearish'}`}>
                    {isPositive ? '+' : ''}{symbol}{fmt(Math.abs(alt.gain))}
                  </div>
                  <div className="text-lg font-black mt-0.5" style={{ color: alt.color }}>
                    {isPositive ? '+' : ''}{alt.gainPct.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-700 mt-4 text-center">
        FD, PPF, Nifty returns are indicative based on current published rates.
        Gold return is based on live spot price. Past performance ≠ future results.
      </p>
    </div>
  );
}
