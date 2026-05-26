import { useState, useEffect } from 'react';
import {
  useAccount,
  useSendTransaction,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { maxUint256 } from 'viem';
import type { Token } from '../types';
import type { ParaSwapQuote } from './useParaSwapQuote';
import { NATIVE_ETH } from '../data/tokens';

// ParaSwap v5 TokenTransferProxy on mainnet
const TOKEN_TRANSFER_PROXY = '0x216B4B4Ba9F3e719726886d34a177484278Bfcae';
const PARASWAP_BASE        = 'https://apiv5.paraswap.io';

const ERC20_ABI = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner',   type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount',  type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export type SwapStatus =
  | 'idle'
  | 'approving'
  | 'approved'
  | 'swapping'
  | 'success'
  | 'error';

interface UseSwapExecutionParams {
  tokenIn:  Token;
  tokenOut: Token;
  amountIn: string;
  slippage: number;       // e.g. 0.5 (for 0.5%)
  quote:    ParaSwapQuote | null;
  chainId?: number;
}

export function useSwapExecution({
  tokenIn,
  tokenOut,
  amountIn: _amountIn,
  slippage,
  quote,
  chainId = 1,
}: UseSwapExecutionParams) {
  const { address } = useAccount();

  const [status, setStatus]   = useState<SwapStatus>('idle');
  const [errorMsg, setError]  = useState<string | null>(null);

  /* ── Approval ─────────────────────────────────────────────────────── */
  const {
    writeContract: doApprove,
    data: approvalHash,
    isPending: isApprovalPending,
    reset: resetApprove,
  } = useWriteContract();

  const {
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalConfirmed,
  } = useWaitForTransactionReceipt({ hash: approvalHash });

  /* ── Swap transaction ──────────────────────────────────────────────── */
  const {
    sendTransaction,
    data: swapHash,
    isPending: isSwapPending,
    reset: resetSend,
  } = useSendTransaction();

  const {
    isLoading: isSwapConfirming,
    isSuccess: isSwapConfirmed,
  } = useWaitForTransactionReceipt({ hash: swapHash });

  /* ── Allowance check ──────────────────────────────────────────────── */
  const isNativeIn = tokenIn.address === NATIVE_ETH;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address:      tokenIn.address as `0x${string}`,
    abi:          ERC20_ABI,
    functionName: 'allowance',
    args:         address
      ? [address, TOKEN_TRANSFER_PROXY as `0x${string}`]
      : undefined,
    query: { enabled: !!address && !isNativeIn },
  });

  const requiredWei = quote ? BigInt(quote.srcAmount) : 0n;
  const needsApproval =
    !isNativeIn && allowance !== undefined && (allowance as bigint) < requiredWei;

  /* ── State watchers ───────────────────────────────────────────────── */
  useEffect(() => {
    if (isApprovalConfirmed) {
      setStatus('approved');
      refetchAllowance();
    }
  }, [isApprovalConfirmed, refetchAllowance]);

  useEffect(() => {
    if (isSwapConfirmed) setStatus('success');
  }, [isSwapConfirmed]);

  /* ── Handlers ─────────────────────────────────────────────────────── */
  const approve = () => {
    if (!tokenIn.address || !address) return;
    setStatus('approving');
    setError(null);
    doApprove({
      address:      tokenIn.address as `0x${string}`,
      abi:          ERC20_ABI,
      functionName: 'approve',
      args:         [TOKEN_TRANSFER_PROXY as `0x${string}`, maxUint256],
    });
  };

  const executeSwap = async () => {
    if (!quote || !address) return;
    setStatus('swapping');
    setError(null);

    try {
      const res = await fetch(
        `${PARASWAP_BASE}/transactions/${chainId}?ignoreChecks=true`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            srcToken:   tokenIn.address,
            destToken:  tokenOut.address,
            srcDecimals: tokenIn.decimals  ?? 18,
            destDecimals:tokenOut.decimals ?? 18,
            srcAmount:  quote.srcAmount,
            destAmount: quote.destAmount,
            priceRoute: quote.priceRoute,
            userAddress: address,
            slippage:   Math.round(slippage * 100),   // 0.5% → 50
            partner:    'NexSwap',
          }),
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `HTTP ${res.status}`);
      }

      const txData = await res.json();

      sendTransaction({
        to:    txData.to   as `0x${string}`,
        data:  txData.data as `0x${string}`,
        value: BigInt(txData.value ?? 0),
        gas:   txData.gas ? BigInt(txData.gas) : undefined,
      });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Swap failed');
    }
  };

  const reset = () => {
    setStatus('idle');
    setError(null);
    resetApprove();
    resetSend();
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
