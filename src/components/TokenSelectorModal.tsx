import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import type { Token } from '../types';
import { TOKENS } from '../data/tokens';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  excludeToken?: Token;
}

const RECENTLY_USED = [TOKENS[0], TOKENS[2], TOKENS[1], TOKENS[4]];

export default function TokenSelectorModal({ isOpen, onClose, onSelect, excludeToken }: Props) {
  const [search, setSearch] = useState('');

  const filtered = TOKENS.filter(t =>
    t !== excludeToken &&
    (t.symbol.toLowerCase().includes(search.toLowerCase()) ||
     t.name.toLowerCase().includes(search.toLowerCase()) ||
     t.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', bounce: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#0d0d20', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '80vh' }}>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">Select Token</h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
                >
                  <X size={18} />
                </motion.button>
              </div>

              {/* Search */}
              <div className="p-4">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Search size={16} className="text-white/40" />
                  <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search name, symbol, or paste address..."
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder-white/30"
                  />
                </div>
              </div>

              {/* Recently used */}
              {!search && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-white/30 mb-2 font-medium uppercase tracking-wider">Recent</p>
                  <div className="flex gap-2 flex-wrap">
                    {RECENTLY_USED.filter(t => t !== excludeToken).map(token => (
                      <motion.button
                        key={token.symbol}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { onSelect(token); onClose(); setSearch(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/70 hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <img src={token.logoUrl} alt={token.symbol} className="w-4 h-4 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                        {token.symbol}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Token list */}
              <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
                {filtered.map((token, idx) => (
                  <motion.button
                    key={token.symbol}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    whileHover={{ x: 4 }}
                    onClick={() => { onSelect(token); onClose(); setSearch(''); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all group"
                  >
                    <div className="relative">
                      <img
                        src={token.logoUrl}
                        alt={token.symbol}
                        className="w-9 h-9 rounded-full"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          el.style.display = 'none';
                          el.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 items-center justify-center text-xs font-bold text-white">
                        {token.symbol.slice(0, 2)}
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">{token.symbol}</span>
                        <CheckCircle size={12} className="text-neon-blue opacity-70" />
                      </div>
                      <p className="text-xs text-white/40">{token.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-white/80">${token.price.toFixed(token.price < 1 ? 4 : 2)}</p>
                      <p className={`text-xs flex items-center gap-0.5 justify-end font-medium ${token.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {token.change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                      </p>
                    </div>
                    {token.balance !== undefined && token.balance > 0 && (
                      <div className="text-right ml-2">
                        <p className="text-xs text-white/30">Balance</p>
                        <p className="text-xs font-mono text-white/60">{token.balance.toFixed(4)}</p>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
