export function sma(prices: number[], period: number): number[] {
  return prices.map((_, i) => {
    if (i < period - 1) return NaN;
    const slice = prices.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

export function ema(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    result.push(prices[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

export function rsi(prices: number[], period = 14): number[] {
  const result: number[] = new Array(period).fill(NaN);
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return result;
}

export function macd(
  prices: number[],
  fast = 12,
  slow = 26,
  signal = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const ema12 = ema(prices, fast);
  const ema26 = ema(prices, slow);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine.slice(slow - 1), signal);
  const padded = new Array(slow - 1).fill(NaN).concat(signalLine);
  const histogram = macdLine.map((v, i) => (isNaN(padded[i]) ? NaN : v - padded[i]));
  return { macd: macdLine, signal: padded, histogram };
}

export function bollingerBands(
  prices: number[],
  period = 20,
  stdMult = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = sma(prices, period);
  const upper = middle.map((m, i) => {
    if (isNaN(m)) return NaN;
    const slice = prices.slice(i - period + 1, i + 1);
    const variance = slice.reduce((s, p) => s + (p - m) ** 2, 0) / period;
    return m + stdMult * Math.sqrt(variance);
  });
  const lower = middle.map((m, i) => {
    if (isNaN(m)) return NaN;
    const slice = prices.slice(i - period + 1, i + 1);
    const variance = slice.reduce((s, p) => s + (p - m) ** 2, 0) / period;
    return m - stdMult * Math.sqrt(variance);
  });
  return { upper, middle, lower };
}

export function lastValid(arr: number[]): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (!isNaN(arr[i]) && arr[i] !== null) return arr[i];
  }
  return NaN;
}
