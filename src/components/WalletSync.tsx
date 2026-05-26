/**
 * Invisible component that keeps the Zustand store in sync with wagmi.
 * Mount once inside <WagmiProvider>.
 */
import { useEffect, useRef } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useStore } from '../store/useStore';

export default function WalletSync() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const setWalletState = useStore(s => s.setWalletState);
  const setShowPanel   = useStore(s => s.setShowWalletPanel);

  // Track previous connected state so we only close the panel on the
  // initial connection — not on every balance refresh (every 15 s).
  const wasConnected = useRef(false);

  useEffect(() => {
    if (isConnected && address) {
      setWalletState(true, address, parseFloat(balance?.formatted ?? '0'));
      if (!wasConnected.current) {
        setShowPanel(false);   // close panel only when first connecting
        wasConnected.current = true;
      }
    } else {
      setWalletState(false, '', 0);
      wasConnected.current = false;
    }
  }, [isConnected, address, balance, setWalletState, setShowPanel]);

  return null;
}
