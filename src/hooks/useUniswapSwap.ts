import { useState, useEffect } from 'react';
import {
  useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt,
} from 'wagmi';
import { maxUint256 } from 'viem';
import type { Token } from '../types';
import { NATIVE_ETH } from '../data/tokens';
import {
  SWAP_ROUTER_ADDRESS, SWAP_ROUTER_ABI,
  WETH_ADDRESS, ERC20_ABI,
  PROTOCOL_FEE_BPS,
} from '../config/uniswap';
import { toTokenUnits, type UniswapQuote } from './useUniswapQuote';

export type SwapStatus =
  | 'idle'
  | 'approving'
  | 'approved'
  | 'swapping'
  | 'success'
  | 'error';

interface Params {
  tokenIn:  Token;
  tokenOut: Token;
  amountIn: string;
  slippage: number; // e.g. 0.5 for 0.5%
  quote:    UniswapQuote | null;
  chainId?: number;
}

export function useUniswapSwap({
  tokenIn, tokenOut, amountIn, slippage, quote, chainId = 1,
}: Params) {
  const { address } = useAccount();

  const [status,   setStatus] = useState<SwapStatus>('idle');
  const [errorMsg, setError]  = useState<string | null>(null);

  const routerAddress = SWAP_ROUTER_ADDRESS[chainId];
  const weth          = WETH_ADDRESS[chainId];
  const isNativeIn    = tokenIn.address  === NATIVE_ETH;
  const isNativeOut   = tokenOut.address === NATIVE_ETH;

  /* ── Approval ─────────────────────────────────────────────────────── */
  const {
    writeContract: doApprove,
    data:          approvalHash,
    isPending:     isApprovalPending,
    error:         approvalWriteError,
    reset:         resetApprove,
  } = useWriteContract();

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } =
    useWaitForTransactionReceipt({ hash: approvalHash });

  /* ── Swap ─────────────────────────────────────────────────────────── */
  const {
    writeContract: doSwap,
    data:          swapHash,
    isPending:     isSwapPending,
    error:         swapWriteError,
    reset:         resetSwapWrite,
  } = useWriteContract();

  const { isLoading: isSwapConfirming, isSuccess: isSwapConfirmed } =
    useWaitForTransactionReceipt({ hash: swapHash });

  /* ── Allowance check ───────────────────────────────────────────────── */
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address:      tokenIn.address as `0x${string}`,
    abi:          ERC20_ABI,
    functionName: 'allowance',
    args:         address && routerAddress ? [address, routerAddress] : undefined,
    query:        { enabled: !!address && !isNativeIn && !!routerAddress },
  });

  const amountInWei   = amountIn ? toTokenUnits(amountIn, tokenIn.decimals ?? 18) : 0n;
  const needsApproval = !isNativeIn && allowance !== undefined && (allowance as bigint) < amountInWei;

  /* ── State watchers ───────────────────────────────────────────────── */
  useEffect(() => {
    if (isApprovalConfirmed) { setStatus('approved'); refetchAllowance(); }
  }, [isApprovalConfirmed, refetchAllowance]);

  useEffect(() => {
    if (isSwapConfirmed) setStatus('success');
  }, [isSwapConfirmed]);

  useEffect(() => {
    if (approvalWriteError && status === 'approving') {
      setStatus('error');
      setError(approvalWriteError.message.split('\n')[0].slice(0, 100));
    }
  }, [approvalWriteError, status]);

  useEffect(() => {
    if (swapWriteError && status === 'swapping') {
      setStatus('error');
      setError(swapWriteError.message.split('\n')[0].slice(0, 100));
    }
  }, [swapWriteError, status]);

  /* ── Approve ──────────────────────────────────────────────────────── */
  const approve = () => {
    if (!address || !routerAddress) return;
    setStatus('approving');
    setError(null);
    doApprove({
      address:      tokenIn.address as `0x${string}`,
      abi:          ERC20_ABI,
      functionName: 'approve',
      args:         [routerAddress, maxUint256],
    });
  };

  /* ── Execute swap ─────────────────────────────────────────────────── */
  const executeSwap = () => {
    if (!quote || !address || !routerAddress || !weth) return;

    setStatus('swapping');
    setError(null);

    const slippageBps  = BigInt(Math.round(slippage * 100));
    const feeBps       = BigInt(PROTOCOL_FEE_BPS);
    // Tighten amountOutMin by both slippage tolerance AND platform fee
    const totalBps     = slippageBps + feeBps;
    const amountOutMin = (quote.amountOut * (10000n - totalBps)) / 10000n;

    // Route native ETH through WETH
    const effectiveIn  = isNativeIn  ? weth : tokenIn.address  as `0x${string}`;
    const effectiveOut = isNativeOut ? weth : tokenOut.address as `0x${string}`;

    doSwap({
      address:      routerAddress,
      abi:          SWAP_ROUTER_ABI,
      functionName: 'exactInputSingle',
      args: [{
        tokenIn:           effectiveIn,
        tokenOut:          effectiveOut,
        fee:               quote.feeTier,
        recipient:         address,
        amountIn:          amountInWei,
        amountOutMinimum:  amountOutMin,
        sqrtPriceLimitX96: 0n,
      }],
      value: isNativeIn ? amountInWei : 0n,
    });
  };

  const reset = () => {
    setStatus('idle');
    setError(null);
    resetApprove();
    resetSwapWrite();
  };

  const isLoading =
    isApprovalPending || isApprovalConfirming || isSwapPending || isSwapConfirming;

  return {
    status,
    needsApproval,
    isLoading,
    errorMsg,
    approvalHash,
    swapHash,
    approve,
    executeSwap,
    reset,
  };
}
