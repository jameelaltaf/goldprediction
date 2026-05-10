import { NextResponse } from 'next/server';
import { fetchCurrentGoldPrice } from '@/lib/goldData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const price = await fetchCurrentGoldPrice();
    return NextResponse.json(price);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch gold price' }, { status: 500 });
  }
}
