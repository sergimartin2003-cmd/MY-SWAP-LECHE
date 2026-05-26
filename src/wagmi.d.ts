import type { wagmiConfig } from './config/wagmi';

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
