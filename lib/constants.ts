import type { Karat, Currency } from '@/types';

export const TROY_OZ_TO_GRAMS = 31.1035;
export const TOLA_TO_GRAMS    = 11.6638; // 1 tola (standard Indian/Pakistani measure)

export const WEIGHT_UNITS = [
  { value: 'g',       label: 'Grams (g)',      toGrams: 1 },
  { value: 'tola',    label: 'Tola',           toGrams: TOLA_TO_GRAMS },
  { value: 'troy_oz', label: 'Troy Ounce',     toGrams: TROY_OZ_TO_GRAMS },
] as const;
export type WeightUnit = typeof WEIGHT_UNITS[number]['value'];

export const KARAT_PURITY: Record<Karat, number> = {
  24: 1.0,
  22: 0.9167,
  21: 0.875,
  18: 0.75,
  14: 0.5833,
  10: 0.4167,
  9:  0.375,
};

export const KARAT_OPTIONS: { value: Karat; label: string }[] = [
  { value: 24, label: '24K — 99.9% Pure (Investment/Bullion)' },
  { value: 22, label: '22K — 91.7% Pure (Jewelry, Coins)' },
  { value: 21, label: '21K — 87.5% Pure (Middle East Jewelry)' },
  { value: 18, label: '18K — 75.0% Pure (Fine Jewelry)' },
  { value: 14, label: '14K — 58.3% Pure (Western Jewelry)' },
  { value: 10, label: '10K — 41.7% Pure (Budget Jewelry)' },
  { value: 9,  label: '9K  — 37.5% Pure (UK/Australia)' },
];

export const CURRENCY_INFO: Record<Currency, { symbol: string; name: string; flag: string }> = {
  USD: { symbol: '$',   name: 'US Dollar',        flag: '🇺🇸' },
  PKR: { symbol: '₨',  name: 'Pakistani Rupee',   flag: '🇵🇰' },
  AED: { symbol: 'د.إ',name: 'UAE Dirham',         flag: '🇦🇪' },
  SAR: { symbol: '﷼',  name: 'Saudi Riyal',       flag: '🇸🇦' },
  GBP: { symbol: '£',  name: 'British Pound',      flag: '🇬🇧' },
  EUR: { symbol: '€',  name: 'Euro',               flag: '🇪🇺' },
  INR: { symbol: '₹',  name: 'Indian Rupee',       flag: '🇮🇳' },
};

export const FALLBACK_EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  PKR: 278,
  AED: 3.6725,
  SAR: 3.75,
  GBP: 0.79,
  EUR: 0.92,
  INR: 84,
};

// Local market premium factors applied on top of international spot price.
// Accounts for import duties and taxes embedded in retail gold prices.
export const LOCAL_MARKET_FACTOR: Partial<Record<Currency, { factor: number; note: string }>> = {
  INR: {
    factor: 1.06 * 1.03, // 6% import duty + 3% GST = ~9.18%
    note: 'Includes 6% import duty + 3% GST (Indian market)',
  },
  PKR: {
    factor: 1.08,
    note: 'Includes ~8% import & regulatory duty (Pakistani market)',
  },
};

// India city-wise gold premium over national MCX 24K base rate (₹ per gram).
// Premiums reflect transport, local taxes, and dealer margins.
// Source: historical IBJA city differential data (estimates, updated periodically).
export const INDIA_CITY_PREMIUMS: {
  city: string; state: string; premium: number; featured?: boolean; note?: string;
}[] = [
  { city: 'Mumbai',     state: 'Maharashtra',    premium: 0,   note: 'MCX base rate (national benchmark)' },
  { city: 'Delhi',      state: 'NCT',            premium: 50  },
  { city: 'Bangalore',  state: 'Karnataka',      premium: 60  },
  { city: 'Chennai',    state: 'Tamil Nadu',     premium: 110 },
  { city: 'Kolkata',    state: 'West Bengal',    premium: 100 },
  { city: 'Hyderabad',  state: 'Telangana',      premium: 75  },
  { city: 'Ahmedabad',  state: 'Gujarat',        premium: 30  },
  { city: 'Jaipur',     state: 'Rajasthan',      premium: 80  },
  { city: 'Chandigarh', state: 'Punjab',         premium: 100 },
  { city: 'Kochi',      state: 'Kerala',         premium: 130 },
  { city: 'Lucknow',    state: 'Uttar Pradesh',  premium: 90  },
  {
    city: 'Srinagar',
    state: 'Jammu & Kashmir',
    premium: 220,
    featured: true,
    note: 'Higher due to mountain transport logistics, limited supply routes & local market premiums',
  },
];

// India LTCG tax rules for physical gold (post July 2024 budget)
export const INDIA_GOLD_TAX = {
  ltcgHoldingMonths: 24,        // months before LTCG applies
  ltcgRate: 0.125,              // 12.5% LTCG (without indexation, post Jul-2024)
  stcgNote: 'Taxed as income at your applicable slab rate',
  surcharge: 0,                 // applicable for high income, set 0 for simplicity
};

// Current FD and investment rates (approx, updated periodically)
export const COMPARISON_RATES = {
  sbiFD1Y:   7.00, // SBI 1-year FD rate %
  sbiFD3Y:   6.75, // SBI 3-year FD rate %
  sbiFD5Y:   6.50, // SBI 5-year FD rate %
  ppfRate:   7.10, // PPF annual rate %
  sgbInterest: 2.50, // SGB additional interest rate %
  nifty1YReturn: 14.5, // approximate Nifty 50 1-year return %
};

export const FALLBACK_ECONOMIC = {
  fedFundsRate: 4.375,
  cpiYoY: 3.5,
  dxyCurrent: 104.2,
  dxyChange1m: 0.8,
};
