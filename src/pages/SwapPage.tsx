import { motion } from 'framer-motion';
import SwapCard from '../components/SwapCard';
import { TOKENS, TRADING_PAIRS } from '../data/tokens';
import { useStore } from '../store/useStore';
import { TrendingUp, TrendingDown, Flame } from 'lucide-react';

export default function SwapPage() {
  const { setActiveTab, setSelectedPair } = useStore();

  const topMovers = [...TOKENS]
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: swap */}
        <div className="lg:col-span-1">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <SwapCard />
          </motion.div>
        </div>

        {/* Right: info panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero text */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-3">
              Swap <span className="text-gradient">smarter</span>.<br />
              Trade <span className="text-gradient-green">faster</span>.
            </h1>
            <p className="text-white/40 text-lg max-w-lg">
              The next-generation DEX with real-time quotes, live pair charts, and an interface built for serious traders.
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { label: 'Total Volume 24h', value: '$28.4B', sub: '+12.3% vs yesterday', color: '#00D4FF' },
              { label: 'Total Liquidity', value: '$4.2B', sub: 'across all pools', color: '#7B2FFF' },
              { label: 'Active Pairs', value: '2,847', sub: '12 new today', color: '#00FF88' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="glass-card p-4 text-center"
              >
                <p className="text-2xl font-black font-mono" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs text-white/60 font-medium mt-1">{stat.label}</p>
                <p className="text-xs text-white/30 mt-0.5">{stat.sub}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Top movers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Flame size={16} className="text-orange-400" />
              <h3 className="text-sm font-bold text-white/80">Top Movers</h3>
            </div>
            <div className="space-y-2">
              {topMovers.map((token, i) => {
                const isPos = token.change24h >= 0;
                return (
                  <motion.div
                    key={token.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition-all hover:bg-white/5"
                    onClick={() => {
                      const pair = TRADING_PAIRS.find(p => p.baseToken.symbol === token.symbol || p.quoteToken.symbol === token.symbol);
                      if (pair) { setSelectedPair(pair); setActiveTab('markets'); }
                    }}
                  >
                    <img src={token.logoUrl} alt={token.symbol} className="w-8 h-8 rounded-full" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white group-hover:text-neon-blue transition-colors">{token.symbol}</span>
                        <span className="text-xs text-white/30">{token.name}</span>
                      </div>
                      <p className="text-xs text-white/30 font-mono">${token.price.toLocaleString()}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold`}
                      style={{ background: isPos ? 'rgba(0,255,136,0.1)' : 'rgba(255,45,120,0.1)', color: isPos ? '#00FF88' : '#FF2D78' }}>
                      {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {isPos ? '+' : ''}{token.change24h.toFixed(2)}%
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Quick pair shortcuts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="glass-card p-5"
          >
            <h3 className="text-sm font-bold text-white/80 mb-4">Popular Pairs</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TRADING_PAIRS.slice(0, 6).map(pair => {
                const isPos = pair.change24h >= 0;
                return (
                  <motion.button
                    key={pair.id}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedPair(pair); setActiveTab('markets'); }}
                    className="p-3 rounded-xl text-left transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <div className="relative w-7 h-5">
                        <img src={pair.baseToken.logoUrl} alt="" className="w-4 h-4 rounded-full absolute left-0" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                        <img src={pair.quoteToken.logoUrl} alt="" className="w-4 h-4 rounded-full absolute left-2.5" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                      </div>
                      <span className="text-xs font-bold text-white">{pair.baseToken.symbol}/{pair.quoteToken.symbol}</span>
                    </div>
                    <p className="text-sm font-mono text-white/80">${pair.price < 1 ? pair.price.toFixed(5) : pair.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: isPos ? '#00FF88' : '#FF2D78' }}>
                      {isPos ? '+' : ''}{pair.change24h.toFixed(2)}%
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
