import { motion } from 'framer-motion';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, TrendingUp, TrendingDown, ExternalLink, Copy } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TOKENS, TRANSACTIONS } from '../data/tokens';
import { useState } from 'react';

export default function PortfolioPage() {
  const { walletConnected, walletAddress, tokenBalances, setShowWalletPanel } = useStore();
  const [txFilter, setTxFilter] = useState<'all' | 'swap' | 'add' | 'remove'>('all');

  // Use real on-chain balances when connected; fall back to static demo data
  const getBalance = (t: typeof TOKENS[0]) =>
    walletConnected ? (tokenBalances[t.address] ?? 0) : (t.balance ?? 0);

  const ownedTokens  = TOKENS.filter(t => getBalance(t) > 0);
  const totalValue   = ownedTokens.reduce((sum, t) => sum + getBalance(t) * t.price, 0);
  // Daily P&L: sum of each holding's value × its 24h change percentage
  const totalChange24h = ownedTokens.reduce(
    (sum, t) => sum + getBalance(t) * t.price * (t.change24h / 100), 0
  );
  const changePct24h = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0;

  const filteredTx = TRANSACTIONS.filter(tx => txFilter === 'all' || tx.type === txFilter);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (!walletConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
        >
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, rgba(123,47,255,0.2), rgba(0,212,255,0.2))', border: '1px solid rgba(123,47,255,0.3)' }}>
            <Wallet size={40} className="text-neon-blue" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Connect your wallet</h2>
          <p className="text-white/40 mb-8 max-w-sm">Connect your wallet to view your portfolio, balances, and transaction history.</p>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(123,47,255,0.5)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowWalletPanel(true)}
            className="btn-primary max-w-xs"
          >
            Connect Wallet
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Portfolio header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(123,47,255,0.1), rgba(0,212,255,0.05))', border: '1px solid rgba(123,47,255,0.2)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/40 mb-1">Total Portfolio Value</p>
            <p className="text-4xl font-black font-mono text-white">${totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            <p className="text-sm mt-1" style={{ color: totalChange24h >= 0 ? '#00FF88' : '#FF2D78' }}>
              {totalChange24h >= 0 ? '↑' : '↓'} {totalChange24h >= 0 ? '+' : ''}${Math.abs(totalChange24h).toLocaleString('en-US', { maximumFractionDigits: 2 })} ({changePct24h >= 0 ? '+' : ''}{changePct24h.toFixed(2)}%) today
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="font-mono text-white/70">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            <button className="text-white/30 hover:text-white/70 transition-colors ml-1">
              <Copy size={13} />
            </button>
            <button className="text-white/30 hover:text-white/70 transition-colors">
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Holdings */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Holdings</h2>
          {ownedTokens.map((token, i) => {
            const bal   = getBalance(token);
            const value = bal * token.price;
            const pct = (value / totalValue) * 100;
            const isPos = token.change24h >= 0;
            return (
              <motion.div
                key={token.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-card-hover p-4"
              >
                <div className="flex items-center gap-3">
                  <img src={token.logoUrl} alt={token.symbol} className="w-10 h-10 rounded-full" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-sm font-bold text-white">{token.symbol}</span>
                        <span className="text-xs text-white/30 ml-1.5">{token.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono text-white">${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                        <p className="text-xs font-mono text-white/40">{bal.toFixed(4)} {token.symbol}</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.06 + 0.2 }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #7B2FFF, #00D4FF)' }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-white/20">{pct.toFixed(1)}% of portfolio</span>
                      <span className={`text-xs font-semibold flex items-center gap-0.5`} style={{ color: isPos ? '#00FF88' : '#FF2D78' }}>
                        {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {isPos ? '+' : ''}{token.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Transactions</h2>
          </div>
          {/* Filter */}
          <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['all', 'swap', 'add', 'remove'] as const).map(f => (
              <button key={f} onClick={() => setTxFilter(f)}
                className="flex-1 py-1 rounded-lg text-xs font-medium capitalize transition-all"
                style={{
                  background: txFilter === f ? 'rgba(123,47,255,0.3)' : 'transparent',
                  color: txFilter === f ? '#fff' : 'rgba(255,255,255,0.4)',
                }}>
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredTx.map((tx, i) => (
              <motion.div
                key={tx.hash}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: tx.type === 'swap' ? 'rgba(0,212,255,0.15)' : tx.type === 'add' ? 'rgba(0,255,136,0.15)' : 'rgba(255,45,120,0.15)' }}>
                    {tx.type === 'swap' ? <ArrowUpRight size={14} style={{ color: '#00D4FF' }} /> :
                     tx.type === 'add' ? <Plus size={14} style={{ color: '#00FF88' }} /> :
                     <ArrowDownLeft size={14} style={{ color: '#FF2D78' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white capitalize">{tx.type}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium`}
                        style={{
                          background: tx.status === 'confirmed' ? 'rgba(0,255,136,0.1)' : tx.status === 'pending' ? 'rgba(255,184,0,0.1)' : 'rgba(255,45,120,0.1)',
                          color: tx.status === 'confirmed' ? '#00FF88' : tx.status === 'pending' ? '#FFB800' : '#FF2D78',
                        }}>
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mt-1 font-mono">
                      {tx.amountIn.toFixed(4)} {tx.tokenIn.symbol} → {tx.amountOut.toFixed(4)} {tx.tokenOut.symbol}
                    </p>
                    <p className="text-xs text-white/20 mt-0.5">{formatTime(tx.timestamp)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
