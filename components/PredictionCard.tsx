'use client';

import type { Prediction, Recommendation } from '@/types';

interface PredictionCardProps {
  prediction: Prediction;
}

const REC_CONFIG: Record<Recommendation, {
  label: string; emoji: string; color: string; bgClass: string; description: string;
}> = {
  SELL_NOW: {
    label: 'SELL NOW',
    emoji: '🔴',
    color: '#ef4444',
    bgClass: 'recommendation-sell-now',
    description: 'Bearish signals dominant — maximize returns by selling now',
  },
  SELL_IN_30: {
    label: 'SELL IN ~30 DAYS',
    emoji: '🟠',
    color: '#f97316',
    bgClass: 'recommendation-sell-30',
    description: 'Mild bearish pressure — exit within the next month',
  },
  HOLD: {
    label: 'HOLD',
    emoji: '🟡',
    color: '#eab308',
    bgClass: 'recommendation-hold',
    description: 'Mixed signals — hold and monitor closely',
  },
  SELL_IN_60: {
    label: 'HOLD → SELL IN 60 DAYS',
    emoji: '🟢',
    color: '#22c55e',
    bgClass: 'recommendation-sell-60',
    description: 'Bullish conditions — ride the trend for ~60 more days',
  },
  SELL_IN_90: {
    label: 'HOLD → SELL IN 90 DAYS',
    emoji: '💚',
    color: '#16a34a',
    bgClass: 'recommendation-sell-90',
    description: 'Strong bull run — hold for maximum 90-day appreciation',
  },
};

function ScoreBar({ score }: { score: number }) {
  const pct = ((score + 100) / 200) * 100; // map -100..100 to 0..100%
  const color = score > 20 ? '#22c55e' : score < -20 ? '#ef4444' : '#eab308';

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Bearish</span>
        <span className="font-semibold" style={{ color }}>
          Score: {score > 0 ? '+' : ''}{score}
        </span>
        <span>Bullish</span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-600" />
        <div
          className="h-full rounded-full score-bar-fill transition-all duration-1000"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, transparent 0%, ${color} 100%)` }}
        />
      </div>
    </div>
  );
}

function ConfidenceRing({ confidence }: { confidence: number }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (confidence / 100) * circumference;
  const color = confidence >= 70 ? '#22c55e' : confidence >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#222" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
        <text x="48" y="44" textAnchor="middle" fill={color} fontSize="16" fontWeight="700">{confidence}%</text>
        <text x="48" y="60" textAnchor="middle" fill="#666" fontSize="10">confidence</text>
      </svg>
    </div>
  );
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  const cfg = REC_CONFIG[prediction.recommendation];

  return (
    <div className={`gold-card p-6 border-2 fade-in ${cfg.bgClass}`}>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🔮</span>
        <div>
          <h2 className="text-lg font-bold text-white">AI Recommendation</h2>
          <p className="text-xs text-gray-500">Based on {prediction.signals.length} market signals</p>
        </div>
      </div>

      {/* Main recommendation */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">{cfg.emoji}</div>
        <div className="text-2xl font-black tracking-tight mb-2" style={{ color: cfg.color }}>
          {cfg.label}
        </div>
        <p className="text-sm text-gray-400">{cfg.description}</p>
      </div>

      {/* Confidence + Score */}
      <div className="flex items-center gap-6 justify-center mb-6">
        <ConfidenceRing confidence={prediction.confidence} />
        <div className="flex-1">
          <ScoreBar score={prediction.compositeScore} />
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Best Sell Window</div>
            <div className="font-bold text-yellow-300 text-sm">{prediction.bestSellDate}</div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl p-4 bg-black/30 border border-gray-800 mb-5">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Analysis Summary</div>
        <p className="text-sm text-gray-300 leading-relaxed">{prediction.summary}</p>
      </div>

      {/* Key indicators */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'RSI (14)', value: isNaN(prediction.technicalIndicators.rsi14) ? '—' : prediction.technicalIndicators.rsi14.toFixed(1), warning: prediction.technicalIndicators.rsi14 > 70 || prediction.technicalIndicators.rsi14 < 30 },
          { label: 'MA200', value: isNaN(prediction.technicalIndicators.sma200) ? '—' : `$${Math.round(prediction.technicalIndicators.sma200).toLocaleString()}`, warning: false },
          { label: 'MACD', value: isNaN(prediction.technicalIndicators.macd) ? '—' : prediction.technicalIndicators.macd.toFixed(1), warning: false },
        ].map((item) => (
          <div key={item.label} className="rounded-xl p-2.5 bg-black/30 border border-gray-800 text-center">
            <div className="text-xs text-gray-500">{item.label}</div>
            <div className={`font-bold text-sm mt-0.5 ${item.warning ? 'text-yellow-400' : 'text-white'}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-700 mt-4 text-center leading-relaxed">
        This analysis is for informational purposes only and does not constitute financial advice.
        Past patterns do not guarantee future performance.
      </p>
    </div>
  );
}
