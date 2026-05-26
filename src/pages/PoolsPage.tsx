import { motion } from 'framer-motion';
import { Droplets, Plus, TrendingUp, Info, ExternalLink } from 'lucide-react';
import { POOLS } from '../data/tokens';
import { useState } from 'react';
import type { Pool } from '../types';

export default function PoolsPage() {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  const formatNum = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
    return `$${n.toFixed(0)}`;
  };

  const aprColor = (apr: number) =>
    apr > 50 ? '#00FF88' : apr > 25 ? '#00D4FF' : apr > 10 ? '#FFB800' : 'rgba(255,255,255,0.6)';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Droplets size={22} className="text-neon-blue" />
            <h1 className="text-2xl font-black text-white">Liquidity Pools</h1>
            {/* Uniswap v3 badge */}
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total TVL', value: '$4.2B', color: '#7B2FFF' },
          { label: '24h Volume', value: '$28.4B', color: '#00D4FF' },
          { label: 'My Liquidity', value: '$4,750', color: '#00FF88' },
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
          {POOLS.filter(p => (p.myLiquidity ?? 0) > 0).map((pool, i) => (
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
                <p className="text-sm font-bold" style={{ color: aprColor(pool.apr) }}>{pool.apr}%</p>
                <p className="text-xs text-white/30">APR</p>
              </div>
              <div className="flex gap-2">
                <button className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-colors" style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.25)' }}>Add</button>
                <button className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>Remove</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* All pools */}
      <div>
        <h2 className="text-sm font-semibold text-white/50 mb-3 uppercase tracking-wider">All Pools</h2>
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-5 gap-2 px-5 py-3 border-b border-white/5 text-xs text-white/30">
            <div>Pool</div>
            <div className="text-right">TVL</div>
            <div className="text-right">Volume 24h</div>
            <div className="text-right">Fee</div>
            <div className="text-right">APR</div>
          </div>
          {POOLS.map((pool, i) => (
            <motion.div
              key={pool.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="grid grid-cols-5 gap-2 px-5 py-4 border-b border-white/3 hover:bg-white/4 transition-all cursor-pointer items-center"
              onClick={() => setSelectedPool(selectedPool?.id === pool.id ? null : pool)}
              style={{ borderLeft: selectedPool?.id === pool.id ? '2px solid #7B2FFF' : '2px solid transparent' }}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-6">
                  <img src={pool.token0.logoUrl} alt="" className="w-5 h-5 rounded-full absolute left-0" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                  <img src={pool.token1.logoUrl} alt="" className="w-5 h-5 rounded-full absolute left-3.5" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{pool.token0.symbol}/{pool.token1.symbol}</p>
                  <p className="text-xs text-white/30">{pool.feeTier}% fee</p>
                </div>
              </div>
              <div className="text-right text-sm font-mono text-white/70">{formatNum(pool.tvl)}</div>
              <div className="text-right text-sm font-mono text-white/60">{formatNum(pool.volume24h)}</div>
              <div className="text-right">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>{pool.feeTier}%</span>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <TrendingUp size={12} style={{ color: aprColor(pool.apr) }} />
                  <span className="text-sm font-bold" style={{ color: aprColor(pool.apr) }}>{pool.apr}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pool detail */}
      {selectedPool && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 mt-5"
          style={{ border: '1px solid rgba(123,47,255,0.2)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white">{selectedPool.token0.symbol}/{selectedPool.token1.symbol} — Add Liquidity</h3>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
              {selectedPool.apr}% APR
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[selectedPool.token0, selectedPool.token1].map(token => (
              <div key={token.symbol} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img src={token.logoUrl} alt="" className="w-5 h-5 rounded-full" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    <span className="text-sm font-semibold text-white">{token.symbol}</span>
                  </div>
                  <span className="text-xs text-white/30">Balance: {token.balance?.toFixed(4) ?? '0'}</span>
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-transparent text-2xl font-bold text-white outline-none placeholder-white/20"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
            <Info size={14} className="text-neon-blue mt-0.5 flex-shrink-0" />
            <p className="text-xs text-white/50">Adding liquidity will earn you <span className="text-white/80">{selectedPool.feeTier}% in fees</span> on every trade in this pool, proportional to your share.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary mt-4"
          >
            Supply Liquidity
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
