import { createConfig, http } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains';
import { injected, coinbaseWallet, walletConnect, safe } from 'wagmi/connectors';

// ── WalletConnect project ID ─────────────────────────────────────────────
// Get a free project ID at https://cloud.walletconnect.com
const WC_PROJECT_ID = (import.meta.env.VITE_WC_PROJECT_ID as string) || '';

// ── Connectors ────────────────────────────────────────────────────────────
const connectors = [
  injected({ target: 'metaMask' }),    // MetaMask extension
  injected({ target: 'phantom' }),     // Phantom EVM
  injected({ target: 'trust' }),       // Trust Wallet extension
  injected({ target: 'braveWallet' }), // Brave Wallet
  injected(),                          // Rabby, Frame, or any other injected wallet
  coinbaseWallet({ appName: 'NexSwap', preference: 'all' }), // Coinbase + Smart Wallet
  ...(WC_PROJECT_ID
    ? [walletConnect({ projectId: WC_PROJECT_ID, showQrModal: true })]
    : []),                             // WalletConnect (Rainbow, Trust mobile, etc.)
  safe(),                              // Gnosis Safe (auto-hides when not in Safe)
];

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, base],
  connectors,
  transports: {
    [mainnet.id]:  http('https://eth.llamarpc.com'),
    [polygon.id]:  http('https://polygon.llamarpc.com'),
    [arbitrum.id]: http('https://arbitrum.llamarpc.com'),
    [optimism.id]: http('https://optimism.llamarpc.com'),
    [base.id]:     http('https://base.llamarpc.com'),
  },
});

// ── Chain metadata for UI ─────────────────────────────────────────────────
export const CHAIN_META: Record<number, { name: string; color: string; icon: string }> = {
  [mainnet.id]:  { name: 'Ethereum',  color: '#627EEA', icon: '⟠'  },
  [polygon.id]:  { name: 'Polygon',   color: '#8247E5', icon: '⬡'  },
  [arbitrum.id]: { name: 'Arbitrum',  color: '#28A0F0', icon: '▲'  },
  [optimism.id]: { name: 'Optimism',  color: '#FF0420', icon: '🔴' },
  [base.id]:     { name: 'Base',      color: '#0052FF', icon: '🔵' },
};

export const SUPPORTED_CHAINS = [mainnet, polygon, arbitrum, optimism, base] as const;
