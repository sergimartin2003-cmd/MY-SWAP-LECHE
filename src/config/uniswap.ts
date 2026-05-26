/**
 * Uniswap v3 contract addresses, ABIs, and constants per chain.
 * Supports: Ethereum, Polygon, Arbitrum, Optimism, Base
 */
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains';

// ── Per-chain contract addresses ──────────────────────────────────────────

export const WETH_ADDRESS: Record<number, `0x${string}`> = {
  [mainnet.id]:  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  [polygon.id]:  '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
  [arbitrum.id]: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  [optimism.id]: '0x4200000000000000000000000000000000000006',
  [base.id]:     '0x4200000000000000000000000000000000000006',
};

export const QUOTER_V2_ADDRESS: Record<number, `0x${string}`> = {
  [mainnet.id]:  '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  [polygon.id]:  '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  [arbitrum.id]: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  [optimism.id]: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  [base.id]:     '0x3d4e44Eb1374240CE5F1B136aa00916a6af8544b',
};

export const SWAP_ROUTER_ADDRESS: Record<number, `0x${string}`> = {
  [mainnet.id]:  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  [polygon.id]:  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  [arbitrum.id]: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  [optimism.id]: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  [base.id]:     '0x2626664c2603336E57B271c5C0b26F421741e481',
};

// ── Fee tiers ─────────────────────────────────────────────────────────────

export const FEE_TIERS = [100, 500, 3000, 10000] as const;
export type FeeTier = (typeof FEE_TIERS)[number];

export const FEE_LABEL: Record<FeeTier, string> = {
  100:   '0.01%',
  500:   '0.05%',
  3000:  '0.30%',
  10000: '1.00%',
};

// ── QuoterV2 ABI ──────────────────────────────────────────────────────────

export const QUOTER_V2_ABI = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    stateMutability: 'view', // eth_call works regardless of mutability
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn',           type: 'address' },
          { name: 'tokenOut',          type: 'address' },
          { name: 'amountIn',          type: 'uint256' },
          { name: 'fee',               type: 'uint24'  },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [
      { name: 'amountOut',               type: 'uint256' },
      { name: 'sqrtPriceX96After',       type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32'  },
      { name: 'gasEstimate',             type: 'uint256' },
    ],
  },
] as const;

// ── SwapRouter02 ABI ──────────────────────────────────────────────────────

export const SWAP_ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn',           type: 'address' },
          { name: 'tokenOut',          type: 'address' },
          { name: 'fee',               type: 'uint24'  },
          { name: 'recipient',         type: 'address' },
          { name: 'amountIn',          type: 'uint256' },
          { name: 'amountOutMinimum',  type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;

// ── ERC-20 ABI ────────────────────────────────────────────────────────────

export const ERC20_ABI = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner',   type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount',  type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
