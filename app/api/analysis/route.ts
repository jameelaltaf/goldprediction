import { NextRequest, NextResponse } from 'next/server';
import { fetchCurrentGoldPrice, fetchGoldHistory, fetchExchangeRate, fetchDXY } from '@/lib/goldData';

export const dynamic = 'force-dynamic';
import { generatePrediction } from '@/lib/prediction';
import { FALLBACK_ECONOMIC } from '@/lib/constants';
import type { Currency } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const currency = (searchParams.get('currency') ?? 'USD') as Currency;

    // Parallel fetches for speed
    const [goldPrice, history, exchangeRate, dxy] = await Promise.all([
      fetchCurrentGoldPrice(),
      fetchGoldHistory('1y'),
      fetchExchangeRate(currency),
      fetchDXY(),
    ]);

    if (history.length < 5) {
      return NextResponse.json({ error: 'Could not fetch market data. Please try again.' }, { status: 503 });
    }

    const prices = history.map((d) => d.price);

    const prediction = generatePrediction({
      prices,
      history,
      currentPrice: goldPrice.spotPrice,
      dxy,
      fedRate: FALLBACK_ECONOMIC.fedFundsRate,
      cpiYoY: FALLBACK_ECONOMIC.cpiYoY,
    });

    return NextResponse.json({
      goldPrice,
      exchangeRate,
      dxy,
      prediction,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
