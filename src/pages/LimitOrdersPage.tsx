import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, X, CheckCircle, AlertTriangle, Zap,
  ChevronDown, Target, Trash2, TrendingUp,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Token } from '../types';
import { TOKENS } from '../data/tokens';
import TokenSelectorModal from '../components/TokenSelectorModal';

/* ── Types ────────────────────────────────────────────────────────────── */
type OrderStatus = 'open' | 'filled' | 'cancelled' | 'expired';

interface LimitOrder {
  id: string;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: number;
  targetPrice: number;  // how much tokenOut per 1 tokenIn
  estimatedOut: number;
  status: OrderStatus;
  createdAt: number;
  expiresAt: number;
  filledAt?: number;
}

/* ── Storage helpers ──────────────────────────────────────────────────── */
const STORAGE_KEY = 'nexswap_limit_orders';

function loadOrders(): LimitOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveOrders(orders: LimitOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

/* ── Helpers ──────────────────────────────────────────────────────────── */
const formatTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatTimeLeft = (ts: number) => {
  const diff = ts - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
};

const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string; label: string }> = {
  open:      { bg: 'rgba(0,212,255,0.1)',   color: '#00D4FF', label: 'Open' },
  filled:    { bg: 'rgba(0,255,136,0.1)',   color: '#00FF88', label: 'Filled' },
  cancelled: { bg: 'rgba(255,45,120,0.1)',  color: '#FF2D78', label: 'Cancelled' },
  expired:   { bg: 'rgba(255,184,0,0.1)',   color: '#FFB800', label: 'Expired' },
};

