import type { Karat, Currency } from '@/types';

export const TROY_OZ_TO_GRAMS = 31.1035;

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
  INR: 83.5,
};

// Approximate current economic data (used as fallback if live fetch fails)
export const FALLBACK_ECONOMIC = {
  fedFundsRate: 4.375,
  cpiYoY: 3.5,
  dxyCurrent: 104.2,
  dxyChange1m: 0.8,
};
