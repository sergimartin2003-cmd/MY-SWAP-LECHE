# NexSwap — Next-Gen DEX

A next-generation decentralised exchange built on Uniswap v3. Real-time quotes, live charts, multi-chain support, and on-chain fee collection via NexSwapRouter.

---

## Features

- ⚡ **Real-time swaps** — Uniswap v3 QuoterV2 + SwapRouter02
- 💰 **Platform fee** — 0.25% collected on-chain via NexSwapRouter
- 📊 **Analytics** — 30-day volume, fees, top pairs
- 🎯 **Limit Orders** — Set target prices, stored locally
- 🎁 **Referral system** — Unique codes, shareable links
- 🌐 **Multi-chain** — Ethereum, Base, Arbitrum, Optimism, Polygon
- 🔐 **8 wallets** — MetaMask, Phantom, Trust, Brave, Coinbase, WalletConnect, Safe, Injected

---

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in your values
npm run dev
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_TREASURY_ADDRESS` | ✅ Yes | Your wallet — receives all platform fees |
| `VITE_WC_PROJECT_ID` | Optional | WalletConnect QR code support |
| `VITE_NEXSWAP_ROUTER_MAINNET` | Optional | Deployed NexSwapRouter on Ethereum |
| `VITE_NEXSWAP_ROUTER_BASE` | Optional | Deployed NexSwapRouter on Base |
| `VITE_NEXSWAP_ROUTER_ARBITRUM` | Optional | Deployed NexSwapRouter on Arbitrum |
| `VITE_NEXSWAP_ROUTER_OPTIMISM` | Optional | Deployed NexSwapRouter on Optimism |
| `VITE_NEXSWAP_ROUTER_POLYGON` | Optional | Deployed NexSwapRouter on Polygon |

---

## Deploy to Vercel

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables (see table above)
4. Deploy — done ✅

---

## On-Chain Fee Collection

Deploy `contracts/NexSwapRouter.sol` via Remix IDE (no npm needed).
Full guide: [`contracts/DEPLOY.md`](contracts/DEPLOY.md)

Once deployed, add `VITE_NEXSWAP_ROUTER_*` env vars to Vercel.
The swap UI will automatically show **ON-CHAIN ✓** and route through your contract.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS + Framer Motion |
| Web3 | wagmi v2 + viem + Uniswap v3 |
| State | Zustand |
| Tests | Vitest + Testing Library (25 tests) |
| Deploy | Vercel |

---

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run test       # run tests
npm run preview    # preview production build
```

---

## Fee Model

```
User swap $1,000
  → NexSwapRouter takes $2.50 (0.25%) → your treasury wallet
  → $997.50 routed through Uniswap v3
  → User receives tokens
```

The platform fee is hardcapped at 1% in the contract.
