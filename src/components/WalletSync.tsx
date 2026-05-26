/**
 * Invisible component that keeps the Zustand store in sync with wagmi.
 * Mount once inside <WagmiProvider>.
 *
 * - Syncs connect/disconnect state
 * - Populates real on-chain token balances via useTokenBalances
 */
import { useEffect, useRef } from 'react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { useStore } from '../store/useStore';
import { useTokenBalances } from '../hooks/useTokenBalances';

export default function WalletSync() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Native balance for the wallet summary card
  const { data: nativeBalance } = useBalance({ address });

  // Real on-chain balances for every token in the list
  const tokenBalances = useTokenBalances(isConnected ? address : undefined, chainId);

  const setWalletState    = useStore(s => s.setWalletState);
  const setTokenBalances  = useStore(s => s.setTokenBalances);
  const setShowPanel      = useStore(s => s.setShowWalletPanel);

  // Close the wallet panel only on the FIRST connection,
  // not on every balance refresh (prevents panel closing every 15 s).
  const wasConnected = useRef(false);

  // Sync connect/disconnect + native balance
  useEffect(() => {
    if (isConnected && address) {
      setWalletState(true, address, parseFloat(nativeBalance?.formatted ?? '0'));
      if (!wasConnected.current) {
        setShowPanel(false);
        wasConnected.current = true;
      }
    } else {
      setWalletState(false, '', 0);
      setTokenBalances({});
      wasConnected.current = false;
    }
  }, [isConnected, address, nativeBalance, setWalletState, setShowPanel, setTokenBalances]);

  // Push real token balances into the store whenever they update
  useEffect(() => {
    if (isConnected && Object.keys(tokenBalances).length > 0) {
      setTokenBalances(tokenBalances);
    }
  }, [isConnected, tokenBalances, setTokenBalances]);

  return null;
}
