import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import PriceTicker from './components/PriceTicker';
import NotificationToast from './components/NotificationToast';
import AuroraBackground from './components/AuroraBackground';
import WalletPanel from './components/WalletPanel';
import WalletSync from './components/WalletSync';
import { useStore } from './store/useStore';

// Lazy-load pages → each page gets its own chunk, cuts initial bundle ~60%
const SwapPage        = lazy(() => import('./pages/SwapPage'));
const MarketsPage     = lazy(() => import('./pages/MarketsPage'));
const PoolsPage       = lazy(() => import('./pages/PoolsPage'));
const PortfolioPage   = lazy(() => import('./pages/PortfolioPage'));
const AnalyticsPage   = lazy(() => import('./pages/AnalyticsPage'));
const LimitOrdersPage = lazy(() => import('./pages/LimitOrdersPage'));
const BridgePage      = lazy(() => import('./pages/BridgePage'));
const EarnPage        = lazy(() => import('./pages/EarnPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const GovernancePage  = lazy(() => import('./pages/GovernancePage'));
const SettingsPage    = lazy(() => import('./pages/SettingsPage'));

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

// Alt+1…6 keyboard shortcuts for the main tabs
const KEY_MAP: Record<string, string> = {
  '1': 'swap', '2': 'markets', '3': 'limits',
  '4': 'pools', '5': 'portfolio', '6': 'analytics',
};

const VALID_TABS = new Set([
  'swap','markets','limits','pools','portfolio','analytics',
  'bridge','earn','leaderboard','governance','settings',
]);

export default function App() {
  const { activeTab, setActiveTab } = useStore();

  // Honour ?tab=X from URL (used by PWA manifest shortcuts)
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab && VALID_TABS.has(tab)) setActiveTab(tab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to top whenever the active tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // Alt+1…6 keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && KEY_MAP[e.key]) {
        e.preventDefault();
        setActiveTab(KEY_MAP[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveTab]);

  const renderPage = () => {
    switch (activeTab) {
      case 'swap':        return <SwapPage />;
      case 'markets':     return <MarketsPage />;
      case 'pools':       return <PoolsPage />;
      case 'portfolio':   return <PortfolioPage />;
      case 'analytics':   return <AnalyticsPage />;
      case 'limits':      return <LimitOrdersPage />;
      case 'bridge':      return <BridgePage />;
      case 'earn':        return <EarnPage />;
      case 'leaderboard': return <LeaderboardPage />;
      case 'governance':  return <GovernancePage />;
      case 'settings':    return <SettingsPage />;
      default:            return <SwapPage />;
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

        <footer className="mt-auto py-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
              NexSwap v1.0 · Powered by{' '}
              <span style={{ color: '#FC72FF' }}>🦄 Uniswap v3</span>
            </p>
            <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {(['governance', 'earn', 'analytics', 'settings'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="capitalize hover:text-white/50 transition-colors">
                  {tab}
                </button>
              ))}
              <span className="hidden sm:block text-white/10">· Alt+1–6 for quick nav</span>
            </div>
          </div>
        </footer>
      </div>
      <NotificationToast />
      <WalletPanel />
      <WalletSync />
    </div>
  );
}
