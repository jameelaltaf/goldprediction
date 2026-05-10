import type { Signal, Prediction, HistoricalDataPoint, Recommendation, PriceTargets } from '@/types';
import { sma, rsi, macd, bollingerBands, lastValid } from './technicalAnalysis';
import { FALLBACK_ECONOMIC } from './constants';

// Gold seasonal strength by month (based on 20-year historical patterns)
const SEASONAL: Record<number, { score: number; note: string }> = {
  1:  { score: 12,  note: 'Post-holiday & Indian wedding season buying' },
  2:  { score: 15,  note: "Valentine's Day + Chinese New Year demand surge" },
  3:  { score: 5,   note: 'Post-CNY lull easing, mixed signals' },
  4:  { score: 0,   note: 'Neutral shoulder season' },
  5:  { score: -5,  note: '"Sell in May" momentum, lower EM demand' },
  6:  { score: -10, note: 'Summer doldrums — lowest seasonal demand' },
  7:  { score: -8,  note: 'Summer doldrums continue' },
  8:  { score: -3,  note: 'Early Diwali stockpiling begins in India' },
  9:  { score: 15,  note: 'Diwali/festive season — demand surge in Asia' },
  10: { score: 20,  note: 'Peak festive season globally — strongest month' },
  11: { score: 15,  note: 'Pre-holiday buying, Diwali residual demand' },
  12: { score: 12,  note: 'Christmas + year-end central bank rebalancing' },
};

interface PredictionInput {
  prices: number[];
  history: HistoricalDataPoint[];
  currentPrice: number;
  dxy: { current: number; change1m: number };
  fedRate?: number;
  cpiYoY?: number;
}

