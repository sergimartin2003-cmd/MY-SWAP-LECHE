export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoUrl: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  balance?: number;
}

export interface TradingPair {
  id: string;
  baseToken: Token;
  quoteToken: Token;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  tvl: number;
  high24h: number;
  low24h: number;
  priceHistory: PricePoint[];
}

export interface PricePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Pool {
  id: string;
  token0: Token;
  token1: Token;
  apr: number;
  tvl: number;
  volume24h: number;
  feeTier: number;
  myLiquidity?: number;
}

export interface Transaction {
  hash: string;
  type: 'swap' | 'add' | 'remove';
  tokenIn: Token;
  tokenOut: Token;
  amountIn: number;
  amountOut: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: number;
}

export type TimeFrame = '1H' | '4H' | '1D' | '1W' | '1M';
export type ChartType = 'line' | 'candlestick';
export type GasSpeed = 'slow' | 'standard' | 'fast' | 'instant';
