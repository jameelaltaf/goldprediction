'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import PortfolioForm from '@/components/PortfolioForm';
import InvestmentSummary from '@/components/InvestmentSummary';
import PredictionCard from '@/components/PredictionCard';
import MarketSignals from '@/components/MarketSignals';
import type { GoldPrice, PortfolioEntry, FullAnalysis } from '@/types';

// Recharts must be client-side only
const PriceChart = dynamic(() => import('@/components/PriceChart'), { ssr: false });

export default function HomePage() {
  const [goldPrice, setGoldPrice] = useState<GoldPrice | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioEntry | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch live gold price on mount + every 5 minutes
  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch('/api/gold');
      if (res.ok) {
        const data: GoldPrice = await res.json();
        setGoldPrice(data);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } finally {
      setPriceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const handleAnalyze = async (entry: PortfolioEntry) => {
    setPortfolio(entry);
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const res = await fetch(`/api/analysis?currency=${entry.currency}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Analysis failed');
      }
      const data: FullAnalysis = await res.json();
      setAnalysis(data);
      setGoldPrice(data.goldPrice);
    } catch (err: any) {
      setAnalysisError(err.message ?? 'Failed to run analysis. Please try again.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header goldPrice={goldPrice} loading={priceLoading} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Hero */}
        <div className="text-center py-4">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            <span className="text-white">Is It Time to</span>{' '}
            <span style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Sell Your Gold?
            </span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
            Enter your gold purchase details and get a data-driven analysis combining technical indicators,
            economic factors, and seasonal patterns to find your optimal sell window.
          </p>
        </div>

        {/* Input + Summary Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PortfolioForm onAnalyze={handleAnalyze} loading={analysisLoading} />

          {analysis && portfolio ? (
            <InvestmentSummary
              entry={portfolio}
              goldSpotUSD={analysis.goldPrice.spotPrice}
              exchangeRate={analysis.exchangeRate}
            />
          ) : (
            <div className="gold-card p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="text-6xl mb-4 opacity-30">🏅</div>
              <h3 className="text-lg font-bold text-gray-400 mb-2">Your Analysis Will Appear Here</h3>
              <p className="text-sm text-gray-600 max-w-xs">
                Fill in your purchase details on the left and click{' '}
                <span className="text-yellow-400">Analyze My Investment</span> to see your P&L,
                current value, and sell recommendation.
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {analysisError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm text-center">
            ⚠️ {analysisError}
          </div>
        )}

        {/* Chart — shown once analysis is available */}
        {analysis && (
          <PriceChart
            history={analysis.prediction.history}
            priceTargets={analysis.prediction.priceTargets}
            currentPrice={analysis.goldPrice.spotPrice}
            sma20={analysis.prediction.technicalIndicators.sma20}
            sma50={analysis.prediction.technicalIndicators.sma50}
            sma200={analysis.prediction.technicalIndicators.sma200}
          />
        )}

        {/* Prediction + Signals Row */}
        {analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in">
            <PredictionCard prediction={analysis.prediction} />
            <MarketSignals signals={analysis.prediction.signals} />
          </div>
        )}

        {/* Initial state — before analysis */}
        {!analysis && !analysisLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {[
              { emoji: '📊', title: 'Technical Analysis', desc: '7 indicators including RSI, MACD, Bollinger Bands, and moving averages' },
              { emoji: '🌍', title: 'Macro Factors', desc: 'Real interest rates, USD strength (DXY), Fed policy impact on gold' },
              { emoji: '🗓️', title: 'Seasonal Patterns', desc: '20-year seasonal data — Diwali, CNY, Christmas demand cycles' },
            ].map((card) => (
              <div key={card.title} className="gold-card p-5 text-center">
                <div className="text-4xl mb-3">{card.emoji}</div>
                <h3 className="font-bold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-gray-800 pt-6 pb-4 text-center">
          <div className="text-xs text-gray-700 space-y-1">
            <p>
              Data sourced from <span className="text-gray-500">Yahoo Finance</span>,{' '}
              <span className="text-gray-500">GoldAPI.io</span>, and{' '}
              <span className="text-gray-500">Federal Reserve (FRED)</span>.
              {lastUpdated && <> Last updated: <span className="text-gray-500">{lastUpdated}</span></>}
            </p>
            <p>
              ⚠️ This tool is for informational purposes only. Not financial advice.
              Always consult a qualified financial advisor before making investment decisions.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
