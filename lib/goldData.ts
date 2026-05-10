import axios from 'axios';
import type { GoldPrice, HistoricalDataPoint } from '@/types';
import { TROY_OZ_TO_GRAMS, FALLBACK_EXCHANGE_RATES, FALLBACK_ECONOMIC } from './constants';
import type { Currency } from '@/types';

const YF_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

async function yfinanceFetch(symbol: string, params: Record<string, string>) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
  const resp = await axios.get(url, { params, headers: YF_HEADERS, timeout: 10000 });
  return resp.data.chart.result[0];
}

export async function fetchCurrentGoldPrice(): Promise<GoldPrice> {
  // Try GoldAPI.io if key is configured
  const apiKey = process.env.GOLD_API_KEY;
  if (apiKey) {
    try {
      const resp = await axios.get('https://www.goldapi.io/api/XAU/USD', {
        headers: { 'x-access-token': apiKey },
        timeout: 6000,
      });
      const d = resp.data;
      return {
        spotPrice: d.price,
        pricePerGram24k: d.price / TROY_OZ_TO_GRAMS,
        change24h: d.ch,
        changePercent24h: d.chp,
        lastUpdated: new Date().toISOString(),
        source: 'GoldAPI.io',
      };
    } catch {
      // fall through to Yahoo Finance
    }
  }

  try {
    const result = await yfinanceFetch('GC=F', { interval: '1d', range: '5d' });
    const meta = result.meta;
    const spot: number = meta.regularMarketPrice ?? meta.previousClose;
    const prev: number = meta.chartPreviousClose ?? meta.previousClose;
    return {
      spotPrice: spot,
      pricePerGram24k: spot / TROY_OZ_TO_GRAMS,
      change24h: spot - prev,
      changePercent24h: ((spot - prev) / prev) * 100,
      lastUpdated: new Date().toISOString(),
      source: 'Yahoo Finance',
    };
  } catch {
    // Static fallback so the app remains functional
    const spot = 3350;
    return {
      spotPrice: spot,
      pricePerGram24k: spot / TROY_OZ_TO_GRAMS,
      change24h: 0,
      changePercent24h: 0,
      lastUpdated: new Date().toISOString(),
      source: 'Fallback (static)',
    };
  }
}

export async function fetchGoldHistory(range = '1y'): Promise<HistoricalDataPoint[]> {
  try {
    const result = await yfinanceFetch('GC=F', { interval: '1d', range });
    const timestamps: number[] = result.timestamp;
    const q = result.indicators.quote[0];

    return timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        price: q.close[i],
        open:  q.open[i],
        high:  q.high[i],
        low:   q.low[i],
      }))
      .filter((d) => d.price != null && d.price > 0);
  } catch {
    return [];
  }
}

export async function fetchExchangeRate(currency: Currency): Promise<number> {
  if (currency === 'USD') return 1;
  try {
    const result = await yfinanceFetch(`USD${currency}=X`, { interval: '1d', range: '5d' });
    return result.meta.regularMarketPrice as number;
  } catch {
    return FALLBACK_EXCHANGE_RATES[currency];
  }
}

export async function fetchDXY(): Promise<{ current: number; change1m: number }> {
  try {
    const result = await yfinanceFetch('DX-Y.NYB', { interval: '1d', range: '1mo' });
    const closes: number[] = result.indicators.quote[0].close.filter((p: number | null) => p != null);
    const current: number = result.meta.regularMarketPrice;
    const oneMonthAgo = closes[0];
    return {
      current,
      change1m: ((current - oneMonthAgo) / oneMonthAgo) * 100,
    };
  } catch {
    return { current: FALLBACK_ECONOMIC.dxyCurrent, change1m: FALLBACK_ECONOMIC.dxyChange1m };
  }
}
