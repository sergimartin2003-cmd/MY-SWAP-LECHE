import { useState, useEffect, useCallback } from 'react';
import type { Token } from '../types';
import { NATIVE_ETH } from '../data/tokens';

export interface ParaSwapQuote {
  srcAmount: string;        // in smallest units (wei)
  destAmount: string;       // in smallest units
  destAmountFormatted: string; // human-readable
  gasCostUSD: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  priceRoute: any;          // full priceRoute object for tx building
}

const PARASWAP_BASE = 'https://apiv5.paraswap.io';

/** Convert a human-readable amount to token units (as string), safe for BigInt. */
function toTokenUnits(amount: string, decimals: number): string {
  const [integer = '0', fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  const raw = integer.replace(/^0+/, '') + paddedFraction;
  return raw || '0';
}

export function useParaSwapQuote(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  chainId = 1,
) {
  const [quote, setQuote]     = useState<ParaSwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    const num = parseFloat(amountIn);
    if (!amountIn || isNaN(num) || num <= 0) {
      setQuote(null);
      return;
    }

    const srcToken  = tokenIn.address  === NATIVE_ETH ? NATIVE_ETH : tokenIn.address;
    const destToken = tokenOut.address === NATIVE_ETH ? NATIVE_ETH : tokenOut.address;

    if (!srcToken || !destToken) { setQuote(null); return; }

    setLoading(true);
    setError(null);

    try {
      const srcDecimals  = tokenIn.decimals  ?? 18;
      const destDecimals = tokenOut.decimals ?? 18;
      const amountWei    = toTokenUnits(amountIn, srcDecimals);

      const url = [
        `${PARASWAP_BASE}/prices`,
        `?srcToken=${srcToken}`,
        `&destToken=${destToken}`,
        `&amount=${amountWei}`,
        `&srcDecimals=${srcDecimals}`,
        `&destDecimals=${destDecimals}`,
        `&side=SELL`,
        `&network=${chainId}`,
        `&partner=NexSwap`,
      ].join('');

      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const pr = data.priceRoute;
      const destFormatted = (
        parseInt(pr.destAmount, 10) / 10 ** destDecimals
      ).toFixed(destDecimals > 6 ? 6 : destDecimals);

      setQuote({
        srcAmount: pr.srcAmount,
        destAmount: pr.destAmount,
        destAmountFormatted: destFormatted,
        gasCostUSD: pr.gasCostUSD ?? '?',
        priceRoute: pr,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Quote failed';
      // Swallow expected non-errors: network issues, CORS in dev, timeouts, user aborts
      const isSilent =
        msg.includes('Failed to fetch') ||
        msg.includes('abort') ||
        msg.includes('timed out') ||
        msg.includes('Load failed') ||    // Safari network error
        msg.includes('NetworkError') ||
        msg === 'signal timed out';
      if (!isSilent) setError(msg);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [tokenIn, tokenOut, amountIn, chainId]);

  useEffect(() => {
    const timer = setTimeout(fetchQuote, 600);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  return { quote, loading, error };
}
