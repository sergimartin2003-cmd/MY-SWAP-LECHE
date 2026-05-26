import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import PriceTicker from './components/PriceTicker';
import NotificationToast from './components/NotificationToast';
import AuroraBackground from './components/AuroraBackground';
import WalletPanel from './components/WalletPanel';
import WalletSync from './components/WalletSync';
import SwapPage from './pages/SwapPage';
import MarketsPage from './pages/MarketsPage';
import PoolsPage from './pages/PoolsPage';
import PortfolioPage from './pages/PortfolioPage';
import { useStore } from './store/useStore';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function App() {
  const { activeTab } = useStore();

  const renderPage = () => {
    switch (activeTab) {
      case 'swap': return <SwapPage />;
      case 'markets': return <MarketsPage />;
      case 'pools': return <PoolsPage />;
      case 'portfolio': return <PortfolioPage />;
      default: return <SwapPage />;
    }
  };

  return (
    <div className="gradient-bg min-h-screen flex flex-col">
      <AuroraBackground />
      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />
        <PriceTicker />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="mt-auto py-6 border-t border-white/5 text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
            NexSwap — Next-Gen DEX · Built with ❤️ ·{' '}
            <span style={{ color: '#7B2FFF' }}>Not financial advice</span>
          </p>
        </footer>
      </div>
      <NotificationToast />
      <WalletPanel />
      <WalletSync />
    </div>
  );
}
