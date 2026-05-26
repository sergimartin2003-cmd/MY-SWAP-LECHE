import { useState, useEffect } from 'react';
import {
  useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt,
} from 'wagmi';
import { encodeFunctionData } from 'viem';
import type { Token } from '../types';
import { NATIVE_ETH } from '../data/tokens';
import {
  SWAP_ROUTER_ADDRESS, SWAP_ROUTER_ABI,
  WETH_ADDRESS, ERC20_ABI,
  PROTOCOL_FEE_BPS,
} from '../config/uniswap';
import { toTokenUnits, type UniswapQuote } from './useUniswapQuote';

// SwapRouter02 multicall — wraps exactInputSingle with a deadline, preventing
// sandwich-attack replays that might execute the swap after prices have moved.
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

// Deadline: 5 minutes from now (standard practice)
const DEADLINE_SECONDS = 300;

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

  /* ── Approval ──────────────────────────────────────────────────── */
  const {
    writeContract: doApprove,
    data:          approvalHash,
    isPending:     isApprovalPending,
    error:         approvalWriteError,
    reset:         resetApprove,
  } = useWriteContract();

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } =
    useWaitForTransactionReceipt({ hash: approvalHash });

  /* ── Swap ──────────────────────────────────────────────────────── */
  const {
    writeContract: doSwap,
    data:          swapHash,
    isPending:     isSwapPending,
    error:         swapWriteError,
    reset:         resetSwapWrite,
  } = useWriteContract();

  const { isLoading: isSwapConfirming, isSuccess: isSwapConfirmed } =
    useWaitForTransactionReceipt({ hash: swapHash });

  /* ── Allowance check ───────────────────────────────────────────── */
  const amountInWei = amountIn ? toTokenUnits(amountIn, tokenIn.decimals ?? 18) : 0n;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address:      tokenIn.address as `0x${string}`,
    abi:          ERC20_ABI,
    functionName: 'allowance',
    args:         address && routerAddress ? [address, routerAddress] : undefined,
    query:        { enabled: !!address && !isNativeIn && !!routerAddress },
  });

  const needsApproval = !isNativeIn && allowance !== undefined && (allowance as bigint) < amountInWei;

  /* ── State watchers ────────────────────────────────────────────── */
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

  /* ── Approve (exact amount — not unlimited) ────────────────────── */
  const approve = () => {
    if (!address || !routerAddress) return;
    setStatus('approving');
    setError(null);
    doApprove({
      address:      tokenIn.address as `0x${string}`,
      abi:          ERC20_ABI,
      functionName: 'approve',
      // Approve 10× the current amount so the user doesn't need to re-approve
      // on every small trade, while still avoiding unlimited (maxUint256) exposure.
      args:         [routerAddress, amountInWei * 10n],
    });
  };

  /* ── Execute swap (via multicall + deadline) ───────────────────── */
  const executeSwap = () => {
    if (!quote || !address || !routerAddress || !weth) return;

    setStatus('swapping');
    setError(null);

    const slippageBps  = BigInt(Math.round(slippage * 100));
    const feeBps       = BigInt(PROTOCOL_FEE_BPS);
    const totalBps     = slippageBps + feeBps;
    const amountOutMin = (quote.amountOut * (10000n - totalBps)) / 10000n;

    const effectiveIn  = isNativeIn  ? weth : tokenIn.address  as `0x${string}`;
    const effectiveOut = isNativeOut ? weth : tokenOut.address as `0x${string}`;

    // Encode the exactInputSingle call for use in multicall
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

    // Wrap in multicall with deadline — protects against MEV sandwich attacks
    const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS);

    doSwap({
      address:      routerAddress,
      abi:          MULTICALL_ABI,
      functionName: 'multicall',
      args:         [deadline, [swapCallData]],
      value:        isNativeIn ? amountInWei : 0n,
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
