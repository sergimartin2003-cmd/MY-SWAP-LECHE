import { motion } from 'framer-motion';
import { Zap, ChevronDown } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { useStore } from '../store/useStore';

const TABS = [
  { id: 'swap',      label: 'Swap' },
  { id: 'markets',   label: 'Markets' },
  { id: 'pools',     label: 'Pools' },
  { id: 'portfolio', label: 'Portfolio' },
];

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Navbar() {
  const { activeTab, setActiveTab, setShowWalletPanel } = useStore();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

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
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
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
            </button>
          ))}
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
      <div className="md:hidden flex items-center justify-around px-4 pb-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="text-xs font-medium py-1 px-3 rounded-lg transition-all"
            style={{
              color: activeTab === tab.id ? '#00D4FF' : 'rgba(255,255,255,0.4)',
              borderBottom: activeTab === tab.id ? '2px solid #00D4FF' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </motion.nav>
  );
}
