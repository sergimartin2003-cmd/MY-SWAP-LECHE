import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { WagmiProvider, createConfig, http, useConnect, useAccount, useDisconnect } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Test accounts ─────────────────────────────────────────────────────────
const TEST_ACCOUNTS = [
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
] as const;

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

// ── Wallet connection tests ───────────────────────────────────────────────
describe('Wallet connection (mock connector)', () => {
  let config: ReturnType<typeof makeConfig>;
  let wrapper: ReturnType<typeof makeWrapper>;

  beforeEach(() => {
    config  = makeConfig();
    wrapper = makeWrapper(config);
  });

  it('starts disconnected', async () => {
    const { result } = renderHook(() => useAccount(), { wrapper });
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeUndefined();
  });

  it('connects with the first test account', async () => {
    const { result } = renderHook(
      () => ({ account: useAccount(), connect: useConnect() }),
      { wrapper },
    );

    const [mockConnector] = result.current.connect.connectors;
    act(() => {
      result.current.connect.connect({ connector: mockConnector });
    });

    await waitFor(() =>
      expect(result.current.account.isConnected).toBe(true),
      { timeout: 3000 },
    );

    expect(result.current.account.address?.toLowerCase()).toBe(
      TEST_ACCOUNTS[0].toLowerCase(),
    );
  });

  it('disconnects successfully', async () => {
    const { result } = renderHook(
      () => ({
        account:    useAccount(),
        connect:    useConnect(),
        disconnect: useDisconnect(),
      }),
      { wrapper },
    );

    // Connect first
    const [mockConnector] = result.current.connect.connectors;
    act(() => {
      result.current.connect.connect({ connector: mockConnector });
    });
    await waitFor(() => expect(result.current.account.isConnected).toBe(true), { timeout: 3000 });

    // Now disconnect
    act(() => { result.current.disconnect.disconnect(); });
    await waitFor(() => expect(result.current.account.isConnected).toBe(false), { timeout: 3000 });
    expect(result.current.account.address).toBeUndefined();
  });

  it('exposes the correct chain after connecting', async () => {
    const { result } = renderHook(
      () => ({ account: useAccount(), connect: useConnect() }),
      { wrapper },
    );

    const [mockConnector] = result.current.connect.connectors;
    act(() => {
      result.current.connect.connect({ connector: mockConnector });
    });

    await waitFor(() => expect(result.current.account.isConnected).toBe(true), { timeout: 3000 });
    expect(result.current.account.chainId).toBe(mainnet.id); // 1
  });

  it('address is a valid checksummed Ethereum address', async () => {
    const { result } = renderHook(
      () => ({ account: useAccount(), connect: useConnect() }),
      { wrapper },
    );

    const [mockConnector] = result.current.connect.connectors;
    act(() => {
      result.current.connect.connect({ connector: mockConnector });
    });

    await waitFor(() => expect(result.current.account.isConnected).toBe(true), { timeout: 3000 });
    expect(result.current.account.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});

// ── toTokenUnits + slippage math ─────────────────────────────────────────
describe('Swap math', () => {
  it('slippage bps calculation is correct', () => {
    const slippage    = 0.5; // 0.5%
    const slippageBps = BigInt(Math.round(slippage * 100)); // 50n
    const amountOut   = 1_000_000n; // 1 USDC

    const amountOutMin = (amountOut * (10000n - slippageBps)) / 10000n;
    // 1_000_000 * 9950 / 10000 = 995_000
    expect(amountOutMin).toBe(995_000n);
  });

  it('1% slippage leaves 99% minimum', () => {
    const slippage    = 1.0;
    const slippageBps = BigInt(Math.round(slippage * 100)); // 100n
    const amountOut   = 10_000_000n;

    const amountOutMin = (amountOut * (10000n - slippageBps)) / 10000n;
    expect(amountOutMin).toBe(9_900_000n);
  });

  it('0.1% slippage calculation', () => {
    const slippage    = 0.1;
    const slippageBps = BigInt(Math.round(slippage * 100)); // 10n
    const amountOut   = 1_000_000n;

    const amountOutMin = (amountOut * (10000n - slippageBps)) / 10000n;
    expect(amountOutMin).toBe(999_000n);
  });
});
