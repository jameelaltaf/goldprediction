'use client';

import type { PortfolioEntry, PortfolioAnalysis } from '@/types';
import { CURRENCY_INFO, KARAT_PURITY, TROY_OZ_TO_GRAMS, LOCAL_MARKET_FACTOR } from '@/lib/constants';

interface InvestmentSummaryProps {
  entry: PortfolioEntry;
  goldSpotUSD: number;
  exchangeRate: number;
}

export function computePortfolio(entry: PortfolioEntry, spotUSD: number, exchangeRate: number): PortfolioAnalysis {
  const purity = KARAT_PURITY[entry.karat];

  // International spot converted to local currency (no duties)
  const intlPricePerGram = (spotUSD / TROY_OZ_TO_GRAMS) * purity * exchangeRate;

  // Local market price: apply duty/tax factor for markets where it applies (e.g. India, Pakistan)
  const localFactor = LOCAL_MARKET_FACTOR[entry.currency]?.factor ?? 1;
  const currentPricePerGram = intlPricePerGram * localFactor;

  const purchaseValue  = entry.purchasePrice * entry.weightGrams;
  const currentValue   = currentPricePerGram  * entry.weightGrams;
  const profitLoss     = currentValue - purchaseValue;
  const profitLossPercent = (profitLoss / purchaseValue) * 100;

  const breakEvenPerGramUSD = (entry.purchasePrice / exchangeRate / localFactor) / purity;
  const breakEvenSpotUSD    = breakEvenPerGramUSD * TROY_OZ_TO_GRAMS;

  return {
    purchaseValue,
    currentValue,
    profitLoss,
    profitLossPercent,
    currentPricePerGram,
    breakEvenSpotUSD,
  };
}

export default function InvestmentSummary({ entry, goldSpotUSD, exchangeRate }: InvestmentSummaryProps) {
  const analysis    = computePortfolio(entry, goldSpotUSD, exchangeRate);
  const { symbol }  = CURRENCY_INFO[entry.currency];
  const isProfit    = analysis.profitLoss >= 0;
  const purity      = KARAT_PURITY[entry.karat];
  const localInfo   = LOCAL_MARKET_FACTOR[entry.currency];
  const isINR       = entry.currency === 'INR' || entry.currency === 'PKR';

  const fmt = (n: number) =>
    n.toLocaleString(isINR ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      className={`gold-card p-6 h-full fade-in ${isProfit ? 'glow-green' : 'glow-red'}`}
      style={{ borderColor: isProfit ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }}
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">{isProfit ? '📈' : '📉'}</span>
        <div>
          <h2 className="text-lg font-bold text-white">Investment Summary</h2>
          <p className="text-xs text-gray-500">
            {entry.weightGrams}g of {entry.karat}K gold ({(purity * 100).toFixed(1)}% pure)
          </p>
        </div>
      </div>

      {/* P&L Hero */}
      <div className={`rounded-2xl p-5 mb-5 border text-center ${
        isProfit ? 'recommendation-sell-90' : 'recommendation-sell-now'
      }`}>
        <div className="text-sm text-gray-400 mb-1">Total Profit / Loss</div>
        <div className={`text-4xl font-black mb-1 ${isProfit ? 'bullish' : 'bearish'}`}>
          {isProfit ? '+' : '-'}{symbol}{fmt(Math.abs(analysis.profitLoss))}
        </div>
        <div className={`text-lg font-bold ${isProfit ? 'bullish' : 'bearish'}`}>
          {isProfit ? '+' : ''}{analysis.profitLossPercent.toFixed(2)}%
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {isProfit ? 'Your gold has appreciated in value' : 'Current market value is below your purchase price'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          {
            label: 'You Paid',
            value: `${symbol}${fmt(analysis.purchaseValue)}`,
            sub: `${symbol}${fmt(entry.purchasePrice)}/g`,
          },
          {
            label: 'Current Value',
            value: `${symbol}${fmt(analysis.currentValue)}`,
            sub: `${symbol}${fmt(analysis.currentPricePerGram)}/g`,
          },
          {
            label: 'Spot Price (USD)',
            value: `$${goldSpotUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            sub: 'per troy oz (international)',
          },
          {
            label: 'Break-even Spot',
            value: `$${fmt(analysis.breakEvenSpotUSD)}`,
            sub: 'USD spot needed to profit',
          },
        ].map((item) => (
          <div key={item.label} className="rounded-xl p-3 bg-black/30 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">{item.label}</div>
            <div className="text-base font-bold text-white leading-tight">{item.value}</div>
            <div className="text-xs text-gray-600">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Local market duty note */}
      {localInfo && (
        <div className="rounded-xl p-3 bg-blue-500/5 border border-blue-500/20 mb-4">
          <div className="flex items-start gap-2">
            <span className="text-blue-400 text-sm">ℹ️</span>
            <div>
              <div className="text-xs font-semibold text-blue-400 mb-0.5">Local Market Pricing Applied</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {localInfo.note}. Current value reflects what you'd receive
                at today's local market rate — not just the raw international spot conversion.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Purity breakdown */}
      <div className="rounded-xl p-3 bg-yellow-400/5 border border-yellow-400/10">
        <div className="text-xs text-gray-500 mb-2">Purity breakdown for {entry.karat}K gold</div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Pure gold content</span>
          <span className="text-yellow-300 font-semibold">{(entry.weightGrams * purity).toFixed(3)}g</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-400">Alloy content</span>
          <span className="text-gray-500">{(entry.weightGrams * (1 - purity)).toFixed(3)}g</span>
        </div>
      </div>
    </div>
  );
}
