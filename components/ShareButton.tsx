'use client';

import { useState } from 'react';
import type { PortfolioEntry, FullAnalysis } from '@/types';
import { CURRENCY_INFO, KARAT_PURITY, TROY_OZ_TO_GRAMS, LOCAL_MARKET_FACTOR } from '@/lib/constants';

interface ShareButtonProps {
  entry: PortfolioEntry;
  analysis: FullAnalysis;
}

export default function ShareButton({ entry, analysis }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen]     = useState(false);

  const { symbol } = CURRENCY_INFO[entry.currency];
  const isINR = entry.currency === 'INR' || entry.currency === 'PKR';
  const fmt = (n: number) => n.toLocaleString(isINR ? 'en-IN' : 'en-US', { maximumFractionDigits: 0 });

  const purity      = KARAT_PURITY[entry.karat];
  const localFactor = LOCAL_MARKET_FACTOR[entry.currency]?.factor ?? 1;
  const currentPPG  = (analysis.goldPrice.spotPrice / TROY_OZ_TO_GRAMS) * purity * analysis.exchangeRate * localFactor;
  const currentVal  = currentPPG * entry.weightGrams;
  const invested    = entry.purchasePrice * entry.weightGrams;
  const pl          = currentVal - invested;
  const plPct       = (pl / invested) * 100;

  const REC_EMOJI: Record<string, string> = {
    SELL_NOW: '🔴', SELL_IN_30: '🟠', HOLD: '🟡', SELL_IN_60: '🟢', SELL_IN_90: '💚',
  };

  const message = `🥇 *Gold Investment Report*

📊 *My Holdings:* ${entry.weightGrams}g of ${entry.karat}K Gold
💰 *Invested:* ${symbol}${fmt(invested)}
📈 *Current Value:* ${symbol}${fmt(currentVal)}
${pl >= 0 ? '✅' : '❌'} *P&L:* ${pl >= 0 ? '+' : '-'}${symbol}${fmt(Math.abs(pl))} (${pl >= 0 ? '+' : ''}${plPct.toFixed(2)}%)

${REC_EMOJI[analysis.prediction.recommendation]} *Recommendation:* ${analysis.prediction.recommendation.replace(/_/g, ' ')}
🎯 *Best Sell:* ${analysis.prediction.bestSellDate}
🔮 *90-Day Target:* $${analysis.prediction.priceTargets.day90.toLocaleString()}/oz

📱 Analyzed with Gold Price Predictor`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const printReport = () => window.print();

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-yellow-400/30 bg-yellow-400/5 hover:bg-yellow-400/10 text-yellow-300 text-sm font-semibold transition-all">
        <span>📤</span> Share Report
        <span className={`text-yellow-400 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl z-50 overflow-hidden fade-in">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-3 px-4 py-3 hover:bg-green-500/10 text-white text-sm transition-colors border-b border-gray-800">
            <span className="text-xl">💬</span>
            <span>Share on WhatsApp</span>
          </a>
          <button onClick={copyToClipboard}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-yellow-400/10 text-white text-sm transition-colors border-b border-gray-800">
            <span className="text-xl">{copied ? '✅' : '📋'}</span>
            <span>{copied ? 'Copied!' : 'Copy Report Text'}</span>
          </button>
          <button onClick={printReport}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-500/10 text-white text-sm transition-colors">
            <span className="text-xl">🖨️</span>
            <span>Print / Save PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}
