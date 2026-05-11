'use client';

import { useState } from 'react';
import type { PortfolioEntry, PortfolioAnalysis } from '@/types';
import { CURRENCY_INFO, KARAT_PURITY, TROY_OZ_TO_GRAMS, LOCAL_MARKET_FACTOR } from '@/lib/constants';

interface InvestmentSummaryProps {
  entry: PortfolioEntry;
  goldSpotUSD: number;
  exchangeRate: number;
}

export function computePortfolio(entry: PortfolioEntry, spotUSD: number, exchangeRate: number): PortfolioAnalysis {
  const purity      = KARAT_PURITY[entry.karat];
  const localFactor = LOCAL_MARKET_FACTOR[entry.currency]?.factor ?? 1;

  const intlPricePerGram     = (spotUSD / TROY_OZ_TO_GRAMS) * purity * exchangeRate;
  const currentPricePerGram  = intlPricePerGram * localFactor;

  const purchaseValue     = entry.purchasePrice * entry.weightGrams;
  const currentValue      = currentPricePerGram * entry.weightGrams;
  const profitLoss        = currentValue - purchaseValue;
  const profitLossPercent = (profitLoss / purchaseValue) * 100;

  const breakEvenPerGramUSD = (entry.purchasePrice / exchangeRate / localFactor) / purity;
  const breakEvenSpotUSD    = breakEvenPerGramUSD * TROY_OZ_TO_GRAMS;

  return { purchaseValue, currentValue, profitLoss, profitLossPercent, currentPricePerGram, breakEvenSpotUSD };
}

interface BreakdownRow {
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
  indent?: boolean;
  separator?: boolean;
  positive?: boolean;
  negative?: boolean;
}

