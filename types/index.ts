export interface GoldPrice {
  spotPrice: number;
  pricePerGram24k: number;
  change24h: number;
  changePercent24h: number;
  lastUpdated: string;
  source: string;
}

export interface HistoricalDataPoint {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
}

export interface TechnicalIndicators {
  sma20: number;
  sma50: number;
  sma200: number;
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
}

export type SignalType = 'bullish' | 'bearish' | 'neutral';
export type SignalCategory = 'technical' | 'fundamental' | 'seasonal';

export interface Signal {
  id: string;
  category: SignalCategory;
  name: string;
  value: string;
  signal: SignalType;
  score: number;
  weight: number;
  description: string;
}

export type Recommendation = 'SELL_NOW' | 'SELL_IN_30' | 'HOLD' | 'SELL_IN_60' | 'SELL_IN_90';

export interface PriceTargets {
  day30: number;
  day60: number;
  day90: number;
  day30Bull: number;
  day60Bull: number;
  day90Bull: number;
  day30Bear: number;
  day60Bear: number;
  day90Bear: number;
}

export interface Prediction {
  recommendation: Recommendation;
  confidence: number;
  compositeScore: number;
  priceTargets: PriceTargets;
  bestSellDate: string;
  signals: Signal[];
  technicalIndicators: TechnicalIndicators;
  summary: string;
  history: HistoricalDataPoint[];
}

export type Karat = 24 | 22 | 21 | 18 | 14 | 10 | 9;
export type Currency = 'USD' | 'PKR' | 'AED' | 'SAR' | 'GBP' | 'EUR' | 'INR';

export interface PortfolioEntry {
  purchasePrice: number;
  karat: Karat;
  weightGrams: number;
  currency: Currency;
}

export interface PortfolioAnalysis {
  purchaseValue: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  currentPricePerGram: number;
  breakEvenSpotUSD: number;
}

export interface FullAnalysis {
  goldPrice: GoldPrice;
  exchangeRate: number;
  dxy: { current: number; change1m: number };
  prediction: Prediction;
}
