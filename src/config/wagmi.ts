import { createConfig, http } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains';
import { injected, coinbaseWallet } from 'wagmi/connectors';

export const SUPPORTED_CHAINS = [mainnet, polygon, arbitrum, optimism, base] as const;

export const CHAIN_META: Record<number, { name: string; color: string; icon: string }> = {
  [mainnet.id]:  { name: 'Ethereum',  color: '#627EEA', icon: '⟠' },
  [polygon.id]:  { name: 'Polygon',   color: '#8247E5', icon: '⬡' },
  [arbitrum.id]: { name: 'Arbitrum',  color: '#28A0F0', icon: '▲' },
  [optimism.id]: { name: 'Optimism',  color: '#FF0420', icon: '🔴' },
  [base.id]:     { name: 'Base',      color: '#0052FF', icon: '🔵' },
};

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, base],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'NexSwap' }),
  ],
  transports: {
    [mainnet.id]:  http('https://eth.llamarpc.com'),
    [polygon.id]:  http('https://polygon.llamarpc.com'),
    [arbitrum.id]: http('https://arbitrum.llamarpc.com'),
    [optimism.id]: http('https://optimism.llamarpc.com'),
    [base.id]:     http('https://base.llamarpc.com'),
  },
});
