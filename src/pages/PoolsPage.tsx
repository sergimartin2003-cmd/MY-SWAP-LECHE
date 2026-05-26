import { motion } from 'framer-motion';
import { Droplets, Plus, TrendingUp, Info, ExternalLink, AlertTriangle } from 'lucide-react';
import { POOLS } from '../data/tokens';
import { useState } from 'react';
import type { Pool } from '../types';

/** APR = (daily fees / TVL) × 365 × 100
 *  daily fees = volume24h × feeTier%
 *  feeTier is stored as e.g. 0.05 (= 0.05%) so divide by 100 to get decimal
 */
function calcApr(pool: Pool): number {
  if (!pool.tvl || pool.tvl === 0) return 0;
  return (pool.volume24h * (pool.feeTier / 100) / pool.tvl) * 365 * 100;
}

export default function PoolsPage() {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  const formatNum = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
    return `$${n.toFixed(0)}`;
  };

  const aprColor = (apr: number) =>
    apr > 30 ? '#00FF88' : apr > 18 ? '#00D4FF' : apr > 10 ? '#FFB800' : 'rgba(255,255,255,0.6)';

  const aprBg = (apr: number) =>
    apr > 30 ? 'rgba(0,255,136,0.1)' : apr > 18 ? 'rgba(0,212,255,0.1)' : apr > 10 ? 'rgba(255,184,0,0.1)' : 'rgba(255,255,255,0.05)';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Droplets size={22} className="text-neon-blue" />
            <h1 className="text-2xl font-black text-white">Liquidity Pools</h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(252,114,255,0.15)', color: '#FC72FF', border: '1px solid rgba(252,114,255,0.3)' }}>
              🦄 Uniswap v3
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://app.uniswap.org/pools"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ExternalLink size={12} /> Uniswap App
            </a>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 25px rgba(252,114,255,0.4)' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => window.open('https://app.uniswap.org/pools', '_blank')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #FC72FF, #7B2FFF)' }}
            >
              <Plus size={15} /> New Position
            </motion.button>
          </div>
        </div>
        <p className="text-sm text-white/40">Provide liquidity on Uniswap v3 and earn fees proportional to your share</p>
      </motion.div>

      {/* Uniswap v3 info banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-5 flex items-start gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(252,114,255,0.06)', border: '1px solid rgba(252,114,255,0.2)' }}
      >
        <span className="text-xl">🦄</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white mb-0.5">Powered by Uniswap v3</p>
          <p className="text-xs text-white/40">
            Concentrated liquidity positions with fee tiers of 0.01%, 0.05%, 0.30%, and 1.00%.
            Swaps on this platform route through Uniswap v3 pools on Ethereum, Polygon, Arbitrum, Optimism, and Base.
          </p>
        </div>
        <a
          href="https://docs.uniswap.org/concepts/protocol/concentrated-liquidity"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold flex items-center gap-1 whitespace-nowrap hover:opacity-80"
          style={{ color: '#FC72FF' }}
        >
          Learn more <ExternalLink size={10} />
        </a>
      </motion.div>

      {/* APR methodology note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-5 flex items-start gap-2.5 p-3 rounded-xl text-xs"
        style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.18)', color: '#FFB800' }}
      >
        <Info size={13} className="mt-0.5 flex-shrink-0" />
        <span>
          <strong>APR = (24h fees ÷ TVL) × 365.</strong>{' '}
          Fees = volume × pool fee tier. APR is variable and depends on trading volume, price range, and impermanent loss.
          Past performance does not guarantee future returns.
        </span>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: 'Total TVL',
            value: formatNum(POOLS.reduce((s, p) => s + p.tvl, 0)),
            color: '#7B2FFF',
          },
          {
            label: '24h Volume',
            value: formatNum(POOLS.reduce((s, p) => s + p.volume24h, 0)),
            color: '#00D4FF',
          },
          {
            label: 'My Liquidity',
            value: formatNum(POOLS.reduce((s, p) => s + (p.myLiquidity ?? 0), 0)),
            color: '#00FF88',
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-4 text-center"
          >
            <p className="text-xl font-black font-mono" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* My positions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-white/50 mb-3 uppercase tracking-wider">My Positions</h2>
        <div className="space-y-2">
          {POOLS.filter(p => (p.myLiquidity ?? 0) > 0).map((pool, i) => {
            const apr = calcApr(pool);
            return (
              <motion.div
                key={pool.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 flex items-center gap-4"
                style={{ border: '1px solid rgba(0,212,255,0.15)' }}
              >
                <div className="relative w-10 h-7">
                  <img src={pool.token0.logoUrl} alt="" className="w-6 h-6 rounded-full absolute left-0" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                  <img src={pool.token1.logoUrl} alt="" className="w-6 h-6 rounded-full absolute left-4" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{pool.token0.symbol}/{pool.token1.symbol}</p>
                  <p className="text-xs text-white/30">{pool.feeTier}% fee tier</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">${pool.myLiquidity?.toLocaleString()}</p>
                  <p className="text-xs text-white/30">My liquidity</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: aprColor(apr) }}>{apr.toFixed(1)}%</p>
                  <p className="text-xs text-white/30">APR</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open('https://app.uniswap.org/pools', '_blank')}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-colors"
                    style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.25)' }}
                  >Add</button>
                  <button
                    onClick={() => window.open('https://app.uniswap.org/pools', '_blank')}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
                  >Remove</button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* All pools */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">All Pools</h2>
          <span className="text-xs text-white/20">— APR derived from 24h volume · fee tier · TVL</span>
        </div>
        <div className="glass-card overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-2 px-5 py-3 border-b border-white/5 text-xs text-white/30">
            <div className="col-span-2">Pool</div>
            <div className="text-right">TVL</div>
            <div className="text-right">Volume 24h</div>
            <div className="text-right">Fee</div>
            <div className="text-right">APR ↗</div>
          </div>
          {POOLS.map((pool, i) => {
            const apr = calcApr(pool);
            const fees24h = pool.volume24h * (pool.feeTier / 100);
            return (
              <motion.div
                key={pool.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-6 gap-2 px-5 py-4 border-b border-white/3 hover:bg-white/4 transition-all cursor-pointer items-center"
                onClick={() => setSelectedPool(selectedPool?.id === pool.id ? null : pool)}
                style={{ borderLeft: selectedPool?.id === pool.id ? '2px solid #7B2FFF' : '2px solid transparent' }}
              >
                {/* Pool name */}
                <div className="col-span-2 flex items-center gap-3">
                  <div className="relative w-9 h-6">
                    <img src={pool.token0.logoUrl} alt="" className="w-5 h-5 rounded-full absolute left-0" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    <img src={pool.token1.logoUrl} alt="" className="w-5 h-5 rounded-full absolute left-3.5" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{pool.token0.symbol}/{pool.token1.symbol}</p>
                    <p className="text-xs text-white/30">{pool.feeTier}% fee</p>
                  </div>
                </div>

                {/* TVL */}
                <div className="text-right text-sm font-mono text-white/70">{formatNum(pool.tvl)}</div>

                {/* Volume */}
                <div className="text-right text-sm font-mono text-white/60">{formatNum(pool.volume24h)}</div>

                {/* Fee tier badge */}
                <div className="text-right">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>
                    {pool.feeTier}%
                  </span>
                </div>

                {/* APR — computed */}
                <div className="text-right">
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1">
                      <TrendingUp size={11} style={{ color: aprColor(apr) }} />
                      <span className="text-sm font-bold" style={{ color: aprColor(apr) }}>
                        {apr.toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-xs font-mono text-white/25">
                      {formatNum(fees24h)}/day
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Pool detail / add liquidity */}
      {selectedPool && (() => {
        const apr = calcApr(selectedPool);
        const fees24h = selectedPool.volume24h * (selectedPool.feeTier / 100);
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 mt-5"
            style={{ border: '1px solid rgba(123,47,255,0.2)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">
                {selectedPool.token0.symbol}/{selectedPool.token1.symbol} — Pool Details
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                style={{ background: aprBg(apr), color: aprColor(apr) }}>
                {apr.toFixed(1)}% APR
              </span>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'TVL',          value: formatNum(selectedPool.tvl),      color: '#7B2FFF' },
                { label: '24h Volume',   value: formatNum(selectedPool.volume24h), color: '#00D4FF' },
                { label: '24h Fees',     value: formatNum(fees24h),               color: '#00FF88' },
                { label: 'Fee Tier',     value: `${selectedPool.feeTier}%`,        color: '#FC72FF' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-lg font-black font-mono" style={{ color }}>{value}</p>
                  <p className="text-xs text-white/30 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* APR breakdown */}
            <div className="mb-5 p-3 rounded-xl text-xs space-y-1.5"
              style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)' }}>
              <p className="text-white/50 font-semibold mb-2 flex items-center gap-1.5">
                <TrendingUp size={12} className="text-neon-blue" /> APR Calculation
              </p>
              <div className="flex justify-between"><span className="text-white/30">24h Volume</span><span className="font-mono text-white/60">{formatNum(selectedPool.volume24h)}</span></div>
              <div className="flex justify-between"><span className="text-white/30">× Fee Tier</span><span className="font-mono text-white/60">{selectedPool.feeTier}%</span></div>
              <div className="flex justify-between"><span className="text-white/30">= Daily Fees</span><span className="font-mono text-white/70">{formatNum(fees24h)}</span></div>
              <div className="flex justify-between"><span className="text-white/30">÷ TVL</span><span className="font-mono text-white/60">{formatNum(selectedPool.tvl)}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-1.5">
                <span className="text-white/50 font-semibold">× 365 = APR</span>
                <span className="font-bold font-mono" style={{ color: aprColor(apr) }}>{apr.toFixed(2)}%</span>
              </div>
            </div>

            {/* IL warning */}
            <div className="mb-5 flex items-start gap-2 p-3 rounded-xl text-xs"
              style={{ background: 'rgba(255,45,120,0.06)', border: '1px solid rgba(255,45,120,0.15)', color: '#FF2D78' }}>
              <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
              <span>
                <strong>Impermanent Loss risk.</strong> If the price of {selectedPool.token0.symbol}/{selectedPool.token1.symbol}{' '}
                moves significantly from your entry, IL can reduce your effective yield below the APR shown.
                Stablecoin pairs (like USDC/USDT) have minimal IL.
              </span>
            </div>

            {/* Add liquidity inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[selectedPool.token0, selectedPool.token1].map(token => (
                <div key={token.symbol} className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <img src={token.logoUrl} alt="" className="w-5 h-5 rounded-full"
                        onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                      <span className="text-sm font-semibold text-white">{token.symbol}</span>
                    </div>
                    <span className="text-xs text-white/30">
                      Balance: {token.balance?.toFixed(4) ?? '0.0000'}
                    </span>
                  </div>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-transparent text-2xl font-bold text-white outline-none placeholder-white/20"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl flex items-start gap-2"
              style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
              <Info size={14} className="text-neon-blue mt-0.5 flex-shrink-0" />
              <p className="text-xs text-white/50">
                Adding liquidity earns you <span className="text-white/80">{selectedPool.feeTier}% in fees</span> on every trade in this pool,
                proportional to your share of the TVL. Liquidity is managed via Uniswap v3.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open('https://app.uniswap.org/pools', '_blank')}
              className="btn-primary mt-4"
            >
              Supply Liquidity on Uniswap ↗
            </motion.button>
          </motion.div>
        );
      })()}
    </div>
  );
}
