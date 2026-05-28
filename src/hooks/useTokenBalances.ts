/**
 * Fetch real on-chain token balances for the connected wallet.
 * - Native ETH/MATIC/… via wagmi's useBalance
 * - ERC-20 balances batched with useReadContracts (single RPC round-trip)
 *
 * Returns a map of { [tokenAddress]: humanReadableBalance }
 */
import { useBalance, useReadContracts } from 'wagmi';
import { useMemo } from 'react';
import { TOKENS, NATIVE_ETH } from '../data/tokens';

const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'account', type: 'address' }],
    outputs: [{ name: '',        type: 'uint256' }],
  },
] as const;

export type TokenBalanceMap = Record<string, number>; // address → amount

export function useTokenBalances(
  address: string | undefined,
  chainId:  number,
): TokenBalanceMap {
  const enabled = !!address;

  // ── Native balance (ETH, MATIC, etc.) ─────────────────────────────
  const { data: nativeBalance } = useBalance({
    address: address as `0x${string}` | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chainId: chainId as any,
    query: { enabled, refetchInterval: 15_000 },
  });

  // ── ERC-20 balances (batch) ────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const erc20Tokens = useMemo(() => TOKENS.filter(t => t.address !== NATIVE_ETH), []);

  const { data: erc20Data } = useReadContracts({
    contracts: erc20Tokens.map(token => ({
      address:      token.address as `0x${string}`,
      abi:          ERC20_BALANCE_ABI,
      functionName: 'balanceOf' as const,
      args:         [address as `0x${string}`],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chainId:      chainId as any,
    })),
    query: { enabled, refetchInterval: 30_000 },
  });

  // ── Assemble result map ────────────────────────────────────────────
  const balances: TokenBalanceMap = {};

  // Native asset
  if (nativeBalance) {
    balances[NATIVE_ETH] = parseFloat(nativeBalance.formatted);
  }

  // ERC-20s
  erc20Tokens.forEach((token, idx) => {
    const result = erc20Data?.[idx];
    if (result?.status === 'success' && result.result !== undefined) {
      const raw      = result.result as bigint;
      const decimals = token.decimals ?? 18;
      // Divide as bigint first to stay within safe integer range
      balances[token.address] = Number(raw / BigInt(10 ** decimals)) +
        Number(raw % BigInt(10 ** decimals)) / 10 ** decimals;
    }
  });

  return balances;
}
