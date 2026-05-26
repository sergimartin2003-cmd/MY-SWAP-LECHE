import { useState, useEffect, useCallback } from 'react';
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

  const fetchQuote = useCallback(async () => {
    const num = parseFloat(amountIn);
    if (!amountIn || isNaN(num) || num <= 0 || !publicClient) {
      setQuote(null);
      return;
    }

    const weth       = WETH_ADDRESS[chainId];
    const quoterAddr = QUOTER_V2_ADDRESS[chainId];
    if (!weth || !quoterAddr) { setQuote(null); return; }

    const effectiveIn  = (tokenIn.address  === NATIVE_ETH ? weth : tokenIn.address)  as `0x${string}`;
    const effectiveOut = (tokenOut.address === NATIVE_ETH ? weth : tokenOut.address) as `0x${string}`;
    const amountInWei  = toTokenUnits(amountIn, tokenIn.decimals ?? 18);

    setLoading(true);
    setError(null);

    try {
      // Try all fee tiers in parallel — pick the one with the best output
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
          // out = [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate]
          return { fee, amountOut: out[0], gasEstimate: out[3] };
        }),
      );

      const successes = results
        .filter((r): r is PromiseFulfilledResult<QuoteResult> => r.status === 'fulfilled')
        .map(r => r.value)
        .sort((a, b) => (b.amountOut > a.amountOut ? 1 : -1));

      if (successes.length === 0) {
        throw new Error('No liquidity found for this pair on this network');
      }

      const best        = successes[0];
      const destDec     = tokenOut.decimals ?? 18;
      const formatted   = (Number(best.amountOut) / 10 ** destDec).toFixed(
        destDec > 8 ? 6 : destDec,
      );

      setQuote({
        amountOut:          best.amountOut,
        amountOutFormatted: formatted,
        feeTier:            best.fee,
        gasEstimate:        best.gasEstimate,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Quote failed';
      const isNoise =
        msg.includes('interrupted') ||
        msg.includes('aborted') ||
        msg.includes('timeout') ||
        msg.includes('user rejected');
      if (!isNoise) setError(msg);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [tokenIn, tokenOut, amountIn, chainId, publicClient]);

  useEffect(() => {
    const timer = setTimeout(fetchQuote, 600);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  return { quote, loading, error };
}
