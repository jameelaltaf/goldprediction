'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import PortfolioForm from '@/components/PortfolioForm';
import InvestmentSummary from '@/components/InvestmentSummary';
import PredictionCard from '@/components/PredictionCard';
import MarketSignals from '@/components/MarketSignals';
import IndiaMarketPrices from '@/components/IndiaMarketPrices';
import TargetCalculator from '@/components/TargetCalculator';
import LTCGCalculator from '@/components/LTCGCalculator';
import MultiHoldings from '@/components/MultiHoldings';
import ComparisonWidget from '@/components/ComparisonWidget';
import GoldNews from '@/components/GoldNews';
import ShareButton from '@/components/ShareButton';
import type { GoldPrice, PortfolioEntry, FullAnalysis, Currency } from '@/types';
import { FALLBACK_EXCHANGE_RATES } from '@/lib/constants';

const PriceChart = dynamic(() => import('@/components/PriceChart'), { ssr: false });

export default function HomePage() {
  const [goldPrice, setGoldPrice]         = useState<GoldPrice | null>(null);
  const [priceLoading, setPriceLoading]   = useState(true);
  const [analysis, setAnalysis]           = useState<FullAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [portfolio, setPortfolio]         = useState<PortfolioEntry | null>(null);
  const [lastUpdated, setLastUpdated]     = useState('');

  // Exchange rates cache for MultiHoldings (fetched alongside analysis)
  const [exchangeRates, setExchangeRates] = useState<Partial<Record<Currency, number>>>(FALLBACK_EXCHANGE_RATES);

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
    const iv = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [fetchPrice]);

  const handleAnalyze = async (entry: PortfolioEntry) => {
    setPortfolio(entry);
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const res = await fetch(`/api/analysis?currency=${entry.currency}`);
      if (!res.ok) throw new Error((await res.json()).error ?? 'Analysis failed');
      const data: FullAnalysis = await res.json();
      setAnalysis(data);
      setGoldPrice(data.goldPrice);
      setExchangeRates((prev) => ({ ...prev, [entry.currency]: data.exchangeRate }));
    } catch (err: any) {
      setAnalysisError(err.message ?? 'Failed to run analysis. Please try again.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const spotUSD = analysis?.goldPrice.spotPrice ?? goldPrice?.spotPrice ?? 3350;

  return (
    <div className="min-h-screen">
      <Header goldPrice={goldPrice} loading={priceLoading} inrRate={exchangeRates.INR} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Hero ── */}
        <div className="text-center py-4">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            <span className="text-white">Is It Time to </span>
            <span style={{ background: 'linear-gradient(135deg,#FFD700,#FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Sell Your Gold?
            </span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
            Real-time gold prices for India, Srinagar & global markets. Enter your purchase details
            for a complete P&L breakdown, LTCG tax calculation, and data-driven sell recommendation.
          </p>
        </div>

        {/* ── Portfolio Form + Summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PortfolioForm onAnalyze={handleAnalyze} loading={analysisLoading} />
          {analysis && portfolio ? (
            <InvestmentSummary entry={portfolio} goldSpotUSD={analysis.goldPrice.spotPrice} exchangeRate={analysis.exchangeRate} />
          ) : (
            <div className="gold-card p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="text-6xl mb-4 opacity-20">🏅</div>
              <h3 className="text-lg font-bold text-gray-400 mb-2">Your Analysis Will Appear Here</h3>
              <p className="text-sm text-gray-600 max-w-xs">
                Fill in your purchase details and click{' '}
                <span className="text-yellow-400">⚡ Analyze My Investment</span>
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

        {/* ── Share Button (when analysis ready) ── */}
        {analysis && portfolio && (
          <div className="flex justify-end fade-in">
            <ShareButton entry={portfolio} analysis={analysis} />
          </div>
        )}

        {/* ── Price Chart ── */}
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

        {/* ── Prediction + Market Signals ── */}
        {analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in">
            <PredictionCard prediction={analysis.prediction} />
            <MarketSignals signals={analysis.prediction.signals} />
          </div>
        )}

        {/* ── India Market Prices (always visible) ── */}
        <IndiaMarketPrices />

        {/* ── Target Calculator + LTCG (when analysis ready) ── */}
        {analysis && portfolio && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in">
            <TargetCalculator
              entry={portfolio}
              currentSpotUSD={analysis.goldPrice.spotPrice}
              exchangeRate={analysis.exchangeRate}
            />
            <LTCGCalculator
              entry={portfolio}
              currentSpotUSD={analysis.goldPrice.spotPrice}
              exchangeRate={analysis.exchangeRate}
            />
          </div>
        )}

        {/* ── Portfolio Tracker (always visible) ── */}
        <MultiHoldings
          currentSpotUSD={spotUSD}
          defaultCurrency={portfolio?.currency ?? 'INR'}
          exchangeRates={exchangeRates}
        />

        {/* ── Comparison Widget (when analysis ready) ── */}
        {analysis && portfolio && (
          <ComparisonWidget
            entry={portfolio}
            currentSpotUSD={analysis.goldPrice.spotPrice}
            exchangeRate={analysis.exchangeRate}
          />
        )}

        {/* ── Gold News ── */}
        <GoldNews />

        {/* ── Feature Cards (shown before first analysis) ── */}
        {!analysis && !analysisLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji: '📊', title: 'Technical Analysis',  desc: 'RSI, MACD, Bollinger Bands, SMA 20/50/200' },
              { emoji: '🌍', title: 'Macro Factors',       desc: 'Real interest rates, DXY, Fed policy impact' },
              { emoji: '🗓️', title: 'Seasonal Patterns',  desc: '20-year Diwali, CNY & festive demand cycles' },
              { emoji: '📍', title: 'Srinagar Live Rate',  desc: 'City-specific J&K price with duty breakdown' },
            ].map((c) => (
              <div key={c.title} className="gold-card p-5 text-center">
                <div className="text-4xl mb-3">{c.emoji}</div>
                <h3 className="font-bold text-white mb-2 text-sm">{c.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="border-t border-gray-800 pt-6 pb-4 text-center">
          <div className="text-xs text-gray-700 space-y-1">
            <p>
              Data: <span className="text-gray-500">Yahoo Finance · GoldAPI.io · metals.live · Google News RSS · Federal Reserve (FRED)</span>
              {lastUpdated && <span> · Last updated <span className="text-gray-500">{lastUpdated}</span></span>}
            </p>
            <p>
              ⚠️ For informational purposes only. Not financial advice. Consult a SEBI-registered advisor for investment decisions.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
