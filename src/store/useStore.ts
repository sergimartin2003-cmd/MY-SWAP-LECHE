import { create } from 'zustand';
import type { Token, TradingPair, GasSpeed } from '../types';
import { TOKENS, TRADING_PAIRS } from '../data/tokens';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface AppState {
  // Wallet (synced from wagmi via WalletSync component)
  walletConnected: boolean;
  walletAddress: string;
  walletBalance: number;
  setWalletState: (connected: boolean, address: string, balance?: number) => void;

  // Wallet panel
  showWalletPanel: boolean;
  setShowWalletPanel: (show: boolean) => void;
  connectWallet: () => void;        // opens the panel
  disconnectWallet: () => void;     // wagmi disconnect called separately

  // Swap
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOut: string;
  slippage: number;
  gasSpeed: GasSpeed;
  priceImpact: number;
  setTokenIn: (token: Token) => void;
  setTokenOut: (token: Token) => void;
  setAmountIn: (amount: string) => void;
  setAmountOut: (amount: string) => void;
  flipTokens: () => void;
  setSlippage: (slippage: number) => void;
  setGasSpeed: (speed: GasSpeed) => void;

  // Markets
  selectedPair: TradingPair | null;
  setSelectedPair: (pair: TradingPair | null) => void;
  pairs: TradingPair[];
  updatePrices: () => void;

  // UI
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Wallet
  walletConnected: false,
  walletAddress: '',
  walletBalance: 0,
  setWalletState: (connected, address, balance = 0) =>
    set({ walletConnected: connected, walletAddress: address, walletBalance: balance }),

  // Wallet panel
  showWalletPanel: false,
  setShowWalletPanel: (show) => set({ showWalletPanel: show }),
  connectWallet: () => set({ showWalletPanel: true }),
  disconnectWallet: () => set({ walletConnected: false, walletAddress: '', walletBalance: 0 }),

  // Swap
  tokenIn: TOKENS[0],
  tokenOut: TOKENS[2],
  amountIn: '',
  amountOut: '',
  slippage: 0.5,
  gasSpeed: 'standard',
  priceImpact: 0,
  setTokenIn: (token) => set({ tokenIn: token }),
  setTokenOut: (token) => set({ tokenOut: token }),
  setAmountIn: (amount) => {
    const { tokenIn, tokenOut } = get();
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      const rate = tokenIn.price / tokenOut.price;
      const impact = Math.min(numAmount * tokenIn.price / 1_000_000 * 0.3, 15);
      set({ amountIn: amount, amountOut: (numAmount * rate * (1 - impact / 100)).toFixed(6), priceImpact: impact });
    } else {
      set({ amountIn: amount, amountOut: '', priceImpact: 0 });
    }
  },
  setAmountOut: (amount) => set({ amountOut: amount }),
  flipTokens: () => set((state) => ({
    tokenIn: state.tokenOut,
    tokenOut: state.tokenIn,
    amountIn: state.amountOut,
    amountOut: state.amountIn,
  })),
  setSlippage: (slippage) => set({ slippage }),
  setGasSpeed: (gasSpeed) => set({ gasSpeed }),

  // Markets
  selectedPair: null,
  setSelectedPair: (pair) => set({ selectedPair: pair }),
  pairs: TRADING_PAIRS,
  updatePrices: () => set((state) => ({
    pairs: state.pairs.map(pair => {
      const change = (Math.random() - 0.49) * pair.price * 0.002;
      const newPrice = Math.max(pair.price + change, 0.0001);
      const newChange24h = pair.change24h + (Math.random() - 0.5) * 0.1;
      return { ...pair, price: newPrice, change24h: newChange24h };
    }),
  })),

  // UI
  activeTab: 'swap',
  setActiveTab: (tab) => set({ activeTab: tab }),
  notifications: [],
  addNotification: (notification) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ notifications: [...state.notifications, { ...notification, id }] }));
    setTimeout(() => get().removeNotification(id), 6000);
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id),
  })),
}));
