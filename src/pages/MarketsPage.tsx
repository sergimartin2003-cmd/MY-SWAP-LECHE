import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, TrendingDown, ChevronUp, ChevronDown, X, BarChart2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import PairChart from '../components/PairChart';

type SortKey = 'price' | 'change24h' | 'volume24h' | 'liquidity' | 'tvl';
type FilterKey = 'all' | 'gainers' | 'losers' | 'stablecoins';

const STABLE_SYMBOLS = ['USDC', 'USDT', 'DAI'];

export default function MarketsPage() {
  const { pairs, selectedPair, setSelectedPair, updatePrices } = useStore();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('volume24h');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    const id = setInterval(updatePrices, 3000);
    return () => clearInterval(id);
  }, [updatePrices]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = useMemo(() => {
    const result = pairs.filter(p => {
      const query = search.toLowerCase();
      const matchSearch = !query ||
        p.baseToken.symbol.toLowerCase().includes(query) ||
        p.quoteToken.symbol.toLowerCase().includes(query);
      const matchFilter =
        filter === 'all' ? true :
        filter === 'gainers' ? p.change24h > 0 :
        filter === 'losers' ? p.change24h < 0 :
        STABLE_SYMBOLS.includes(p.baseToken.symbol) || STABLE_SYMBOLS.includes(p.quoteToken.symbol);
      return matchSearch && matchFilter;
    });
    return result.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [pairs, search, sortKey, sortDir, filter]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp size={12} className="text-white/20" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-neon-blue" />
      : <ChevronDown size={12} className="text-neon-blue" />;
  };

  const formatNum = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
    return `$${n.toFixed(0)}`;
  };

  const formatPrice = (p: number) => {
    if (p < 0.0001) return p.toExponential(3);
    if (p < 1) return p.toFixed(5);
    if (p < 100) return p.toFixed(3);
    return p.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={selectedPair ? 'xl:col-span-1' : 'xl:col-span-3'}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
            <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
              <BarChart2 size={22} className="text-neon-blue" />
              Markets
            </h1>
            <p className="text-sm text-white/40">Live trading pairs with real-time price updates</p>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={14} className="text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search pairs..."
                className="bg-transparent text-sm text-white outline-none placeholder-white/30 flex-1"
              />
            </div>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {(['all', 'gainers', 'losers', 'stablecoins'] as FilterKey[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all"
                  style={{
                    background: filter === f ? 'rgba(123,47,255,0.3)' : 'transparent',
                    color: filter === f ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-white/5 text-xs text-white/30 font-medium">
              <div>Pair</div>
              {(['price', 'change24h', 'volume24h', 'tvl'] as SortKey[]).map(k => (
                <button key={k} onClick={() => handleSort(k)}
                  className="flex items-center gap-1 hover:text-white/60 transition-colors justify-end">
                  <span>{k === 'change24h' ? '24h %' : k === 'volume24h' ? 'Volume' : k === 'tvl' ? 'TVL' : 'Price'}</span>
                  <SortIcon k={k} />
                </button>
              ))}
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
              <AnimatePresence>
                {sorted.map((pair, i) => {
                  const isPos = pair.change24h >= 0;
                  const isActive = selectedPair?.id === pair.id;
                  return (
                    <motion.button
                      key={pair.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelectedPair(isActive ? null : pair)}
                      className="w-full grid grid-cols-5 gap-2 px-4 py-3 items-center text-xs border-b border-white/3 hover:bg-white/5 transition-all text-left"
                      style={{
                        background: isActive ? 'rgba(123,47,255,0.08)' : undefined,
                        borderLeft: isActive ? '2px solid #7B2FFF' : '2px solid transparent',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative w-8 h-5 flex-shrink-0">
                          <img src={pair.baseToken.logoUrl} alt="" className="w-4 h-4 rounded-full absolute left-0" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                          <img src={pair.quoteToken.logoUrl} alt="" className="w-4 h-4 rounded-full absolute left-2.5" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                        </div>
                        <span className="font-semibold text-white text-xs whitespace-nowrap">
                          {pair.baseToken.symbol}<span className="text-white/30">/{pair.quoteToken.symbol}</span>
                        </span>
                      </div>
                      <div className="text-right font-mono text-white/80">${formatPrice(pair.price)}</div>
                      <div className="text-right">
                        <span className="flex items-center gap-0.5 justify-end font-semibold"
                          style={{ color: isPos ? '#00FF88' : '#FF2D78' }}>
                          {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {isPos ? '+' : ''}{pair.change24h.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-right text-white/50 font-mono">{formatNum(pair.volume24h)}</div>
                      <div className="text-right text-white/50 font-mono">{formatNum(pair.tvl)}</div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedPair && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ type: 'spring', bounce: 0.2 }}
              className="xl:col-span-2 glass-card p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-7">
                    <img src={selectedPair.baseToken.logoUrl} alt="" className="w-6 h-6 rounded-full absolute left-0" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    <img src={selectedPair.quoteToken.logoUrl} alt="" className="w-6 h-6 rounded-full absolute left-4" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">
                      {selectedPair.baseToken.symbol}<span className="text-white/40">/{selectedPair.quoteToken.symbol}</span>
                    </h2>
                    <p className="text-xs text-white/30">{selectedPair.baseToken.name} · {selectedPair.quoteToken.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPair(null)}
                  className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>
              <PairChart pair={selectedPair} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
