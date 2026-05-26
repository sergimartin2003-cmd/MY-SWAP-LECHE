import type { Token, TradingPair, Pool, Transaction, PricePoint } from '../types';

const generatePriceHistory = (basePrice: number, points = 168): PricePoint[] => {
  const now = Date.now(); const history: PricePoint[] = []; let price = basePrice * 0.85;
  for (let i = points; i >= 0; i--) {
    const change = (Math.random() - 0.48) * price * 0.03; const open = price;
    price = Math.max(price + change, basePrice * 0.1);
    const high = Math.max(open, price) * (1 + Math.random() * 0.01);
    const low  = Math.min(open, price) * (1 - Math.random() * 0.01);
    history.push({ time: now - i * 3600000, open, high, low, close: price, volume: Math.random() * basePrice * 1000000 });
  }
  return history;
};

export const NATIVE_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const TOKENS: Token[] = [
  { symbol: 'ETH',   name: 'Ethereum',       address: NATIVE_ETH,                                        decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',              price: 3842.15,  change24h:  2.34, volume24h: 15200000000, marketCap: 462000000000,  balance: 1.5 },
  { symbol: 'WBTC',  name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',      decimals: 8,  logoUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',                 price: 67450.20, change24h:  1.87, volume24h: 28400000000, marketCap: 1320000000000, balance: 0.05 },
  { symbol: 'USDC',  name: 'USD Coin',        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',      decimals: 6,  logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',       price: 1.0002,   change24h:  0.01, volume24h:  5600000000, marketCap:  44000000000,  balance: 2500 },
  { symbol: 'USDT',  name: 'Tether',          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',      decimals: 6,  logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',                price: 0.9998,   change24h: -0.02, volume24h: 48000000000, marketCap: 110000000000,  balance: 1200 },
  { symbol: 'UNI',   name: 'Uniswap',         address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',        price: 12.45,    change24h: -3.21, volume24h:   320000000, marketCap:   9400000000,  balance: 80 },
  { symbol: 'LINK',  name: 'Chainlink',       address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',    price: 18.72,    change24h:  4.56, volume24h:   890000000, marketCap:  11000000000,  balance: 45 },
  { symbol: 'AAVE',  name: 'Aave',            address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',               price: 186.30,   change24h:  5.12, volume24h:   450000000, marketCap:   2800000000,  balance: 5 },
  { symbol: 'MKR',   name: 'Maker',           address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png',          price: 2341.80,  change24h: -1.44, volume24h:   120000000, marketCap:   2300000000,  balance: 0.5 },
  { symbol: 'CRV',   name: 'Curve',           address: '0xD533a949740bb3306d119CC777fa900bA034cd52',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/12124/small/Curve.png',              price: 0.68,     change24h: -2.78, volume24h:    95000000, marketCap:    880000000,  balance: 1500 },
  { symbol: 'SNX',   name: 'Synthetix',       address: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/3406/small/SNX.png',                price: 3.24,     change24h:  7.89, volume24h:    68000000, marketCap:   1100000000,  balance: 200 },
  { symbol: 'COMP',  name: 'Compound',        address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/10775/small/COMP.png',              price: 54.20,    change24h:  3.33, volume24h:    45000000, marketCap:    420000000,  balance: 10 },
  { symbol: 'BAL',   name: 'Balancer',        address: '0xba100000625a3754423978a60c9317c58a424e3D',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/11683/small/Balancer.png',           price: 3.45,     change24h: -4.20, volume24h:    22000000, marketCap:    210000000,  balance: 120 },
  { symbol: 'SUSHI', name: 'SushiSwap',       address: '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png', price: 1.28,    change24h:  2.11, volume24h:    55000000, marketCap:    310000000,  balance: 500 },
  { symbol: 'YFI',   name: 'Yearn Finance',   address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/11849/small/yfi-192x192.png',        price: 8920.00,  change24h: -0.88, volume24h:    35000000, marketCap:    330000000,  balance: 0.02 },
  { symbol: 'MATIC', name: 'Polygon',         address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',    price: 0.895,    change24h:  6.44, volume24h:   720000000, marketCap:   8800000000,  balance: 3200 },
  { symbol: 'ARB',   name: 'Arbitrum',        address: '0x912CE59144191C1204E64559FE8253a0e49E6548',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg', price: 1.12, change24h: 8.33, volume24h: 380000000, marketCap: 2900000000, balance: 450 },
  { symbol: 'OP',    name: 'Optimism',        address: '0x4200000000000000000000000000000000000042',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',           price: 2.48,     change24h:  5.67, volume24h:   290000000, marketCap:   2600000000,  balance: 180 },
  { symbol: 'LDO',   name: 'Lido DAO',        address: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/13573/small/Lido_DAO.png',           price: 2.21,     change24h: -1.23, volume24h:   125000000, marketCap:   1980000000,  balance: 300 },
  { symbol: 'RPL',   name: 'Rocket Pool',     address: '0xD33526068D116cE69F19A9ee46F0bd304F21A51f',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/2090/small/rocket_pool__RPL__200_200.png', price: 26.40, change24h: 3.78, volume24h: 42000000, marketCap: 590000000, balance: 15 },
  { symbol: 'DAI',   name: 'Dai',             address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',      decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',           price: 1.0001,   change24h:  0.00, volume24h:  1200000000, marketCap:   5400000000,  balance: 800 },
];

export const TRADING_PAIRS: TradingPair[] = [
  { id: 'eth-usdc',   baseToken: TOKENS[0],  quoteToken: TOKENS[2],  price: 3842.15,  change24h: 2.34,  volume24h: 8200000000,  liquidity: 450000000,  tvl: 920000000,  high24h: 3901.20,  low24h: 3755.80,  priceHistory: generatePriceHistory(3842) },
  { id: 'btc-usdc',   baseToken: TOKENS[1],  quoteToken: TOKENS[2],  price: 67450.20, change24h: 1.87,  volume24h: 12000000000, liquidity: 1200000000, tvl: 2400000000, high24h: 68200.00, low24h: 66100.00, priceHistory: generatePriceHistory(67450) },
  { id: 'eth-btc',    baseToken: TOKENS[0],  quoteToken: TOKENS[1],  price: 0.05697,  change24h: 0.46,  volume24h: 1100000000,  liquidity: 320000000,  tvl: 640000000,  high24h: 0.0578,   low24h: 0.0562,   priceHistory: generatePriceHistory(0.057) },
  { id: 'uni-eth',    baseToken: TOKENS[4],  quoteToken: TOKENS[0],  price: 0.003241, change24h: -5.43, volume24h: 185000000,   liquidity: 48000000,   tvl: 96000000,   high24h: 0.00348,  low24h: 0.00319,  priceHistory: generatePriceHistory(0.00324) },
  { id: 'link-eth',   baseToken: TOKENS[5],  quoteToken: TOKENS[0],  price: 0.004872, change24h: 2.18,  volume24h: 320000000,   liquidity: 72000000,   tvl: 145000000,  high24h: 0.00502,  low24h: 0.00475,  priceHistory: generatePriceHistory(0.00487) },
  { id: 'aave-eth',   baseToken: TOKENS[6],  quoteToken: TOKENS[0],  price: 0.04849,  change24h: 2.70,  volume24h: 210000000,   liquidity: 38000000,   tvl: 76000000,   high24h: 0.0498,   low24h: 0.0471,   priceHistory: generatePriceHistory(0.0485) },
  { id: 'matic-usdc', baseToken: TOKENS[14], quoteToken: TOKENS[2],  price: 0.895,    change24h: 6.44,  volume24h: 420000000,   liquidity: 95000000,   tvl: 190000000,  high24h: 0.932,    low24h: 0.841,    priceHistory: generatePriceHistory(0.895) },
  { id: 'arb-usdc',   baseToken: TOKENS[15], quoteToken: TOKENS[2],  price: 1.12,     change24h: 8.33,  volume24h: 195000000,   liquidity: 42000000,   tvl: 84000000,   high24h: 1.19,     low24h: 1.03,     priceHistory: generatePriceHistory(1.12) },
  { id: 'op-usdc',    baseToken: TOKENS[16], quoteToken: TOKENS[2],  price: 2.48,     change24h: 5.67,  volume24h: 168000000,   liquidity: 38000000,   tvl: 76000000,   high24h: 2.62,     low24h: 2.34,     priceHistory: generatePriceHistory(2.48) },
  { id: 'ldo-eth',    baseToken: TOKENS[17], quoteToken: TOKENS[0],  price: 0.000575, change24h: -3.45, volume24h: 88000000,    liquidity: 22000000,   tvl: 44000000,   high24h: 0.000601, low24h: 0.000559, priceHistory: generatePriceHistory(0.000575) },
  { id: 'crv-usdc',   baseToken: TOKENS[8],  quoteToken: TOKENS[2],  price: 0.68,     change24h: -2.78, volume24h: 55000000,    liquidity: 18000000,   tvl: 36000000,   high24h: 0.712,    low24h: 0.661,    priceHistory: generatePriceHistory(0.68) },
  { id: 'snx-eth',    baseToken: TOKENS[9],  quoteToken: TOKENS[0],  price: 0.000843, change24h: 5.34,  volume24h: 42000000,    liquidity: 14000000,   tvl: 28000000,   high24h: 0.000885, low24h: 0.000801, priceHistory: generatePriceHistory(0.000843) },
];

export const POOLS: Pool[] = [
  { id: 'pool-eth-usdc',   token0: TOKENS[0],  token1: TOKENS[2],  apr: 24.5, tvl: 920000000,  volume24h: 8200000000,  feeTier: 0.05, myLiquidity: 1250 },
  { id: 'pool-btc-usdc',   token0: TOKENS[1],  token1: TOKENS[2],  apr: 18.2, tvl: 2400000000, volume24h: 12000000000, feeTier: 0.05, myLiquidity: 0 },
  { id: 'pool-eth-btc',    token0: TOKENS[0],  token1: TOKENS[1],  apr: 15.8, tvl: 640000000,  volume24h: 1100000000,  feeTier: 0.3,  myLiquidity: 500 },
  { id: 'pool-uni-eth',    token0: TOKENS[4],  token1: TOKENS[0],  apr: 42.1, tvl: 96000000,   volume24h: 185000000,   feeTier: 0.3,  myLiquidity: 0 },
  { id: 'pool-link-eth',   token0: TOKENS[5],  token1: TOKENS[0],  apr: 38.6, tvl: 145000000,  volume24h: 320000000,   feeTier: 0.3,  myLiquidity: 0 },
  { id: 'pool-matic-usdc', token0: TOKENS[14], token1: TOKENS[2],  apr: 55.3, tvl: 190000000,  volume24h: 420000000,   feeTier: 0.3,  myLiquidity: 0 },
  { id: 'pool-arb-usdc',   token0: TOKENS[15], token1: TOKENS[2],  apr: 67.8, tvl: 84000000,   volume24h: 195000000,   feeTier: 1.0,  myLiquidity: 0 },
  { id: 'pool-usdc-usdt',  token0: TOKENS[2],  token1: TOKENS[3],  apr: 8.4,  tvl: 450000000,  volume24h: 2200000000,  feeTier: 0.01, myLiquidity: 3000 },
];

export const TRANSACTIONS: Transaction[] = [
  { hash: '0xabc1', type: 'swap',   tokenIn: TOKENS[0], tokenOut: TOKENS[2], amountIn: 0.5,  amountOut: 1921.07, timestamp: Date.now() - 120000,    status: 'confirmed', gasUsed: 45 },
  { hash: '0xabc2', type: 'add',    tokenIn: TOKENS[0], tokenOut: TOKENS[2], amountIn: 1.0,  amountOut: 3842.15, timestamp: Date.now() - 3600000,   status: 'confirmed', gasUsed: 89 },
  { hash: '0xabc3', type: 'swap',   tokenIn: TOKENS[2], tokenOut: TOKENS[4], amountIn: 500,  amountOut: 40.16,   timestamp: Date.now() - 7200000,   status: 'confirmed', gasUsed: 52 },
  { hash: '0xabc4', type: 'swap',   tokenIn: TOKENS[5], tokenOut: TOKENS[0], amountIn: 20,   amountOut: 0.0974,  timestamp: Date.now() - 86400000,  status: 'failed' },
  { hash: '0xabc5', type: 'remove', tokenIn: TOKENS[0], tokenOut: TOKENS[2], amountIn: 0.25, amountOut: 960.53,  timestamp: Date.now() - 172800000, status: 'confirmed', gasUsed: 75 },
];
