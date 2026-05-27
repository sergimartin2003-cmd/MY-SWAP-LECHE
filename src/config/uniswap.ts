/**
 * Uniswap v3 + NexSwapRouter contract addresses, ABIs, and constants per chain.
 * Supports: Ethereum, Polygon, Arbitrum, Optimism, Base
 */
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains';

// ── Per-chain Uniswap v3 addresses ────────────────────────────────────────

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

// Uniswap v3 SwapRouter02 — used as FALLBACK when NexSwapRouter is not deployed
export const SWAP_ROUTER_ADDRESS: Record<number, `0x${string}`> = {
  [mainnet.id]:  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  [polygon.id]:  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  [arbitrum.id]: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  [optimism.id]: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  [base.id]:     '0x2626664c2603336E57B271c5C0b26F421741e481',
};

// ── NexSwapRouter — our fee-collecting proxy ──────────────────────────────
//
// Deploy contracts/NexSwapRouter.sol (see contracts/DEPLOY.md), then set:
//   VITE_NEXSWAP_ROUTER_MAINNET=0x...
//   VITE_NEXSWAP_ROUTER_BASE=0x...
//   VITE_NEXSWAP_ROUTER_ARBITRUM=0x...
//   VITE_NEXSWAP_ROUTER_OPTIMISM=0x...
//   VITE_NEXSWAP_ROUTER_POLYGON=0x...
//
// When set  → swaps go through our router, 0.25% fee lands on-chain in treasury.
// When unset → swaps go directly through Uniswap (fee is UI-only, not collected).
//
export const NEXSWAP_ROUTER_ADDRESS: Partial<Record<number, `0x${string}`>> = {
  ...(import.meta.env.VITE_NEXSWAP_ROUTER_MAINNET
    ? { [mainnet.id]:  import.meta.env.VITE_NEXSWAP_ROUTER_MAINNET  as `0x${string}` } : {}),
  ...(import.meta.env.VITE_NEXSWAP_ROUTER_BASE
    ? { [base.id]:     import.meta.env.VITE_NEXSWAP_ROUTER_BASE      as `0x${string}` } : {}),
  ...(import.meta.env.VITE_NEXSWAP_ROUTER_ARBITRUM
    ? { [arbitrum.id]: import.meta.env.VITE_NEXSWAP_ROUTER_ARBITRUM  as `0x${string}` } : {}),
  ...(import.meta.env.VITE_NEXSWAP_ROUTER_OPTIMISM
    ? { [optimism.id]: import.meta.env.VITE_NEXSWAP_ROUTER_OPTIMISM  as `0x${string}` } : {}),
  ...(import.meta.env.VITE_NEXSWAP_ROUTER_POLYGON
    ? { [polygon.id]:  import.meta.env.VITE_NEXSWAP_ROUTER_POLYGON   as `0x${string}` } : {}),
};

// ── Protocol / platform fee ───────────────────────────────────────────────

export const PROTOCOL_FEE_BPS = 25; // 25 bps = 0.25 %

export const TREASURY_ADDRESS =
  (import.meta.env.VITE_TREASURY_ADDRESS as string) ||
  '0x0000000000000000000000000000000000000000';

if (typeof window !== 'undefined') {
  if (TREASURY_ADDRESS === '0x0000000000000000000000000000000000000000') {
    console.warn(
      '[NexSwap] ⚠️  VITE_TREASURY_ADDRESS not set — fees will be lost. ' +
      'Add VITE_TREASURY_ADDRESS=<your-wallet> to Vercel env vars.',
    );
  }
  const deployedChains = Object.keys(NEXSWAP_ROUTER_ADDRESS);
  if (deployedChains.length === 0) {
    console.info(
      '[NexSwap] ℹ️  NexSwapRouter not deployed yet. Swaps go directly through ' +
      'Uniswap. Deploy contracts/NexSwapRouter.sol to collect fees on-chain.',
    );
  } else {
    console.info(
      `[NexSwap] ✅ NexSwapRouter active on chain IDs: ${deployedChains.join(', ')}`,
    );
  }
}

// ── Pool fee tiers ────────────────────────────────────────────────────────

export const FEE_TIERS = [100, 500, 3000, 10000] as const;
export type FeeTier = (typeof FEE_TIERS)[number];

export const FEE_LABEL: Record<FeeTier, string> = {
  100:   '0.01%',
  500:   '0.05%',
  3000:  '0.30%',
  10000: '1.00%',
};

// ── NexSwapRouter ABI ─────────────────────────────────────────────────────
// Mirrors contracts/NexSwapRouter.sol — keep in sync if the contract changes.

export const NEXSWAP_ROUTER_ABI = [
  {
    name: 'swapExactInput',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenIn',          type: 'address' },
      { name: 'tokenOut',         type: 'address' },
      { name: 'poolFee',          type: 'uint24'  },
      { name: 'amountIn',         type: 'uint256' },
      { name: 'amountOutMinimum', type: 'uint256' },
      { name: 'deadline',         type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'swapExactETHInput',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'tokenOut',         type: 'address' },
      { name: 'poolFee',          type: 'uint24'  },
      { name: 'amountOutMinimum', type: 'uint256' },
      { name: 'deadline',         type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'netSwapAmount',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'grossAmount', type: 'uint256' }],
    outputs: [{ name: '',            type: 'uint256' }],
  },
  {
    name: 'feeBps',
    type: 'function',
    stateMutability: 'view',
    inputs:  [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ── QuoterV2 ABI ──────────────────────────────────────────────────────────

export const QUOTER_V2_ABI = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    stateMutability: 'view',
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

// ── SwapRouter02 ABI (fallback — direct Uniswap) ──────────────────────────

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
