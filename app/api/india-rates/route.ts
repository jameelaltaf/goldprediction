import { NextResponse } from 'next/server';
import { fetchCurrentGoldPrice, fetchExchangeRate } from '@/lib/goldData';
import { INDIA_CITY_PREMIUMS, KARAT_PURITY, TROY_OZ_TO_GRAMS } from '@/lib/constants';
import type { CityRate } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [goldPrice, inrRate] = await Promise.all([
      fetchCurrentGoldPrice(),
      fetchExchangeRate('INR'),
    ]);

    // National MCX equivalent: spot × INR rate × import duty (6%) × GST (3%)
    const spotPerGramINR = (goldPrice.spotPrice / TROY_OZ_TO_GRAMS) * inrRate;
    const afterDuty      = spotPerGramINR * 1.06;
    const mcxBase24k     = afterDuty * 1.03; // MCX national base for 24K

    const cityRates: CityRate[] = INDIA_CITY_PREMIUMS.map((c) => {
      const rate24k = mcxBase24k + c.premium;
      return {
        city:     c.city,
        state:    c.state,
        rate24k:  Math.round(rate24k * 100) / 100,
        rate22k:  Math.round(rate24k * KARAT_PURITY[22] * 100) / 100,
        rate18k:  Math.round(rate24k * KARAT_PURITY[18] * 100) / 100,
        premium:  c.premium,
        featured: !!c.featured,
        note:     c.note,
      };
    });

    return NextResponse.json({
      mcxBase24k:   Math.round(mcxBase24k * 100) / 100,
      spotUSD:      goldPrice.spotPrice,
      inrRate,
      lastUpdated:  new Date().toISOString(),
      source:       goldPrice.source,
      cityRates,
    });
  } catch (err) {
    console.error('India rates error:', err);
    return NextResponse.json({ error: 'Failed to fetch India rates' }, { status: 500 });
  }
}
