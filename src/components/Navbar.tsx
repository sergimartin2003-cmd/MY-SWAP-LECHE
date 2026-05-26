import { motion } from 'framer-motion';
import { Zap, Bell, ChevronDown, Copy, ExternalLink, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';

const TABS = [
  { id: 'swap', label: 'Swap' },
  { id: 'markets', label: 'Markets' },
  { id: 'pools', label: 'Pools' },
  { id: 'portfolio', label: 'Portfolio' },
];

export default function Navbar() {
  const { walletConnected, walletAddress, connectWallet, disconnectWallet, activeTab, setActiveTab } = useStore();
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full"
      style={{ background: 'rgba(5, 5, 16, 0.8)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <motion.div className="flex items-center gap-2 cursor-pointer" whileHover={{ scale: 1.02 }}>
          <div className="relative">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7B2FFF, #00D4FF)' }}>
              <Zap size={16} className="text-white" />
            </div>
            <div className="absolute inset-0 rounded-lg blur-md opacity-50" style={{ background: 'linear-gradient(135deg, #7B2FFF, #00D4FF)' }} />
          </div>
          <span className="text-xl font-black text-gradient">NexSwap</span>
        </motion.div>

        <div className="hidden md:flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {TABS.map((tab) => (
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

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Bell size={18} className="text-white/60" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-neon-purple" />
          </motion.button>

          {walletConnected ? (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(123,47,255,0.15)', border: '1px solid rgba(123,47,255,0.3)', color: '#fff' }}
              >
                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                <span>{truncate(walletAddress)}</span>
                <ChevronDown size={14} className="text-white/60" />
              </motion.button>
              {showWalletMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-50"
                  style={{ background: '#0f0f24', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
                >
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-xs text-white/40 mb-1">Connected wallet</p>
                    <p className="text-sm font-mono text-white/80">{truncate(walletAddress)}</p>
                  </div>
                  {[
                    { icon: Copy, label: 'Copy Address' },
                    { icon: ExternalLink, label: 'View on Explorer' },
                  ].map(({ icon: Icon, label }) => (
                    <button key={label} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                      <Icon size={15} /> {label}
                    </button>
                  ))}
                  <button
                    onClick={() => { disconnectWallet(); setShowWalletMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors border-t border-white/5"
                  >
                    <LogOut size={15} /> Disconnect
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(123,47,255,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={connectWallet}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7B2FFF, #00D4FF)' }}
            >
              Connect Wallet
            </motion.button>
          )}
        </div>
      </div>

      <div className="md:hidden flex items-center justify-around px-4 pb-2 pt-0">
        {TABS.map((tab) => (
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
