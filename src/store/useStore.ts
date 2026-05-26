import { create } from 'zustand';
import type { Token, TradingPair, GasSpeed } from '../types';
import { TOKENS, TRADING_PAIRS } from '../data/tokens';

interface AppState {
  walletConnected: boolean;
  walletAddress: string;
  walletBalance: number;
  connectWallet: () => void;
  disconnectWallet: () => void;
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
  flipTokens: () => void;
  setSlippage: (slippage: number) => void;
  setGasSpeed: (speed: GasSpeed) => void;
  selectedPair: TradingPair | null;
  setSelectedPair: (pair: TradingPair | null) => void;
  pairs: TradingPair[];
  updatePrices: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export const useStore = create<AppState>((set, get) => ({
  walletConnected: false,
  walletAddress: '',
  walletBalance: 0,
  connectWallet: () => set({
    walletConnected: true,
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    walletBalance: 4.82,
  }),
  disconnectWallet: () => set({
    walletConnected: false,
    walletAddress: '',
    walletBalance: 0,
  }),
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
      const impact = Math.min(numAmount * tokenIn.price / 1000000 * 0.3, 15);
      set({ amountIn: amount, amountOut: (numAmount * rate * (1 - impact / 100)).toFixed(6), priceImpact: impact });
    } else {
      set({ amountIn: amount, amountOut: '', priceImpact: 0 });
    }
  },
  flipTokens: () => set((state) => ({
    tokenIn: state.tokenOut,
    tokenOut: state.tokenIn,
    amountIn: state.amountOut,
    amountOut: state.amountIn,
  })),
  setSlippage: (slippage) => set({ slippage }),
  setGasSpeed: (gasSpeed) => set({ gasSpeed }),
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
  activeTab: 'swap',
  setActiveTab: (tab) => set({ activeTab: tab }),
  notifications: [],
  addNotification: (notification) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ notifications: [...state.notifications, { ...notification, id }] }));
    setTimeout(() => get().removeNotification(id), 5000);
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id),
  })),
}));
