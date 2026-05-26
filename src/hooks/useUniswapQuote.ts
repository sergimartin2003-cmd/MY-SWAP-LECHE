import { useState, useEffect, useCallback, useRef } from 'react';
import { usePublicClient } from 'wagmi';
import type { Token } from '../types';
import { NATIVE_ETH } from '../data/tokens';
import {
  QUOTER_V2_ADDRESS, QUOTER_V2_ABI,
  WETH_ADDRESS, FEE_TIERS, type FeeTier,
} from '../config/uniswap';

export interface UniswapQuote {
  amountOut:          bigint;
  amountOutFormatted: string;
  feeTier:            FeeTier;
  gasEstimate:        bigint;
}

/** Convert human-readable amount string → raw BigInt (safe, no float math). */
export function toTokenUnits(amount: string, decimals: number): bigint {
  const [int = '0', frac = ''] = amount.split('.');
  const padded = frac.padEnd(decimals, '0').slice(0, decimals);
  const raw    = (int.replace(/^0+/, '') || '0') + padded;
  return BigInt(raw || '0');
}

export function useUniswapQuote(
  tokenIn:  Token,
  tokenOut: Token,
  amountIn: string,
  chainId   = 1,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const publicClient = usePublicClient({ chainId: chainId as any });

  const [quote,   setQuote]   = useState<UniswapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Monotonically-increasing counter — stale async results check this
  // before updating state (poor-man's AbortController for eth_call batches)
  const reqIdRef = useRef(0);

  const fetchQuote = useCallback(async () => {
    const num = parseFloat(amountIn);
    if (!amountIn || isNaN(num) || num <= 0 || !publicClient) {
      setQuote(null);
      setLoading(false);
      return;
    }

    const weth       = WETH_ADDRESS[chainId];
    const quoterAddr = QUOTER_V2_ADDRESS[chainId];
    if (!weth || !quoterAddr) { setQuote(null); return; }

    const effectiveIn  = (tokenIn.address  === NATIVE_ETH ? weth : tokenIn.address)  as `0x${string}`;
    const effectiveOut = (tokenOut.address === NATIVE_ETH ? weth : tokenOut.address) as `0x${string}`;
    const amountInWei  = toTokenUnits(amountIn, tokenIn.decimals ?? 18);

    // Stamp this request; any response that arrives after a newer request
    // has started will be discarded, preventing stale-closure overwrites
    const currentId = ++reqIdRef.current;

    setLoading(true);
    setError(null);

    try {
      type QuoteResult = { fee: FeeTier; amountOut: bigint; gasEstimate: bigint };

      const results = await Promise.allSettled(
        FEE_TIERS.map(async (fee): Promise<QuoteResult> => {
          const out = await publicClient.readContract({
            address:      quoterAddr,
            abi:          QUOTER_V2_ABI,
            functionName: 'quoteExactInputSingle',
            args: [{
              tokenIn:           effectiveIn,
              tokenOut:          effectiveOut,
              amountIn:          amountInWei,
              fee,
              sqrtPriceLimitX96: 0n,
            }],
          });
          return { fee, amountOut: out[0], gasEstimate: out[3] };
        }),
      );

      // Discard if a newer request is in flight
      if (currentId !== reqIdRef.current) return;

      const successes = results
        .filter((r): r is PromiseFulfilledResult<QuoteResult> => r.status === 'fulfilled')
        .map(r => r.value)
        .sort((a, b) => (b.amountOut > a.amountOut ? 1 : -1));

      if (successes.length === 0) throw new Error('No liquidity found for this pair on this network');

      const best      = successes[0];
      const destDec   = tokenOut.decimals ?? 18;
      const formatted = (Number(best.amountOut) / 10 ** destDec).toFixed(destDec > 8 ? 6 : destDec);

      setQuote({ amountOut: best.amountOut, amountOutFormatted: formatted, feeTier: best.fee, gasEstimate: best.gasEstimate });
    } catch (err) {
      if (currentId !== reqIdRef.current) return;
      const msg = err instanceof Error ? err.message : 'Quote failed';
      const isNoise =
        msg.includes('interrupted') || msg.includes('aborted') ||
        msg.includes('timeout')     || msg.includes('user rejected') ||
        msg.includes('signal');
      if (!isNoise) setError(msg);
      setQuote(null);
    } finally {
      if (currentId === reqIdRef.current) setLoading(false);
    }
  }, [tokenIn, tokenOut, amountIn, chainId, publicClient]);

  useEffect(() => {
    // Clear previous quote immediately when inputs change (no stale display)
    setQuote(null);
    setError(null);

    const num = parseFloat(amountIn);
    if (!amountIn || isNaN(num) || num <= 0) { setLoading(false); return; }

    const timer = setTimeout(fetchQuote, 600);
    return () => clearTimeout(timer);
  }, [fetchQuote, amountIn]);

  return { quote, loading, error };
}