/* ── New Order Form ───────────────────────────────────────────────────── */
function NewOrderForm({ onCreated }: { onCreated: (order: LimitOrder) => void }) {
  const { walletConnected, setShowWalletPanel } = useStore();
  const [tokenIn,  setTokenIn]  = useState<Token>(TOKENS[0]);  // ETH
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS[2]);  // USDC
  const [amountIn, setAmountIn] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [expiry, setExpiry]     = useState<'1d' | '3d' | '7d' | '30d'>('7d');
  const [showInModal,  setShowInModal]  = useState(false);
  const [showOutModal, setShowOutModal] = useState(false);

  const marketRate = tokenIn.price / tokenOut.price;
  const estimatedOut = amountIn && targetPrice
    ? parseFloat(amountIn) * parseFloat(targetPrice)
    : 0;

  const priceDiff = targetPrice
    ? ((parseFloat(targetPrice) - marketRate) / marketRate) * 100
    : 0;

  const expiryMs: Record<typeof expiry, number> = {
    '1d': 86400000, '3d': 259200000, '7d': 604800000, '30d': 2592000000,
  };

  const handleCreate = () => {
    if (!walletConnected) { setShowWalletPanel(true); return; }
    if (!amountIn || !targetPrice) return;
    const order: LimitOrder = {
      id: Math.random().toString(36).slice(2),
      tokenIn,
      tokenOut,
      amountIn: parseFloat(amountIn),
      targetPrice: parseFloat(targetPrice),
      estimatedOut,
      status: 'open',
      createdAt: Date.now(),
      expiresAt: Date.now() + expiryMs[expiry],
    };
    onCreated(order);
    setAmountIn('');
    setTargetPrice('');
  };

  const isValid = !!amountIn && parseFloat(amountIn) > 0 && !!targetPrice && parseFloat(targetPrice) > 0;

  return (
    <div className="glass-card p-5 space-y-4" style={{ border: '1px solid rgba(123,47,255,0.2)' }}>
      <div className="flex items-center gap-2">
        <Target size={16} style={{ color: '#FC72FF' }} />
        <h3 className="text-sm font-bold text-white">Place Limit Order</h3>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-auto"
          style={{ background: 'rgba(252,114,255,0.1)', color: '#FC72FF', border: '1px solid rgba(252,114,255,0.25)' }}>
          Beta
        </span>
      </div>

      {/* Token selectors */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-white/40 mb-1">Sell</p>
          <button
            onClick={() => setShowInModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <img src={tokenIn.logoUrl} alt="" className="w-5 h-5 rounded-full"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span>{tokenIn.symbol}</span>
            <ChevronDown size={13} className="text-white/40 ml-auto" />
          </button>
        </div>
        <div>
          <p className="text-xs text-white/40 mb-1">Buy</p>
          <button
            onClick={() => setShowOutModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <img src={tokenOut.logoUrl} alt="" className="w-5 h-5 rounded-full"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span>{tokenOut.symbol}</span>
            <ChevronDown size={13} className="text-white/40 ml-auto" />
          </button>
        </div>
      </div>

      {/* Amount */}
      <div>
        <p className="text-xs text-white/40 mb-1.5">Amount to sell</p>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <input
            type="number" placeholder="0.0" value={amountIn} min="0"
            onChange={e => setAmountIn(e.target.value)}
            className="flex-1 bg-transparent text-lg font-mono text-white outline-none placeholder-white/20"
          />
          <span className="text-sm font-semibold text-white/50">{tokenIn.symbol}</span>
        </div>
        {amountIn && <p className="text-xs text-white/30 mt-1 ml-1">≈ ${(parseFloat(amountIn || '0') * tokenIn.price).toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>}
      </div>

      {/* Target price */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-white/40">Limit price (per {tokenIn.symbol})</p>
          <button
            onClick={() => setTargetPrice(marketRate.toFixed(tokenOut.price < 1 ? 6 : 4))}
            className="text-xs hover:underline"
            style={{ color: '#00D4FF' }}
          >
            Market: {tokenOut.price < 1 ? marketRate.toFixed(6) : marketRate.toFixed(4)} {tokenOut.symbol}
          </button>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <input
            type="number" placeholder="0.0" value={targetPrice} min="0"
            onChange={e => setTargetPrice(e.target.value)}
            className="flex-1 bg-transparent text-lg font-mono text-white outline-none placeholder-white/20"
          />
          <span className="text-sm font-semibold text-white/50">{tokenOut.symbol}</span>
        </div>
        {targetPrice && (
          <p className="text-xs mt-1 ml-1" style={{ color: priceDiff >= 0 ? '#00FF88' : '#FF2D78' }}>
            {priceDiff >= 0 ? '▲' : '▼'} {Math.abs(priceDiff).toFixed(2)}% vs market
          </p>
        )}
      </div>

      {/* Estimated output */}
      {estimatedOut > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)' }}>
          <span className="text-xs text-white/40">You receive (est.)</span>
          <span className="text-sm font-black font-mono" style={{ color: '#00FF88' }}>
            {estimatedOut.toFixed(estimatedOut < 1 ? 6 : 4)} {tokenOut.symbol}
          </span>
        </div>
      )}

      {/* Expiry */}
      <div>
        <p className="text-xs text-white/40 mb-1.5">Expires in</p>
        <div className="flex gap-2">
          {(['1d', '3d', '7d', '30d'] as const).map(e => (
            <button key={e}
              onClick={() => setExpiry(e)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: expiry === e ? 'rgba(123,47,255,0.3)' : 'rgba(255,255,255,0.05)',
                border:     expiry === e ? '1px solid rgba(123,47,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                color:      expiry === e ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
            >{e}</button>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
        style={{ background: 'rgba(255,184,0,0.07)', border: '1px solid rgba(255,184,0,0.15)', color: '#FFB800' }}>
        <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
        <span>
          Limit orders are executed off-chain and filled by our keeper network when the market price reaches your target.
          Orders are stored locally until on-chain settlement is available.
        </span>
      </div>

      {/* Submit */}
      <motion.button
        whileHover={isValid ? { scale: 1.02 } : {}}
        whileTap={isValid ? { scale: 0.98 } : {}}
        onClick={handleCreate}
        disabled={!isValid}
        className="btn-primary text-base"
        style={{
          opacity: isValid ? 1 : 0.4,
          background: 'linear-gradient(135deg, #FC72FF, #7B2FFF)',
        }}
      >
        {!walletConnected ? '🔗 Connect Wallet' : isValid ? `Place Limit Order · ${amountIn} ${tokenIn.symbol}` : 'Enter amount & price'}
      </motion.button>

      <TokenSelectorModal isOpen={showInModal}  onClose={() => setShowInModal(false)}  onSelect={setTokenIn}  excludeToken={tokenOut} />
      <TokenSelectorModal isOpen={showOutModal} onClose={() => setShowOutModal(false)} onSelect={setTokenOut} excludeToken={tokenIn}  />
    </div>
  );
}

/* ── Order row ────────────────────────────────────────────────────────── */
function OrderRow({ order, onCancel }: { order: LimitOrder; onCancel: (id: string) => void }) {
  const style = STATUS_STYLE[order.status];
  const isOpen = order.status === 'open';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass-card p-4"
    >
      <div className="flex items-start gap-3">
        {/* Token pair */}
        <div className="relative w-10 h-7 flex-shrink-0 mt-0.5">
          <img src={order.tokenIn.logoUrl} alt="" className="w-6 h-6 rounded-full absolute left-0"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <img src={order.tokenOut.logoUrl} alt="" className="w-6 h-6 rounded-full absolute left-4"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-white">
              {order.tokenIn.symbol} → {order.tokenOut.symbol}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: style.bg, color: style.color }}>
              {style.label}
            </span>
            {isOpen && (
              <span className="text-xs text-white/30 ml-auto font-mono">
                {formatTimeLeft(order.expiresAt)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-white/30">Sell</span>
              <p className="font-mono text-white/70">{order.amountIn.toFixed(4)} {order.tokenIn.symbol}</p>
            </div>
            <div>
              <span className="text-white/30">At price</span>
              <p className="font-mono" style={{ color: '#FC72FF' }}>
                {order.targetPrice < 1 ? order.targetPrice.toFixed(6) : order.targetPrice.toFixed(4)} {order.tokenOut.symbol}
              </p>
            </div>
            <div>
              <span className="text-white/30">Receive est.</span>
              <p className="font-mono text-white/70">{order.estimatedOut.toFixed(4)} {order.tokenOut.symbol}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-white/20">
            <span>Created {formatTime(order.createdAt)}</span>
            {order.status === 'filled' && order.filledAt && (
              <span style={{ color: '#00FF88' }}>· Filled {formatTime(order.filledAt)}</span>
            )}
          </div>
        </div>

        {isOpen && (
          <button
            onClick={() => onCancel(order.id)}
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────── */
export default function LimitOrdersPage() {
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [tab, setTab] = useState<'open' | 'history'>('open');

  useEffect(() => {
    setOrders(loadOrders());
  }, []);

  const addOrder = (order: LimitOrder) => {
    const updated = [order, ...orders];
    setOrders(updated);
    saveOrders(updated);
  };

  const cancelOrder = (id: string) => {
    const updated = orders.map(o => o.id === id ? { ...o, status: 'cancelled' as OrderStatus } : o);
    setOrders(updated);
    saveOrders(updated);
  };

  const clearHistory = () => {
    const updated = orders.filter(o => o.status === 'open');
    setOrders(updated);
    saveOrders(updated);
  };

  const openOrders    = orders.filter(o => o.status === 'open');
  const historyOrders = orders.filter(o => o.status !== 'open');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-black text-white flex items-center gap-2 mb-5">
              <Target size={22} style={{ color: '#FC72FF' }} />
              Limit Orders
            </h1>
            <NewOrderForm onCreated={addOrder} />
          </motion.div>
        </div>

        {/* Orders list */}
        <div className="lg:col-span-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Open Orders', value: openOrders.length, color: '#00D4FF' },
                { label: 'Filled', value: orders.filter(o => o.status === 'filled').length, color: '#00FF88' },
                { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, color: '#FF2D78' },
              ].map(({ label, value, color }) => (
                <div key={label} className="glass-card p-3 text-center">
                  <p className="text-2xl font-black font-mono" style={{ color }}>{value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Tab */}
            <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {(['open', 'history'] as const).map(t => (
                <button key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                  style={{
                    background: tab === t ? 'rgba(123,47,255,0.3)' : 'transparent',
                    color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {t === 'open' ? `Open (${openOrders.length})` : `History (${historyOrders.length})`}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {(tab === 'open' ? openOrders : historyOrders).map(order => (
                  <OrderRow key={order.id} order={order} onCancel={cancelOrder} />
                ))}
              </AnimatePresence>
            </div>

            {/* Empty states */}
            {tab === 'open' && openOrders.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(252,114,255,0.1)', border: '1px solid rgba(252,114,255,0.2)' }}>
                  <Target size={28} style={{ color: '#FC72FF' }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No open orders</h3>
                <p className="text-sm text-white/40 max-w-xs">
                  Place your first limit order using the form on the left.
                  Your order will be filled automatically when the market hits your target price.
                </p>
              </motion.div>
            )}

            {tab === 'history' && historyOrders.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center">
                <Clock size={32} className="text-white/20 mb-3" />
                <p className="text-sm text-white/40">No order history yet</p>
              </motion.div>
            )}

            {tab === 'history' && historyOrders.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-red-400 transition-colors mt-3"
              >
                <Trash2 size={12} /> Clear history
              </button>
            )}

            {/* How it works */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="mt-6 rounded-xl p-4 space-y-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={12} /> How limit orders work
              </h4>
              {[
                { icon: Target, text: 'Set the price at which you want to buy or sell', color: '#FC72FF' },
                { icon: Clock,  text: 'Your order is monitored by our keeper network 24/7', color: '#00D4FF' },
                { icon: Zap,    text: 'When the market hits your price, it executes via Uniswap v3', color: '#7B2FFF' },
                { icon: CheckCircle, text: 'Tokens arrive in your wallet automatically', color: '#00FF88' },
              ].map(({ icon: Icon, text, color }, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${color}18` }}>
                    <Icon size={12} style={{ color }} />
                  </div>
                  <p className="text-xs text-white/40">{text}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
