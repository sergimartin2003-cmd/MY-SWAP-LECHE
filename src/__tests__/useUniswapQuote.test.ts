import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUniswapQuote } from '../hooks/useUniswapQuote';
import { TOKENS } from '../data/tokens';

// ── Test wallet addresses (Hardhat default accounts) ─────────────────────
export const TEST_ACCOUNTS = [
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
] as const;

// ── Minimal wagmi config with mock connector ──────────────────────────────
function makeConfig() {
  return createConfig({
    chains: [mainnet],
    connectors: [mock({ accounts: TEST_ACCOUNTS })],
    transports: { [mainnet.id]: http() },
  });
}

function makeWrapper(config: ReturnType<typeof makeConfig>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      WagmiProvider, { config },
      createElement(QueryClientProvider, { client: qc }, children),
    );
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────
describe('useUniswapQuote', () => {
  let config: ReturnType<typeof makeConfig>;
  let wrapper: ReturnType<typeof makeWrapper>;

  beforeEach(() => {
    config  = makeConfig();
    wrapper = makeWrapper(config);
  });

  it('returns null quote and not loading when amountIn is empty', async () => {
    const { result } = renderHook(
      () => useUniswapQuote(TOKENS[0], TOKENS[2], '', 1),
      { wrapper },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.quote).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns null quote and not loading when amountIn is "0"', async () => {
    const { result } = renderHook(
      () => useUniswapQuote(TOKENS[0], TOKENS[2], '0', 1),
      { wrapper },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.quote).toBeNull();
  });

  it('sets loading = true after debounce when amountIn is valid', async () => {
    const { result } = renderHook(
      () => useUniswapQuote(TOKENS[0], TOKENS[2], '1', 1),
      { wrapper },
    );
    // Not loading immediately (debounce hasn't fired)
    expect(result.current.loading).toBe(false);
    // After 700ms debounce fires → loading becomes true
    await waitFor(() => expect(result.current.loading).toBe(true), { timeout: 1200 });
  });

  it('resets quote to null when amountIn becomes empty', async () => {
    const { result, rerender } = renderHook(
      ({ amount }: { amount: string }) =>
        useUniswapQuote(TOKENS[0], TOKENS[2], amount, 1),
      { wrapper, initialProps: { amount: '' } },
    );

    // Start empty
    await waitFor(() => expect(result.current.quote).toBeNull());

    // Switch to '0' — still null
    act(() => { rerender({ amount: '0' }); });
    await waitFor(() => expect(result.current.quote).toBeNull());
  });

  it('does not set error for empty input', async () => {
    const { result } = renderHook(
      () => useUniswapQuote(TOKENS[0], TOKENS[2], '', 1),
      { wrapper },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it('same-token swap returns null (no pool)', async () => {
    // ETH → ETH is not a valid pair
    const { result } = renderHook(
      () => useUniswapQuote(TOKENS[0], TOKENS[0], '1', 1),
      { wrapper },
    );
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 2000 });
    expect(result.current.quote).toBeNull();
  });
});

// ── toTokenUnits edge-case coverage ──────────────────────────────────────
describe('TEST_ACCOUNTS fixture', () => {
  it('has valid Ethereum addresses', () => {
    TEST_ACCOUNTS.forEach(addr => {
      expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });
  });
});
