import { useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useStore } from '../store/useStore';

export default function WalletSync() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const setWalletState = useStore(s => s.setWalletState);
  const setShowPanel   = useStore(s => s.setShowWalletPanel);

  useEffect(() => {
    if (isConnected && address) {
      setWalletState(true, address, parseFloat(balance?.formatted ?? '0'));
      setShowPanel(false);
    } else {
      setWalletState(false, '', 0);
    }
  }, [isConnected, address, balance, setWalletState, setShowPanel]);

  return null;
}