export function generatePrediction(input: PredictionInput): Prediction {
  const {
    prices,
    history,
    currentPrice,
    dxy,
    fedRate = FALLBACK_ECONOMIC.fedFundsRate,
    cpiYoY = FALLBACK_ECONOMIC.cpiYoY,
  } = input;

  // — Technical indicators —
  const sma20Arr  = sma(prices, 20);
  const sma50Arr  = sma(prices, 50);
  const sma200Arr = sma(prices, 200);
  const rsiArr    = rsi(prices, 14);
  const macdData  = macd(prices);
  const bbData    = bollingerBands(prices, 20);

  const s20  = lastValid(sma20Arr);
  const s50  = lastValid(sma50Arr);
  const s200 = lastValid(sma200Arr);
  const r14  = lastValid(rsiArr);
  const macdVal = lastValid(macdData.macd);
  const macdSig = lastValid(macdData.signal);
  const bbUpper = lastValid(bbData.upper);
  const bbMiddle = lastValid(bbData.middle);
  const bbLower  = lastValid(bbData.lower);

  const priceOneMonthAgo = prices[Math.max(0, prices.length - 22)];
  const momentum1m = ((currentPrice - priceOneMonthAgo) / priceOneMonthAgo) * 100;

  const realRate = fedRate - cpiYoY;
  const signals: Signal[] = [];

  // ── TECHNICAL SIGNALS ──

  if (!isNaN(s200)) {
    const pct = ((currentPrice - s200) / s200) * 100;
    signals.push({
      id: 'sma200',
      category: 'technical',
      name: '200-Day Moving Average',
      value: `$${s200.toFixed(0)} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`,
      signal: currentPrice > s200 ? 'bullish' : 'bearish',
      score: Math.max(-1, Math.min(1, pct / 10)),
      weight: 0.15,
      description:
        currentPrice > s200
          ? `Price is ${pct.toFixed(1)}% above the 200-day MA — long-term uptrend intact`
          : `Price is ${Math.abs(pct).toFixed(1)}% below the 200-day MA — long-term downtrend`,
    });
  }

  if (!isNaN(s50)) {
    const pct = ((currentPrice - s50) / s50) * 100;
    signals.push({
      id: 'sma50',
      category: 'technical',
      name: '50-Day Moving Average',
      value: `$${s50.toFixed(0)} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`,
      signal: currentPrice > s50 ? 'bullish' : 'bearish',
      score: Math.max(-0.8, Math.min(0.8, pct / 8)),
      weight: 0.10,
      description:
        currentPrice > s50
          ? `Price above 50-day MA — medium-term trend is positive`
          : `Price below 50-day MA — medium-term trend is negative`,
    });
  }

  if (!isNaN(r14)) {
    let signal: Signal['signal'];
    let score: number;
    let description: string;
    if (r14 >= 75) {
      signal = 'bearish'; score = -((r14 - 70) / 30);
      description = `RSI ${r14.toFixed(1)} — severely overbought, high pullback risk`;
    } else if (r14 >= 70) {
      signal = 'bearish'; score = -0.5;
      description = `RSI ${r14.toFixed(1)} — overbought territory, consider profit-taking`;
    } else if (r14 <= 25) {
      signal = 'bullish'; score = (30 - r14) / 30;
      description = `RSI ${r14.toFixed(1)} — oversold, strong bounce likely`;
    } else if (r14 <= 30) {
      signal = 'bullish'; score = 0.5;
      description = `RSI ${r14.toFixed(1)} — approaching oversold, potential reversal`;
    } else if (r14 >= 55) {
      signal = 'bullish'; score = 0.25;
      description = `RSI ${r14.toFixed(1)} — bullish momentum zone (55-70)`;
    } else if (r14 <= 45) {
      signal = 'bearish'; score = -0.25;
      description = `RSI ${r14.toFixed(1)} — bearish momentum zone (30-45)`;
    } else {
      signal = 'neutral'; score = 0;
      description = `RSI ${r14.toFixed(1)} — neutral zone, no strong directional signal`;
    }
    signals.push({ id: 'rsi', category: 'technical', name: 'RSI (14-Day)', value: r14.toFixed(1), signal, score, weight: 0.10, description });
  }

  if (!isNaN(macdVal) && !isNaN(macdSig)) {
    const bullish = macdVal > macdSig;
    const hist = macdVal - macdSig;
    signals.push({
      id: 'macd', category: 'technical', name: 'MACD',
      value: `${macdVal.toFixed(1)} / Signal: ${macdSig.toFixed(1)}`,
      signal: bullish ? 'bullish' : 'bearish',
      score: Math.max(-0.8, Math.min(0.8, hist / 20)),
      weight: 0.08,
      description: bullish
        ? 'MACD crossed above signal line — bullish momentum confirmation'
        : 'MACD below signal line — bearish momentum',
    });
  }

  if (!isNaN(bbUpper) && !isNaN(bbLower)) {
    const position = (currentPrice - bbLower) / (bbUpper - bbLower);
    let bbSignal: Signal['signal'];
    let bbScore: number;
    let bbDesc: string;
    if (position > 0.95) {
      bbSignal = 'bearish'; bbScore = -0.7;
      bbDesc = 'Price at upper Bollinger Band — mean reversion likely downward';
    } else if (position < 0.05) {
      bbSignal = 'bullish'; bbScore = 0.7;
      bbDesc = 'Price at lower Bollinger Band — mean reversion likely upward';
    } else if (position > 0.6) {
      bbSignal = 'bullish'; bbScore = 0.3;
      bbDesc = 'Price in upper half of Bollinger Band — mild bullish';
    } else {
      bbSignal = 'neutral'; bbScore = -0.1;
      bbDesc = 'Price in middle range of Bollinger Band — neutral';
    }
    signals.push({
      id: 'bb', category: 'technical', name: 'Bollinger Bands',
      value: `${(position * 100).toFixed(0)}% of band`,
      signal: bbSignal, score: bbScore, weight: 0.07, description: bbDesc,
    });
  }

  signals.push({
    id: 'momentum', category: 'technical', name: '1-Month Momentum',
    value: `${momentum1m >= 0 ? '+' : ''}${momentum1m.toFixed(2)}%`,
    signal: momentum1m > 2 ? 'bullish' : momentum1m < -2 ? 'bearish' : 'neutral',
    score: Math.max(-1, Math.min(1, momentum1m / 10)),
    weight: 0.05,
    description:
      momentum1m > 0
        ? `Gold gained ${momentum1m.toFixed(1)}% in the past month — positive trend`
        : `Gold fell ${Math.abs(momentum1m).toFixed(1)}% in the past month — negative trend`,
  });

  // ── FUNDAMENTAL SIGNALS ──

  let rateSignal: Signal['signal'];
  let rateScore: number;
  let rateDesc: string;
  if (realRate < 0) {
    rateSignal = 'bullish'; rateScore = Math.min(1, Math.abs(realRate) / 2);
    rateDesc = `Real rates at ${realRate.toFixed(2)}% — negative real rates are the strongest driver for gold`;
  } else if (realRate < 1) {
    rateSignal = 'bullish'; rateScore = 0.4;
    rateDesc = `Real rates at ${realRate.toFixed(2)}% — low positive rates still supportive`;
  } else if (realRate < 2) {
    rateSignal = 'neutral'; rateScore = -0.2;
    rateDesc = `Real rates at ${realRate.toFixed(2)}% — moderate headwind for gold`;
  } else {
    rateSignal = 'bearish'; rateScore = -Math.min(1, (realRate - 2) / 2);
    rateDesc = `Real rates at ${realRate.toFixed(2)}% — high real rates significantly pressure gold`;
  }
  signals.push({
    id: 'real_rates', category: 'fundamental', name: 'Real Interest Rates',
    value: `${fedRate}% − ${cpiYoY}% = ${realRate.toFixed(2)}%`,
    signal: rateSignal, score: rateScore, weight: 0.20, description: rateDesc,
  });

  const dxySignal: Signal['signal'] =
    dxy.change1m < -1 ? 'bullish' : dxy.change1m > 1 ? 'bearish' : 'neutral';
  const dxyScore = Math.max(-1, Math.min(1, -dxy.change1m / 3));
  signals.push({
    id: 'dxy', category: 'fundamental', name: 'US Dollar Index (DXY)',
    value: `${dxy.current.toFixed(2)} (${dxy.change1m >= 0 ? '+' : ''}${dxy.change1m.toFixed(2)}% 1M)`,
    signal: dxySignal, score: dxyScore, weight: 0.15,
    description:
      dxy.change1m < 0
        ? `USD weakened ${Math.abs(dxy.change1m).toFixed(1)}% — inverse correlation boosts gold`
        : dxy.change1m > 0
          ? `USD strengthened ${dxy.change1m.toFixed(1)}% — stronger dollar weighs on gold`
          : 'USD stable — neutral impact on gold',
  });

  // ── SEASONAL SIGNAL ──
  const month = new Date().getMonth() + 1;
  const seasonal = SEASONAL[month];
  signals.push({
    id: 'seasonal', category: 'seasonal', name: 'Seasonal Pattern',
    value: new Date().toLocaleString('en', { month: 'long' }),
    signal: seasonal.score > 5 ? 'bullish' : seasonal.score < -5 ? 'bearish' : 'neutral',
    score: Math.max(-1, Math.min(1, seasonal.score / 20)),
    weight: 0.10,
    description: seasonal.note,
  });

  // ── COMPOSITE SCORE ──
  const totalWeight = signals.reduce((s, sig) => s + sig.weight, 0);
  const rawScore = signals.reduce((s, sig) => s + sig.score * sig.weight * 100, 0);
  const compositeScore = Math.round(rawScore / totalWeight);

  // ── PRICE TARGETS ──
  const monthlyReturn = (compositeScore / 100) * 0.045;
  const decay = 0.82;
  const volatility = 0.025;

  const day30   = currentPrice * (1 + monthlyReturn);
  const day60   = day30 * (1 + monthlyReturn * decay);
  const day90   = day60 * (1 + monthlyReturn * decay * decay);

  const priceTargets: PriceTargets = {
    day30:  Math.round(day30),
    day60:  Math.round(day60),
    day90:  Math.round(day90),
    day30Bull: Math.round(day30 * (1 + volatility)),
    day60Bull: Math.round(day60 * (1 + volatility * 1.5)),
    day90Bull: Math.round(day90 * (1 + volatility * 2)),
    day30Bear: Math.round(day30 * (1 - volatility)),
    day60Bear: Math.round(day60 * (1 - volatility * 1.5)),
    day90Bear: Math.round(day90 * (1 - volatility * 2)),
  };

  // ── RECOMMENDATION ──
  let recommendation: Recommendation;
  let bestSellDate: string;
  let summary: string;

  const addDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (compositeScore < -30) {
    recommendation = 'SELL_NOW';
    bestSellDate = 'As soon as possible';
    summary = 'Multiple bearish signals are aligned. The technical and fundamental backdrop suggests selling now before a potential correction deepens.';
  } else if (compositeScore < -10) {
    recommendation = 'SELL_IN_30';
    bestSellDate = addDays(30);
    summary = `Mild bearish pressure. Price may edge slightly higher short-term before declining. Target sell window: ~${addDays(30)}.`;
  } else if (compositeScore < 20) {
    recommendation = 'HOLD';
    bestSellDate = addDays(45);
    summary = 'Mixed signals — neither a clear buy nor sell. Hold your position and re-evaluate in 4-6 weeks as clarity emerges.';
  } else if (compositeScore < 50) {
    recommendation = 'SELL_IN_60';
    bestSellDate = addDays(60);
    summary = `Bullish conditions support further price appreciation. Target a peak sell window around ${addDays(60)} for maximum returns.`;
  } else {
    recommendation = 'SELL_IN_90';
    bestSellDate = addDays(90);
    summary = `Strong bullish signals across technical and fundamental factors. Hold for 90 days to capture projected price appreciation — peak target around ${addDays(90)}.`;
  }

  // Confidence: inversely proportional to signal disagreement
  const scoreValues = signals.map((s) => s.score);
  const avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
  const variance = scoreValues.reduce((s, v) => s + (v - avgScore) ** 2, 0) / scoreValues.length;
  const agreement = 1 - Math.min(1, Math.sqrt(variance));
  const confidence = Math.min(95, Math.round(50 + agreement * 35 + Math.min(10, Math.abs(compositeScore) / 12)));

  return {
    recommendation,
    confidence,
    compositeScore,
    priceTargets,
    bestSellDate,
    signals,
    technicalIndicators: {
      sma20: s20, sma50: s50, sma200: s200,
      rsi14: r14,
      macd: macdVal, macdSignal: macdSig, macdHistogram: macdVal - macdSig,
      bbUpper, bbMiddle, bbLower,
    },
    summary,
    history,
  };
}
