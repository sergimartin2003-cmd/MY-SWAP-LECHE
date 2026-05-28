import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, GitBranch, TrendingUp, Trophy, Vote } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { useStore } from '../store/useStore';
import { useState, useRef, useEffect } from 'react';

const MAIN_TABS = [
  { id: 'swap',        label: 'Swap' },
  { id: 'markets',     label: 'Markets' },
  { id: 'limits',      label: 'Limits', badge: 'New' },
  { id: 'pools',       label: 'Pools' },
  { id: 'portfolio',   label: 'Portfolio' },
  { id: 'analytics',   label: 'Analytics' },
];

const MORE_TABS = [
  { id: 'bridge',      label: 'Bridge',      icon: GitBranch, desc: 'Cross-chain token transfers' },
  { id: 'earn',        label: 'Earn',         icon: TrendingUp, desc: 'Stake, farm, earn yield', badge: 'New' },
  { id: 'leaderboard', label: 'Leaderboard',  icon: Trophy,    desc: 'Top traders & prizes' },
  { id: 'governance',  label: 'Governance',   icon: Vote,      desc: 'Vote on protocol changes' },
];

const ALL_TABS = [...MAIN_TABS, ...MORE_TABS];

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Navbar() {
  const { activeTab, setActiveTab, setShowWalletPanel } = useStore();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isMoreActive = MORE_TABS.some(t => t.id === activeTab);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(5, 5, 16, 0.85)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <motion.div
          className="flex items-center gap-2 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          onClick={() => setActiveTab('swap')}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7B2FFF, #00D4FF)' }}>
              <Zap size={16} className="text-white" />
            </div>
            <div className="absolute inset-0 rounded-lg blur-md opacity-50"
              style={{ background: 'linear-gradient(135deg, #7B2FFF, #00D4FF)' }} />
          </div>
          <span className="text-xl font-black text-gradient">NexSwap</span>
        </motion.div>

        {/* Desktop tabs */}
        <div
          className="hidden md:flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {MAIN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
              style={{ color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)' }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'linear-gradient(135deg, rgba(123,47,255,0.5), rgba(0,212,255,0.3))' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
              {tab.badge && (
                <span className="relative z-10 text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(252,114,255,0.25)', color: '#FC72FF', fontSize: '9px', lineHeight: 1 }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}

          {/* More dropdown */}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen(v => !v)}
              className="relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1"
              style={{ color: isMoreActive ? '#fff' : 'rgba(255,255,255,0.5)' }}
            >
              {isMoreActive && (
                <motion.div layoutId="activeTab" className="absolute inset-0 rounded-lg"
                  style={{ background: 'linear-gradient(135deg, rgba(123,47,255,0.5), rgba(0,212,255,0.3))' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
              )}
              <span className="relative z-10">
                {isMoreActive ? MORE_TABS.find(t => t.id === activeTab)?.label : 'More'}
              </span>
              <ChevronDown size={13} className={`relative z-10 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-60 rounded-xl overflow-hidden z-50"
                  style={{ background: 'rgba(10,8,28,0.97)', border: '1px solid rgba(123,47,255,0.25)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}
                >
                  {MORE_TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setMoreOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                        style={{
                          background: isActive ? 'rgba(123,47,255,0.15)' : 'transparent',
                          borderLeft: isActive ? '2px solid #7B2FFF' : '2px solid transparent',
                        }}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: isActive ? 'rgba(123,47,255,0.25)' : 'rgba(255,255,255,0.06)' }}>
                          <Icon size={14} style={{ color: isActive ? '#7B2FFF' : 'rgba(255,255,255,0.5)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                              {tab.label}
                            </span>
                            {tab.badge && (
                              <span className="text-xs px-1.5 rounded-full font-bold"
                                style={{ background: 'rgba(252,114,255,0.2)', color: '#FC72FF', fontSize: '9px' }}>
                                {tab.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/30 mt-0.5 truncate">{tab.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isConnected && address ? (
            /* Connected wallet pill */
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(123,47,255,0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowWalletPanel(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
              style={{
                background: 'rgba(123,47,255,0.15)',
                border: '1px solid rgba(123,47,255,0.35)',
                color: '#fff',
              }}
            >
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              {balance && (
                <span className="hidden sm:block text-xs font-mono text-white/60 mr-0.5">
                  {parseFloat(balance.formatted).toFixed(3)} {balance.symbol}
                </span>
              )}
              <span className="font-mono text-xs">{truncate(address)}</span>
              <ChevronDown size={13} className="text-white/50" />
            </motion.button>
          ) : (
            /* Connect button */
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(123,47,255,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowWalletPanel(true)}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7B2FFF, #00D4FF)' }}
            >
              Connect Wallet
            </motion.button>
          )}
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden flex items-center px-2 pb-2 overflow-x-auto gap-1">
        {ALL_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="text-xs font-medium py-1 px-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1"
            style={{
              color: activeTab === tab.id ? '#00D4FF' : 'rgba(255,255,255,0.4)',
              borderBottom: activeTab === tab.id ? '2px solid #00D4FF' : '2px solid transparent',
            }}
          >
            {tab.label}
            {tab.badge && <span className="text-xs font-bold" style={{ color: '#FC72FF', fontSize: '8px' }}>{tab.badge}</span>}
          </button>
        ))}
      </div>
    </motion.nav>
  );
}