function PriceBreakdownTable({ entry, goldSpotUSD, exchangeRate }: InvestmentSummaryProps) {
  const purity       = KARAT_PURITY[entry.karat];
  const localInfo    = LOCAL_MARKET_FACTOR[entry.currency];
  const localFactor  = localInfo?.factor ?? 1;
  const { symbol }   = CURRENCY_INFO[entry.currency];
  const isINR        = entry.currency === 'INR' || entry.currency === 'PKR';
  const fmt          = (n: number, dec = 2) => n.toLocaleString(isINR ? 'en-IN' : 'en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const spotPerGramUSD       = goldSpotUSD / TROY_OZ_TO_GRAMS;                       // $/g pure 24K
  const spotPerGramLocal     = spotPerGramUSD * exchangeRate;                         // local currency /g 24K (no duties)
  const karatAdjusted        = spotPerGramLocal * purity;                             // adjusted for karat purity
  const dutyFactor           = localInfo ? (localInfo.factor - 1) : 0;               // e.g. 0.0918 for India
  const importDutyAmount     = localInfo ? (() => {
    // India: import duty is 6% on base, GST is 3% on (base + duty)
    if (entry.currency === 'INR') {
      const afterDuty = karatAdjusted * 1.06;
      return { duty: karatAdjusted * 0.06, gst: afterDuty * 0.03, afterDuty };
    }
    if (entry.currency === 'PKR') {
      return { duty: karatAdjusted * 0.08, gst: 0, afterDuty: karatAdjusted * 1.08 };
    }
    return { duty: 0, gst: 0, afterDuty: karatAdjusted };
  })() : null;

  const finalPricePerGram    = karatAdjusted * localFactor;
  const finalTotalValue      = finalPricePerGram * entry.weightGrams;
  const purchasePricePerGram = entry.purchasePrice;
  const purchaseTotalValue   = entry.purchasePrice * entry.weightGrams;
  const profitPerGram        = finalPricePerGram - purchasePricePerGram;
  const totalProfitLoss      = finalTotalValue - purchaseTotalValue;
  const isProfit             = totalProfitLoss >= 0;

  const rows: BreakdownRow[] = [
    // ── INTERNATIONAL SPOT ──
    {
      label: '① International Gold Spot Price',
      value: `$${fmt(goldSpotUSD)} / troy oz`,
      sublabel: 'London Bullion Market (LBMA) benchmark price in USD',
      highlight: false,
    },
    {
      label: 'Convert to price per gram',
      value: `$${fmt(goldSpotUSD)} ÷ ${TROY_OZ_TO_GRAMS}g`,
      sublabel: `= $${fmt(spotPerGramUSD)} per gram (24K, USD)`,
      indent: true,
    },

    // ── EXCHANGE RATE ──
    { separator: true, label: '', value: '' },
    {
      label: `② Currency Conversion (USD → ${entry.currency})`,
      value: `1 USD = ${symbol}${fmt(exchangeRate)}`,
      sublabel: 'Live mid-market exchange rate',
    },
    {
      label: 'Apply exchange rate',
      value: `$${fmt(spotPerGramUSD)} × ${fmt(exchangeRate)}`,
      sublabel: `= ${symbol}${fmt(spotPerGramLocal)} per gram (24K, ${entry.currency})`,
      indent: true,
    },

    // ── KARAT PURITY ──
    { separator: true, label: '', value: '' },
    {
      label: `③ Karat Purity Adjustment (${entry.karat}K = ${(purity * 100).toFixed(1)}% pure)`,
      value: `× ${purity.toFixed(4)}`,
      sublabel: `Only ${(purity * 100).toFixed(1)}% of the weight is actual gold`,
    },
    {
      label: 'After purity adjustment',
      value: `${symbol}${fmt(spotPerGramLocal)} × ${purity.toFixed(4)}`,
      sublabel: `= ${symbol}${fmt(karatAdjusted)} per gram (${entry.karat}K, ${entry.currency})`,
      indent: true,
    },

    // ── LOCAL DUTIES (only if applicable) ──
    ...(importDutyAmount ? [
      { separator: true, label: '', value: '' } as BreakdownRow,
      ...(entry.currency === 'INR' ? [
        {
          label: '④ India Import Duty (6%)',
          value: `+ ${symbol}${fmt(importDutyAmount.duty)}`,
          sublabel: 'Customs duty on gold imports (reduced from 15% in Jul 2024 budget)',
        },
        {
          label: 'After import duty',
          value: `${symbol}${fmt(importDutyAmount.afterDuty)} per gram`,
          indent: true,
          sublabel: `${symbol}${fmt(karatAdjusted)} + ${symbol}${fmt(importDutyAmount.duty)} duty`,
        },
        {
          label: '⑤ GST (3%)',
          value: `+ ${symbol}${fmt(importDutyAmount.gst)}`,
          sublabel: 'Goods & Services Tax applied on (base price + import duty)',
        },
      ] as BreakdownRow[] : [
        {
          label: '④ Pakistan Import & Regulatory Duty (~8%)',
          value: `+ ${symbol}${fmt(importDutyAmount.duty)}`,
          sublabel: 'Import duty + regulatory duty on gold',
        },
      ] as BreakdownRow[]),
    ] : []),

    // ── FINAL LOCAL MARKET PRICE ──
    { separator: true, label: '', value: '' },
    {
      label: `⑥ Local Market Price per Gram (${entry.karat}K)`,
      value: `${symbol}${fmt(finalPricePerGram)}`,
      sublabel: `This is the price at which ${entry.karat}K gold trades in the local market today`,
      highlight: true,
    },
    {
      label: `× ${entry.weightGrams}g`,
      value: `${symbol}${fmt(finalTotalValue)}`,
      sublabel: 'Total current market value of your gold',
      indent: true,
      highlight: true,
    },

    // ── YOUR PURCHASE ──
    { separator: true, label: '', value: '' },
    {
      label: '⑦ Your Purchase Price per Gram',
      value: `${symbol}${fmt(purchasePricePerGram)}`,
      sublabel: `What you paid on average per gram of ${entry.karat}K gold`,
    },
    {
      label: `× ${entry.weightGrams}g`,
      value: `${symbol}${fmt(purchaseTotalValue)}`,
      sublabel: 'Total amount you invested',
      indent: true,
    },

    // ── P&L ──
    { separator: true, label: '', value: '' },
    {
      label: 'Profit / Loss per Gram',
      value: `${isProfit ? '+' : '-'}${symbol}${fmt(Math.abs(profitPerGram))}`,
      sublabel: `Current ${symbol}${fmt(finalPricePerGram)} − Paid ${symbol}${fmt(purchasePricePerGram)}`,
      positive: isProfit,
      negative: !isProfit,
    },
    {
      label: `⑧ Total Profit / Loss (${entry.weightGrams}g)`,
      value: `${isProfit ? '+' : '-'}${symbol}${fmt(Math.abs(totalProfitLoss))}`,
      sublabel: `${isProfit ? '+' : ''}${((totalProfitLoss / purchaseTotalValue) * 100).toFixed(2)}% return on investment`,
      highlight: true,
      positive: isProfit,
      negative: !isProfit,
    },
  ];

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800">
      <div className="bg-gray-900/60 px-4 py-3 flex items-center gap-2 border-b border-gray-800">
        <span className="text-base">🔢</span>
        <span className="text-sm font-bold text-white">Full Price Breakdown</span>
        <span className="text-xs text-gray-500 ml-1">— how your current value is calculated</span>
      </div>

      <div className="divide-y divide-gray-800/50">
        {rows.map((row, i) => {
          if (row.separator) return <div key={i} className="h-px bg-yellow-400/10" />;

          return (
            <div
              key={i}
              className={`px-4 py-2.5 flex items-start justify-between gap-4 ${
                row.highlight
                  ? 'bg-yellow-400/5'
                  : row.indent
                  ? 'bg-black/20 pl-8'
                  : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium ${row.highlight ? 'text-yellow-300' : row.indent ? 'text-gray-500' : 'text-gray-300'}`}>
                  {row.label}
                </div>
                {row.sublabel && (
                  <div className="text-xs text-gray-600 mt-0.5 leading-snug">{row.sublabel}</div>
                )}
              </div>
              <div className={`text-xs font-bold shrink-0 text-right ${
                row.positive ? 'text-green-400' :
                row.negative ? 'text-red-400' :
                row.highlight ? 'text-yellow-300' :
                row.indent ? 'text-gray-500' :
                'text-white'
              }`}>
                {row.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function InvestmentSummary({ entry, goldSpotUSD, exchangeRate }: InvestmentSummaryProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const analysis   = computePortfolio(entry, goldSpotUSD, exchangeRate);
  const { symbol } = CURRENCY_INFO[entry.currency];
  const isProfit   = analysis.profitLoss >= 0;
  const purity     = KARAT_PURITY[entry.karat];
  const localInfo  = LOCAL_MARKET_FACTOR[entry.currency];
  const isINR      = entry.currency === 'INR' || entry.currency === 'PKR';

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
          { label: 'You Paid',        value: `${symbol}${fmt(analysis.purchaseValue)}`,    sub: `${symbol}${fmt(entry.purchasePrice)}/g` },
          { label: 'Current Value',   value: `${symbol}${fmt(analysis.currentValue)}`,     sub: `${symbol}${fmt(analysis.currentPricePerGram)}/g` },
          { label: 'Gold Spot (USD)', value: `$${goldSpotUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, sub: 'per troy oz' },
          { label: 'Break-even Spot', value: `$${fmt(analysis.breakEvenSpotUSD)}`,         sub: 'min spot to profit' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl p-3 bg-black/30 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">{item.label}</div>
            <div className="text-sm font-bold text-white leading-tight">{item.value}</div>
            <div className="text-xs text-gray-600">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Breakdown toggle */}
      <button
        onClick={() => setShowBreakdown((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5 hover:bg-yellow-400/10 transition-colors mb-4"
      >
        <span className="text-sm font-semibold text-yellow-300">
          🔢 {showBreakdown ? 'Hide' : 'Show'} Full Price Breakdown
        </span>
        <span className={`text-yellow-400 transition-transform ${showBreakdown ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {showBreakdown && (
        <div className="mb-4 fade-in">
          <PriceBreakdownTable entry={entry} goldSpotUSD={goldSpotUSD} exchangeRate={exchangeRate} />
        </div>
      )}

      {/* Local duty note */}
      {localInfo && (
        <div className="rounded-xl p-3 bg-blue-500/5 border border-blue-500/20 mb-4">
          <div className="flex items-start gap-2">
            <span className="text-sm">ℹ️</span>
            <p className="text-xs text-gray-400 leading-relaxed">
              <span className="text-blue-400 font-semibold">Local duties applied: </span>
              {localInfo.note}. Current value reflects the local market sell price.
            </p>
          </div>
        </div>
      )}

      {/* Purity breakdown */}
      <div className="rounded-xl p-3 bg-yellow-400/5 border border-yellow-400/10">
        <div className="text-xs text-gray-500 mb-2">Purity breakdown — {entry.karat}K gold</div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Pure gold content</span>
          <span className="text-yellow-300 font-semibold">{(entry.weightGrams * purity).toFixed(3)}g</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-400">Alloy (copper/silver)</span>
          <span className="text-gray-500">{(entry.weightGrams * (1 - purity)).toFixed(3)}g</span>
        </div>
      </div>
    </div>
  );
}
