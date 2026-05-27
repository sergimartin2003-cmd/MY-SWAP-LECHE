import { useState, useEffect } from 'react';
import {
  useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt,
} from 'wagmi';
import { encodeFunctionData } from 'viem';
import type { Token } from '../types';
import { NATIVE_ETH } from '../data/tokens';
import {
  SWAP_ROUTER_ADDRESS,    SWAP_ROUTER_ABI,
  NEXSWAP_ROUTER_ADDRESS, NEXSWAP_ROUTER_ABI,
  WETH_ADDRESS,           ERC20_ABI,
  PROTOCOL_FEE_BPS,
} from '../config/uniswap';
import { toTokenUnits, type UniswapQuote } from './useUniswapQuote';

// ── Deadline ──────────────────────────────────────────────────────────────
const DEADLINE_SECONDS = 300; // 5 minutes

// SwapRouter02 multicall ABI — used in direct/fallback mode only
const MULTICALL_ABI = [
  {
    name: 'multicall',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'deadline', type: 'uint256' },
      { name: 'data',     type: 'bytes[]' },
    ],
    outputs: [{ name: 'results', type: 'bytes[]' }],
  },
] as const;

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
  slippage: number;
  quote:    UniswapQuote | null;
  chainId?: number;
}

export function useUniswapSwap({
  tokenIn, tokenOut, amountIn, slippage, quote, chainId = 1,
}: Params) {
  const { address } = useAccount();

  const [status,   setStatus] = useState<SwapStatus>('idle');
  const [errorMsg, setError]  = useState<string | null>(null);

  // Prefer NexSwapRouter when deployed on this chain; fall back to Uniswap directly
  const nexswapRouter = NEXSWAP_ROUTER_ADDRESS[chainId];
  const uniswapRouter = SWAP_ROUTER_ADDRESS[chainId];
  const useOwnRouter  = !!nexswapRouter;
  const routerAddress = (nexswapRouter ?? uniswapRouter) as `0x${string}` | undefined;

  const weth        = WETH_ADDRESS[chainId];
  const isNativeIn  = tokenIn.address  === NATIVE_ETH;
  const isNativeOut = tokenOut.address === NATIVE_ETH;

  /* ── Approval ──────────────────────────────────────────────────────── */
  const {
    writeContract: doApprove,
    data:          approvalHash,
    isPending:     isApprovalPending,
    error:         approvalWriteError,
    reset:         resetApprove,
  } = useWriteContract();

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } =
    useWaitForTransactionReceipt({ hash: approvalHash });

  /* ── Swap ──────────────────────────────────────────────────────────── */
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
  const amountInWei = amountIn ? toTokenUnits(amountIn, tokenIn.decimals ?? 18) : 0n;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address:      tokenIn.address as `0x${string}`,
    abi:          ERC20_ABI,
    functionName: 'allowance',
    args:         address && routerAddress ? [address, routerAddress] : undefined,
    query:        { enabled: !!address && !isNativeIn && !!routerAddress },
  });

  const needsApproval = !isNativeIn && allowance !== undefined && (allowance as bigint) < amountInWei;

  /* ── State watchers ────────────────────────────────────────────────── */
  useEffect(() => {
    if (isApprovalConfirmed) { setStatus('approved'); refetchAllowance(); }
  }, [isApprovalConfirmed, refetchAllowance]);

  useEffect(() => {
    if (isSwapConfirmed) setStatus('success');
  }, [isSwapConfirmed]);

  useEffect(() => {
    if (approvalWriteError && status === 'approving') {
      setStatus('error');
      setError(approvalWriteError.message.split('\n')[0].slice(0, 120));
    }
  }, [approvalWriteError, status]);

  useEffect(() => {
    if (swapWriteError && status === 'swapping') {
      setStatus('error');
      setError(swapWriteError.message.split('\n')[0].slice(0, 120));
    }
  }, [swapWriteError, status]);

  /* ── Approve ───────────────────────────────────────────────────────── */
  const approve = () => {
    if (!address || !routerAddress) return;
    setStatus('approving');
    setError(null);
    doApprove({
      address:      tokenIn.address as `0x${string}`,
      abi:          ERC20_ABI,
      functionName: 'approve',
      // Approve 10× so the user doesn't need to re-approve on every small trade
      args:         [routerAddress, amountInWei * 10n],
    });
  };

  /* ── Execute swap ──────────────────────────────────────────────────── */
  const executeSwap = () => {
    if (!quote || !address || !routerAddress || !weth) return;

    setStatus('swapping');
    setError(null);

    const deadline    = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS);
    const slippageBps = BigInt(Math.round(slippage * 100));
    const feeBps      = BigInt(PROTOCOL_FEE_BPS);

    // ── Path A: NexSwapRouter (on-chain fee collection) ───────────────
    if (useOwnRouter) {
      const effectiveIn  = isNativeIn  ? weth : tokenIn.address  as `0x${string}`;
      const effectiveOut = isNativeOut ? weth : tokenOut.address as `0x${string}`;

      // Our router takes fee from amountIn before forwarding to Uniswap,
      // so Uniswap only sees (amountIn × (1 - fee%)). Adjust amountOutMin
      // to account for the reduced input, then apply slippage on top:
      //   amountOutMin = quote × (1 - fee%) × (1 - slippage%)
      const amountOutMin =
        quote.amountOut * (10000n - feeBps) / 10000n *
        (10000n - slippageBps) / 10000n;

      if (isNativeIn) {
        doSwap({
          address:      nexswapRouter!,
          abi:          NEXSWAP_ROUTER_ABI,
          functionName: 'swapExactETHInput',
          args:         [effectiveOut, quote.feeTier, amountOutMin, deadline],
          value:        amountInWei,
        });
      } else {
        doSwap({
          address:      nexswapRouter!,
          abi:          NEXSWAP_ROUTER_ABI,
          functionName: 'swapExactInput',
          args:         [effectiveIn, effectiveOut, quote.feeTier, amountInWei, amountOutMin, deadline],
        });
      }
      return;
    }

    // ── Path B: Direct Uniswap v3 fallback (fee shown in UI only) ─────
    // Fee tightens amountOutMin so the user at least gets slippage protection
    // that accounts for the effective cost. Fees are NOT collected on-chain here.
    const totalBps     = slippageBps + feeBps;
    const amountOutMin = (quote.amountOut * (10000n - totalBps)) / 10000n;

    const effectiveIn  = isNativeIn  ? weth : tokenIn.address  as `0x${string}`;
    const effectiveOut = isNativeOut ? weth : tokenOut.address as `0x${string}`;

    const swapCallData = encodeFunctionData({
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
    });

    doSwap({
      address:      uniswapRouter as `0x${string}`,
      abi:          MULTICALL_ABI,
      functionName: 'multicall',
      args:         [deadline, [swapCallData]],
      value:        isNativeIn ? amountInWei : 0n,
    });
  };

  /* ── Reset ─────────────────────────────────────────────────────────── */
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
    /** true = fees collected on-chain via NexSwapRouter */
    usingOwnRouter: useOwnRouter,
  };
}
