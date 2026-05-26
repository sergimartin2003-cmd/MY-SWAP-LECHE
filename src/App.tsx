import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import PriceTicker from './components/PriceTicker';
import NotificationToast from './components/NotificationToast';
import AuroraBackground from './components/AuroraBackground';
import WalletPanel from './components/WalletPanel';
import WalletSync from './components/WalletSync';
import { useStore } from './store/useStore';

// Lazy-load pages → each page gets its own chunk, cuts initial bundle ~60%
const SwapPage      = lazy(() => import('./pages/SwapPage'));
const MarketsPage   = lazy(() => import('./pages/MarketsPage'));
const PoolsPage     = lazy(() => import('./pages/PoolsPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -12 },
};

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <div
        className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
        style={{ borderTopColor: '#7B2FFF', borderRightColor: '#00D4FF' }}
      />
    </div>
  );
}

export default function App() {
  const { activeTab } = useStore();

  const renderPage = () => {
    switch (activeTab) {
      case 'swap':      return <SwapPage />;
      case 'markets':   return <MarketsPage />;
      case 'pools':     return <PoolsPage />;
      case 'portfolio': return <PortfolioPage />;
      default:          return <SwapPage />;
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
              <Suspense fallback={<PageLoader />}>
                {renderPage()}
              </Suspense>
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
