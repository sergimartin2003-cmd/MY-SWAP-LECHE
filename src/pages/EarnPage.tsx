import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Lock, Zap, ChevronDown, Plus, Info, CheckCircle,
  X, AlertTriangle, Layers, RefreshCw,
} from 'lucide-react';
import { useStore } from '../store/useStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type EarnCategory = 'Staking' | 'Farming' | 'Vault';
type FilterTab = 'All' | EarnCategory;
type SortKey = 'apy' | 'tvl' | 'new';

interface EarnOpportunity {
  id: string;
  name: string;
  description: string;
  category: EarnCategory;
  apy: number;
  tvlRaw: number;   // in USD
  lockDays: number; // 0 = no lock
  rewards: string[];
  tokens: string[]; // display labels for the circles
  isNew?: boolean;
  isHot?: boolean;
}

interface UserPosition {
  id: string;
  depositUsd: number;
  claimableUsd: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const EARN_OPPORTUNITIES: EarnOpportunity[] = [
  {
    id: 'nsx-staking',
    name: 'NSX Staking',
    description: 'Stake NSX governance token and earn protocol rewards',
    category: 'Staking',
    apy: 18.4,
    tvlRaw: 24_200_000,
    lockDays: 30,
    rewards: ['NSX'],
    tokens: ['N'],
  },
  {
    id: 'eth-liquid',
    name: 'ETH Liquid Staking',
    description: 'Stake ETH, receive stETH — always liquid',
    category: 'Staking',
    apy: 4.8,
    tvlRaw: 142_000_000,
    lockDays: 0,
    rewards: ['ETH'],
    tokens: ['E'],
  },
  {
    id: 'usdc-staking',
    name: 'USDC Staking',
    description: 'Single-asset USDC vault with no impermanent loss',
    category: 'Staking',
    apy: 8.2,
    tvlRaw: 38_000_000,
    lockDays: 0,
    rewards: ['USDC'],
    tokens: ['U'],
  },
  {
    id: 'eth-usdc-farm',
    name: 'ETH / USDC LP Farm',
    description: 'Provide ETH-USDC liquidity and earn boosted rewards',
    category: 'Farming',
    apy: 24.5,
    tvlRaw: 42_000_000,
    lockDays: 7,
    rewards: ['NSX', 'Fees'],
    tokens: ['E', 'U'],
    isHot: true,
  },
  {
    id: 'wbtc-eth-farm',
    name: 'WBTC / ETH LP Farm',
    description: 'Blue-chip BTC-ETH pair with NSX emission rewards',
    category: 'Farming',
    apy: 19.2,
    tvlRaw: 28_000_000,
    lockDays: 7,
    rewards: ['NSX', 'Fees'],
    tokens: ['B', 'E'],
  },
  {
    id: 'matic-usdc-farm',
    name: 'MATIC / USDC LP Farm',
    description: 'High-yield emerging pair — higher risk, higher reward',
    category: 'Farming',
    apy: 32.1,
    tvlRaw: 8_400_000,
    lockDays: 14,
    rewards: ['NSX'],
    tokens: ['M', 'U'],
    isNew: true,
  },
  {
    id: 'blue-chip-vault',
    name: 'Blue-Chip Vault',
    description: 'Auto-compounds your ETH + USDC position daily',
    category: 'Vault',
    apy: 11.3,
    tvlRaw: 31_000_000,
    lockDays: 0,
    rewards: ['Auto'],
    tokens: ['E', 'U'],
  },
  {
    id: 'stablecoin-vault',
    name: 'Stablecoin Vault',
    description: 'USDC + USDT + DAI diversified stable yield',
    category: 'Vault',
    apy: 9.7,
    tvlRaw: 19_000_000,
    lockDays: 0,
    rewards: ['Auto'],
    tokens: ['U', 'T', 'D'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTvl(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function apyColor(apy: number): string {
  if (apy >= 25) return '#FC72FF';
  if (apy >= 15) return '#00FF88';
  return '#00D4FF';
}

const TOKEN_COLORS: Record<string, string> = {
  N: '#7B2FFF',
  E: '#627EEA',
  U: '#2775CA',
  B: '#F7931A',
  M: '#8247E5',
  T: '#26A17B',
  D: '#F5AC37',
};

function TokenCircle({ letter, size = 28 }: { letter: string; size?: number }) {
  const bg = TOKEN_COLORS[letter] ?? '#444';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 800,
        color: '#fff',
        border: '2px solid rgba(255,255,255,0.12)',
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}

function TokenPair({ tokens }: { tokens: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: tokens.length * 20 + 8 }}>
      {tokens.map((t, i) => (
        <div key={i} style={{ position: 'absolute', left: i * 20 }}>
          <TokenCircle letter={t} size={30} />
        </div>
      ))}
    </div>
  );
}

function categoryIcon(cat: EarnCategory) {
  if (cat === 'Staking') return <Lock size={11} />;
  if (cat === 'Farming') return <Zap size={11} />;
  return <RefreshCw size={11} />;
}

function categoryColor(cat: EarnCategory): string {
  if (cat === 'Staking') return '#00D4FF';
  if (cat === 'Farming') return '#00FF88';
  return '#FC72FF';
}

// ─── Deposit Modal ─────────────────────────────────────────────────────────────

interface DepositModalProps {
  item: EarnOpportunity;
  onClose: () => void;
  onConfirm: (itemId: string, amountUsd: number) => void;
}

function DepositModal({ item, onClose, onConfirm }: DepositModalProps) {
  const [amount, setAmount] = useState('');

  const numAmount = parseFloat(amount) || 0;
  const dailyEarnings = numAmount * (item.apy / 100) / 365;
  const weeklyEarnings = dailyEarnings * 7;
  const monthlyEarnings = dailyEarnings * 30;

  function handleConfirm() {
    if (numAmount <= 0) return;
    onConfirm(item.id, numAmount);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'linear-gradient(135deg, #12093a 0%, #080420 100%)',
          border: '1px solid rgba(123,47,255,0.3)',
          borderRadius: 20,
          padding: '1.5rem',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TokenPair tokens={item.tokens} />
            <div style={{ marginLeft: item.tokens.length * 20 - 4 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{item.name}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* APY badge */}
        <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: 12, background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.18)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Current APY</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: apyColor(item.apy), fontFamily: 'monospace' }}>{item.apy}%</span>
        </div>

        {/* Amount input */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Deposit Amount (USD)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>$</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 22, fontWeight: 700, color: '#fff', width: '100%', fontFamily: 'monospace' }}
            />
          </div>
          {/* Quick amounts */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {[100, 500, 1000, 5000].map(v => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                style={{ flex: 1, background: 'rgba(123,47,255,0.12)', border: '1px solid rgba(123,47,255,0.25)', borderRadius: 8, padding: '4px 0', fontSize: 11, color: '#a478ff', cursor: 'pointer', fontWeight: 600 }}
              >
                ${v >= 1000 ? `${v / 1000}K` : v}
              </button>
            ))}
          </div>
        </div>

        {/* Earnings estimate */}
        {numAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginBottom: '1rem', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12, padding: '0.75rem 1rem' }}
          >
            <p style={{ fontSize: 11, color: 'rgba(0,212,255,0.7)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Estimated Earnings</p>
            {[['Daily', dailyEarnings], ['Weekly', weeklyEarnings], ['Monthly', monthlyEarnings]].map(([label, val]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: '#00D4FF' }}>
                  +${(val as number).toFixed(4)}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Lock info */}
        {item.lockDays > 0 && (
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.18)', borderRadius: 10, padding: '0.6rem 0.9rem' }}>
            <Lock size={13} style={{ color: '#FFB800', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#FFB800' }}>Funds locked for <strong>{item.lockDays} days</strong> after deposit</span>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(255,45,120,0.05)', border: '1px solid rgba(255,45,120,0.14)', borderRadius: 10, padding: '0.6rem 0.9rem' }}>
          <AlertTriangle size={13} style={{ color: '#FF2D78', flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
            Yields are variable and not guaranteed. Past performance is not indicative of future returns.
          </span>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: numAmount > 0 ? 1.02 : 1, boxShadow: numAmount > 0 ? '0 0 30px rgba(123,47,255,0.45)' : 'none' }}
          whileTap={{ scale: numAmount > 0 ? 0.97 : 1 }}
          onClick={handleConfirm}
          disabled={numAmount <= 0}
          style={{
            width: '100%', padding: '0.875rem', borderRadius: 14, border: 'none',
            background: numAmount > 0 ? 'linear-gradient(135deg, #7B2FFF, #00D4FF)' : 'rgba(255,255,255,0.07)',
            color: numAmount > 0 ? '#fff' : 'rgba(255,255,255,0.25)',
            fontSize: 15, fontWeight: 700, cursor: numAmount > 0 ? 'pointer' : 'default',
            transition: 'background 0.2s',
          }}
        >
          {numAmount > 0 ? `Confirm Deposit — $${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Enter an amount'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Earn Card ─────────────────────────────────────────────────────────────────

interface EarnCardProps {
  item: EarnOpportunity;
  position?: UserPosition;
  onDeposit: (item: EarnOpportunity) => void;
  onClaim: (itemId: string) => void;
  delay?: number;
}

function EarnCard({ item, position, onDeposit, onClaim, delay = 0 }: EarnCardProps) {
  const catColor = categoryColor(item.category);
  const color = apyColor(item.apy);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 240, damping: 22 }}
      whileHover={{ y: -3, boxShadow: `0 16px 50px rgba(0,0,0,0.4), 0 0 0 1px ${catColor}22` }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18,
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        transition: 'box-shadow 0.25s, transform 0.25s',
      }}
    >
      {/* Top row: token pair + name + category badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ position: 'relative', width: item.tokens.length > 1 ? item.tokens.length * 20 + 8 : 32, height: 32, flexShrink: 0 }}>
          <TokenPair tokens={item.tokens} />
        </div>
        <div style={{ flex: 1, marginLeft: item.tokens.length > 1 ? item.tokens.length * 20 - 4 : 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{item.name}</span>
            {item.isHot && (
              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: 'rgba(252,114,255,0.18)', color: '#FC72FF', fontWeight: 700, border: '1px solid rgba(252,114,255,0.3)' }}>HOT</span>
            )}
            {item.isNew && (
              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: 'rgba(0,255,136,0.15)', color: '#00FF88', fontWeight: 700, border: '1px solid rgba(0,255,136,0.3)' }}>NEW</span>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{item.description}</p>
        </div>
        {/* Category badge */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 9px', borderRadius: 20, background: `${catColor}18`, color: catColor, fontWeight: 700, border: `1px solid ${catColor}33`, flexShrink: 0 }}>
          {categoryIcon(item.category)} {item.category}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {/* APY */}
        <div style={{ background: `${color}0f`, border: `1px solid ${color}28`, borderRadius: 10, padding: '0.5rem 0.75rem' }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>APY</p>
          <p style={{ fontSize: 20, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1 }}>{item.apy}%</p>
        </div>
        {/* TVL */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.5rem 0.75rem' }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>TVL</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{formatTvl(item.tvlRaw)}</p>
        </div>
        {/* Lock */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.5rem 0.75rem' }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Lock</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Lock size={11} style={{ color: item.lockDays > 0 ? '#FFB800' : '#00FF88' }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: item.lockDays > 0 ? '#FFB800' : '#00FF88' }}>
              {item.lockDays > 0 ? `${item.lockDays}d` : 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* Rewards row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>Rewards:</span>
        {item.rewards.map(r => (
          <span
            key={r}
            style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(123,47,255,0.18)', color: '#a478ff', fontWeight: 700, border: '1px solid rgba(123,47,255,0.3)' }}
          >
            {r}
          </span>
        ))}
      </div>

      {/* User deposit row */}
      {position && (
        <div style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.18)', borderRadius: 10, padding: '0.5rem 0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Your Deposit</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#00FF88', fontFamily: 'monospace' }}>${position.depositUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Claimable</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#00D4FF', fontFamily: 'monospace' }}>${position.claimableUsd.toFixed(4)}</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: '0 0 22px rgba(123,47,255,0.4)' }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onDeposit(item)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.6rem 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7B2FFF, #00D4FF)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          <Plus size={14} /> Deposit
        </motion.button>
        {position && (
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 18px rgba(0,255,136,0.3)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onClaim(item.id)}
            style={{ padding: '0.6rem 1rem', borderRadius: 12, border: '1px solid rgba(0,255,136,0.35)', background: 'rgba(0,255,136,0.08)', color: '#00FF88', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Claim
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const FILTER_TABS: FilterTab[] = ['All', 'Staking', 'Farming', 'Vault'];
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'apy', label: 'APY (Highest)' },
  { key: 'tvl', label: 'TVL' },
  { key: 'new', label: 'New' },
];

const TOTAL_TVL = EARN_OPPORTUNITIES.reduce((s, o) => s + o.tvlRaw, 0);

export default function EarnPage() {
  const { walletConnected, connectWallet, addNotification } = useStore();

  const [filterTab, setFilterTab] = useState<FilterTab>('All');
  const [sortKey, setSortKey] = useState<SortKey>('apy');
  const [sortOpen, setSortOpen] = useState(false);
  const [modalItem, setModalItem] = useState<EarnOpportunity | null>(null);
  const [positions, setPositions] = useState<Record<string, UserPosition>>({});

  // Filter + sort
  const visible = EARN_OPPORTUNITIES
    .filter(o => {
      if (filterTab === 'All') return true;
      if (filterTab === 'Vault') return o.category === 'Vault';
      return o.category === filterTab;
    })
    .sort((a, b) => {
      if (sortKey === 'apy') return b.apy - a.apy;
      if (sortKey === 'tvl') return b.tvlRaw - a.tvlRaw;
      // 'new': prioritize isNew, then isHot
      const score = (x: EarnOpportunity) => (x.isNew ? 2 : 0) + (x.isHot ? 1 : 0);
      return score(b) - score(a);
    });

  const userTotalDeposit = Object.values(positions).reduce((s, p) => s + p.depositUsd, 0);

  function handleDeposit(item: EarnOpportunity) {
    if (!walletConnected) {
      connectWallet();
      return;
    }
    setModalItem(item);
  }

  function handleConfirmDeposit(itemId: string, amountUsd: number) {
    setPositions(prev => {
      const existing = prev[itemId];
      return {
        ...prev,
        [itemId]: {
          id: itemId,
          depositUsd: (existing?.depositUsd ?? 0) + amountUsd,
          claimableUsd: existing?.claimableUsd ?? 0,
        },
      };
    });
    const item = EARN_OPPORTUNITIES.find(o => o.id === itemId);
    addNotification({
      type: 'success',
      title: 'Deposit Confirmed',
      message: `$${amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} deposited into ${item?.name ?? 'vault'}.`,
    });
  }

  function handleClaim(itemId: string) {
    const pos = positions[itemId];
    if (!pos || pos.claimableUsd <= 0) return;
    const claimed = pos.claimableUsd;
    setPositions(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], claimableUsd: 0 },
    }));
    const item = EARN_OPPORTUNITIES.find(o => o.id === itemId);
    addNotification({
      type: 'success',
      title: 'Rewards Claimed',
      message: `$${claimed.toFixed(4)} in rewards claimed from ${item?.name ?? 'vault'}.`,
    });
  }

  const sortLabel = SORT_OPTIONS.find(s => s.key === sortKey)?.label ?? 'Sort';
  const positionEntries = Object.entries(positions).filter(([, p]) => p.depositUsd > 0);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <TrendingUp size={24} style={{ color: '#7B2FFF' }} />
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>Earn</h1>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', marginBottom: '1.25rem' }}>
            Stake tokens, farm rewards, earn yield on your crypto
          </p>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Value Locked', value: formatTvl(TOTAL_TVL), color: '#7B2FFF' },
              {
                label: 'Your Deposits',
                value: walletConnected ? `$${userTotalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00',
                color: '#00FF88',
              },
              { label: 'Platform APY', value: 'Up to 32.1%', color: '#00D4FF' },
            ].map(chip => (
              <div
                key={chip.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '0.5rem 1rem',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: chip.color, boxShadow: `0 0 8px ${chip.color}` }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{chip.label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: chip.color, fontFamily: 'monospace' }}>{chip.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Filter + Sort bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 10 }}
        >
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 4 }}>
            {FILTER_TABS.map(tab => {
              const active = filterTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  style={{
                    padding: '0.4rem 1rem', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700,
                    background: active ? 'linear-gradient(135deg, #7B2FFF, #00D4FF)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Sort dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setSortOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.45rem 1rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <Layers size={13} style={{ color: '#7B2FFF' }} />
              Sort: {sortLabel}
              <ChevronDown size={13} style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, background: '#12093a', border: '1px solid rgba(123,47,255,0.3)', borderRadius: 12, overflow: 'hidden', minWidth: 170, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
                >
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setSortKey(opt.key); setSortOpen(false); }}
                      style={{ width: '100%', padding: '0.6rem 1rem', border: 'none', background: sortKey === opt.key ? 'rgba(123,47,255,0.18)' : 'transparent', color: sortKey === opt.key ? '#a478ff' : 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left', borderLeft: sortKey === opt.key ? '2px solid #7B2FFF' : '2px solid transparent' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Earn Cards Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          <AnimatePresence mode="popLayout">
            {visible.map((item, i) => (
              <EarnCard
                key={item.id}
                item={item}
                position={positions[item.id]}
                onDeposit={handleDeposit}
                onClaim={handleClaim}
                delay={i * 0.05}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* ── My Positions ── */}
        {walletConnected && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
              <CheckCircle size={16} style={{ color: '#00FF88' }} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>My Positions</h2>
            </div>

            {positionEntries.length === 0 ? (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '2.5rem', textAlign: 'center' }}>
                <Info size={28} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: 10 }} />
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>No active positions yet</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', marginTop: 4 }}>Deposit into any earn opportunity above to get started.</p>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12, padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <div>Position</div>
                  <div style={{ textAlign: 'right' }}>Deposited</div>
                  <div style={{ textAlign: 'right' }}>APY</div>
                  <div style={{ textAlign: 'right' }}>Claimable</div>
                  <div />
                </div>
                {positionEntries.map(([id, pos], i) => {
                  const item = EARN_OPPORTUNITIES.find(o => o.id === id)!;
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12, padding: '0.875rem 1.25rem', borderBottom: i < positionEntries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ position: 'relative', width: item.tokens.length * 20 + 4, height: 28, flexShrink: 0 }}>
                          <TokenPair tokens={item.tokens} />
                        </div>
                        <div style={{ marginLeft: item.tokens.length > 1 ? item.tokens.length * 20 - 6 : 4 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{item.name}</p>
                          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{item.category}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                        ${pos.depositUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: apyColor(item.apy), fontFamily: 'monospace' }}>
                        {item.apy}%
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#00D4FF', fontFamily: 'monospace' }}>
                        ${pos.claimableUsd.toFixed(4)}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleClaim(id)}
                        disabled={pos.claimableUsd <= 0}
                        style={{ padding: '0.35rem 0.75rem', borderRadius: 8, border: '1px solid rgba(0,255,136,0.35)', background: pos.claimableUsd > 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.04)', color: pos.claimableUsd > 0 ? '#00FF88' : 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700, cursor: pos.claimableUsd > 0 ? 'pointer' : 'default' }}
                      >
                        Claim
                      </motion.button>
                    </motion.div>
                  );
                })}
                {/* Footer total */}
                <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Deposited</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#00FF88', fontFamily: 'monospace' }}>
                    ${userTotalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Connect wallet prompt (not connected) ── */}
        {!walletConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ background: 'rgba(123,47,255,0.07)', border: '1px solid rgba(123,47,255,0.22)', borderRadius: 16, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
          >
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Track your positions</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Connect your wallet to deposit and track your earnings across all pools.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(123,47,255,0.45)' }}
              whileTap={{ scale: 0.96 }}
              onClick={connectWallet}
              style={{ padding: '0.6rem 1.5rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7B2FFF, #00D4FF)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Connect Wallet
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* ── Deposit Modal ── */}
      <AnimatePresence>
        {modalItem && (
          <DepositModal
            item={modalItem}
            onClose={() => setModalItem(null)}
            onConfirm={handleConfirmDeposit}
          />
        )}
      </AnimatePresence>
    </>
  );
}
