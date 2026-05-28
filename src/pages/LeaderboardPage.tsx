import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Medal, TrendingUp, Zap, Crown, Star, Award, Users, BarChart2,
} from 'lucide-react';
import { useStore } from '../store/useStore';

/* ── Types ──────────────────────────────────────────────────────────────── */
type SortKey = 'Volume' | 'PnL' | 'Swaps' | 'Referrals';
type TimeFilter = '24h' | '7d' | '30d' | 'All Time';
type Tier = 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';

interface Trader {
  rank: number;
  addr: string;
  vol: number;
  pnl: number;
  swaps: number;
  refs: number;
  change24h: number;
  tier: Tier;
}

/* ── Constants ───────────────────────────────────────────────────────────── */
const TIER_COLOR: Record<Tier, string> = {
  Diamond: '#00D4FF',
  Platinum: '#E5E4E2',
  Gold: '#FFB800',
  Silver: '#C0C0C0',
  Bronze: '#CD7F32',
};

const TIER_GLOW: Record<Tier, string> = {
  Diamond: 'rgba(0,212,255,0.3)',
  Platinum: 'rgba(229,228,226,0.2)',
  Gold: 'rgba(255,184,0,0.3)',
  Silver: 'rgba(192,192,192,0.2)',
  Bronze: 'rgba(205,127,50,0.2)',
};

const TRADERS: Trader[] = [
  { rank: 1,  addr: '0x7f3a...9b2c', vol: 48_200_000, pnl: 284_000,  swaps: 1847, refs: 312, change24h:  8.4, tier: 'Diamond'  },
  { rank: 2,  addr: '0x2e1b...4d8a', vol: 31_500_000, pnl: 198_000,  swaps: 1203, refs: 241, change24h:  5.1, tier: 'Diamond'  },
  { rank: 3,  addr: '0x9c4f...2e1d', vol: 28_900_000, pnl: 156_000,  swaps: 987,  refs: 188, change24h: -2.3, tier: 'Platinum' },
  { rank: 4,  addr: '0x4a8d...7c3e', vol: 22_100_000, pnl: 134_500,  swaps: 843,  refs: 155, change24h:  3.7, tier: 'Platinum' },
  { rank: 5,  addr: '0x1b6c...8f5a', vol: 18_700_000, pnl: 112_000,  swaps: 721,  refs: 134, change24h:  1.2, tier: 'Platinum' },
  { rank: 6,  addr: '0x3d9e...1a4b', vol: 15_300_000, pnl:  98_200,  swaps: 634,  refs: 109, change24h: -0.8, tier: 'Platinum' },
  { rank: 7,  addr: '0x8f2a...5c7d', vol: 12_800_000, pnl:  87_400,  swaps: 578,  refs:  93, change24h:  6.2, tier: 'Gold'     },
  { rank: 8,  addr: '0x5e7b...9d2f', vol: 10_400_000, pnl:  74_100,  swaps: 512,  refs:  82, change24h:  2.9, tier: 'Gold'     },
  { rank: 9,  addr: '0x6c1d...3a8e', vol:  8_900_000, pnl:  63_800,  swaps: 467,  refs:  71, change24h: -4.1, tier: 'Gold'     },
  { rank: 10, addr: '0xb3f8...2e6c', vol:  7_600_000, pnl:  54_200,  swaps: 423,  refs:  64, change24h:  1.8, tier: 'Gold'     },
  { rank: 11, addr: '0xa2c4...7b1d', vol:  6_500_000, pnl:  46_700,  swaps: 389,  refs:  57, change24h:  0.5, tier: 'Gold'     },
  { rank: 12, addr: '0x0d5e...4f9a', vol:  5_700_000, pnl:  40_300,  swaps: 351,  refs:  48, change24h: -1.4, tier: 'Gold'     },
  { rank: 13, addr: '0xc9b1...6e3f', vol:  4_900_000, pnl:  34_800,  swaps: 318,  refs:  41, change24h:  3.3, tier: 'Silver'   },
  { rank: 14, addr: '0xd7a3...8c2b', vol:  4_200_000, pnl:  29_600,  swaps: 287,  refs:  37, change24h: -2.7, tier: 'Silver'   },
  { rank: 15, addr: '0xe6f2...1d4a', vol:  3_600_000, pnl:  25_100,  swaps: 261,  refs:  33, change24h:  4.8, tier: 'Silver'   },
  { rank: 16, addr: '0xf4b8...9e5c', vol:  3_100_000, pnl:  21_400,  swaps: 238,  refs:  29, change24h:  1.1, tier: 'Silver'   },
  { rank: 17, addr: '0x12d6...3b7f', vol:  2_700_000, pnl:  18_200,  swaps: 214,  refs:  26, change24h: -0.3, tier: 'Silver'   },
  { rank: 18, addr: '0x23e9...5c1a', vol:  2_300_000, pnl:  15_400,  swaps: 193,  refs:  22, change24h:  2.1, tier: 'Silver'   },
  { rank: 19, addr: '0x34f1...7d8b', vol:  1_950_000, pnl:  12_900,  swaps: 174,  refs:  19, change24h: -3.6, tier: 'Silver'   },
  { rank: 20, addr: '0x45a4...2e9c', vol:  1_650_000, pnl:  10_700,  swaps: 157,  refs:  17, change24h:  0.7, tier: 'Bronze'   },
  { rank: 21, addr: '0x56b7...4f1d', vol:  1_380_000, pnl:   8_900,  swaps: 142,  refs:  14, change24h:  5.4, tier: 'Bronze'   },
  { rank: 22, addr: '0x67c0...6a3e', vol:  1_140_000, pnl:   7_300,  swaps: 128,  refs:  12, change24h: -1.9, tier: 'Bronze'   },
  { rank: 23, addr: '0x78d3...8b5f', vol:    920_000, pnl:   5_900,  swaps: 115,  refs:  10, change24h:  3.0, tier: 'Bronze'   },
  { rank: 24, addr: '0x89e6...1c7a', vol:    730_000, pnl:   4_700,  swaps: 103,  refs:   8, change24h: -0.6, tier: 'Bronze'   },
  { rank: 25, addr: '0x90f9...3d2b', vol:    570_000, pnl:   3_700,  swaps:  92,  refs:   7, change24h:  1.4, tier: 'Bronze'   },
];

const PRIZES = [
  { place: '1st',      amount: '$10,000 USDC', color: '#FFB800' },
  { place: '2nd',      amount: '$5,000 USDC',  color: '#C0C0C0' },
  { place: '3rd',      amount: '$2,500 USDC',  color: '#CD7F32' },
  { place: '4th–10th', amount: '$500 each',    color: '#7B2FFF' },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmtVol = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
};

const fmtPnl = (n: number) => {
  const sign = n >= 0 ? '+' : '';
  if (Math.abs(n) >= 1e6) return `${sign}$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `${sign}$${(n / 1e3).toFixed(1)}K`;
  return `${sign}$${n}`;
};

const initials = (addr: string) => addr.slice(2, 4).toUpperCase();

const avatarColor = (addr: string) => {
  const colors = ['#7B2FFF', '#00D4FF', '#FC72FF', '#00FF88', '#FFB800'];
  const idx = parseInt(addr.replace(/\D/g, '').slice(0, 4) || '0', 10) % colors.length;
  return colors[idx];
};

const rankMedal = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : '🥉';

/* ── Countdown hook ──────────────────────────────────────────────────────── */
function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTimeLeft({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}

/* ── Sub-components ──────────────────────────────────────────────────────── */
function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span style={{
      color: TIER_COLOR[tier],
      border: `1px solid ${TIER_COLOR[tier]}44`,
      background: `${TIER_COLOR[tier]}18`,
      fontSize: '0.7rem',
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 999,
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
      whiteSpace: 'nowrap' as const,
    }}>
      {tier}
    </span>
  );
}

function Avatar({ addr, size = 40 }: { addr: string; size?: number }) {
  const bg = avatarColor(addr);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${bg}, ${bg}88)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 800, color: '#fff',
      boxShadow: `0 0 12px ${bg}55`,
      flexShrink: 0,
      userSelect: 'none' as const,
    }}>
      {initials(addr)}
    </div>
  );
}

function PodiumCard({ trader, platformHeight }: { trader: Trader; platformHeight: number }) {
  const isFirst = trader.rank === 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: trader.rank * 0.12, type: 'spring', stiffness: 120 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
    >
      {isFirst && (
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        >
          <Crown size={26} color="#FFB800" />
        </motion.div>
      )}

      <div style={{ fontSize: isFirst ? 28 : 22 }}>{rankMedal(trader.rank)}</div>

      <Avatar addr={trader.addr} size={isFirst ? 64 : 50} />

      <div style={{ textAlign: 'center', maxWidth: 130 }}>
        <div style={{
          fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600,
          fontFamily: 'monospace', marginBottom: 4,
        }}>
          {trader.addr}
        </div>
        <TierBadge tier={trader.tier} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Volume</div>
        <div style={{
          fontSize: isFirst ? '1rem' : '0.88rem',
          fontWeight: 800, color: '#00D4FF',
        }}>
          {fmtVol(trader.vol)}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>PnL</div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#00FF88' }}>
          {fmtPnl(trader.pnl)}
        </div>
      </div>

      {/* Podium platform */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.4 + trader.rank * 0.1, duration: 0.5, ease: 'easeOut' }}
        style={{ transformOrigin: 'bottom', width: '100%' }}
      >
        <div style={{
          height: platformHeight,
          background: `linear-gradient(180deg, ${TIER_GLOW[trader.tier]}, transparent)`,
          borderTop: `2px solid ${TIER_COLOR[trader.tier]}77`,
          borderLeft: `1px solid ${TIER_COLOR[trader.tier]}33`,
          borderRight: `1px solid ${TIER_COLOR[trader.tier]}33`,
          borderRadius: '8px 8px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', fontWeight: 900, color: TIER_COLOR[trader.tier],
          marginTop: 8,
        }}>
          #{trader.rank}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatChip({
  label, value, icon: Icon, color,
}: {
  label: string; value: string; icon: React.ElementType; color: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '8px 16px',
      whiteSpace: 'nowrap' as const,
    }}>
      <Icon size={15} color={color} />
      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff' }}>{value}</span>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function LeaderboardPage() {
  const { walletAddress, walletConnected } = useStore();

  const [sortKey, setSortKey] = useState<SortKey>('Volume');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d');

  const nextDistribution = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  }, []);
  const countdown = useCountdown(nextDistribution);

  const sortedTraders = useMemo(() => {
    const key: Record<SortKey, keyof Trader> = {
      Volume: 'vol', PnL: 'pnl', Swaps: 'swaps', Referrals: 'refs',
    };
    return [...TRADERS]
      .sort((a, b) => (b[key[sortKey]] as number) - (a[key[sortKey]] as number))
      .map((t, i) => ({ ...t, rank: i + 1 }));
  }, [sortKey]);

  const top3 = sortedTraders.slice(0, 3);
  const rest = sortedTraders.slice(3, 25);

  const userRank = 8432;
  const userProgress = 34;

  /* ── Unused import guard (TrendingUp is used implicitly via lucide) ── */
  void TrendingUp;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ minHeight: '100vh', color: '#fff' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,184,0,0.12)',
              border: '1px solid rgba(255,184,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Trophy size={22} color="#FFB800" />
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, letterSpacing: '-0.01em' }}>
              Leaderboard
            </h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', margin: '0 0 20px', fontSize: '0.92rem' }}>
            Top traders by volume, PnL, and activity
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <StatChip label="Total Traders" value="12,847"           icon={Users}    color="#7B2FFF" />
            <StatChip label="24h Volume"    value="$1.2B"             icon={BarChart2} color="#00D4FF" />
            <StatChip label="Prize Pool"    value="$25,000 USDC / mo" icon={Trophy}   color="#FFB800" />
          </div>
        </div>

        {/* ── Filter Tabs ────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 12,
          justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 36,
        }}>
          <div style={{
            display: 'flex', gap: 4,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: 4,
          }}>
            {(['Volume', 'PnL', 'Swaps', 'Referrals'] as SortKey[]).map(k => (
              <button
                key={k}
                onClick={() => setSortKey(k)}
                style={{
                  padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                  background: sortKey === k ? 'rgba(123,47,255,0.5)' : 'transparent',
                  color: sortKey === k ? '#fff' : 'rgba(255,255,255,0.5)',
                  boxShadow: sortKey === k ? '0 0 14px rgba(123,47,255,0.35)' : 'none',
                }}
              >
                {k}
              </button>
            ))}
          </div>

          <div style={{
            display: 'flex', gap: 4,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: 4,
          }}>
            {(['24h', '7d', '30d', 'All Time'] as TimeFilter[]).map(t => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s',
                  background: timeFilter === t ? 'rgba(0,212,255,0.18)' : 'transparent',
                  color: timeFilter === t ? '#00D4FF' : 'rgba(255,255,255,0.45)',
                  boxShadow: timeFilter === t ? '0 0 10px rgba(0,212,255,0.2)' : 'none',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Podium ─────────────────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: '32px 24px 0',
          marginBottom: 28,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* radial glow backdrop */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(123,47,255,0.15) 0%, transparent 70%)',
          }} />

          <h2 style={{
            textAlign: 'center', fontSize: '0.72rem', letterSpacing: '0.18em',
            textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)',
            margin: '0 0 28px', fontWeight: 700,
          }}>
            Top Performers &nbsp;·&nbsp; {timeFilter}
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr 1fr',
            gap: 16,
            alignItems: 'flex-end',
          }}>
            {/* 2nd — left */}
            <PodiumCard trader={top3[1]} platformHeight={68} />
            {/* 1st — center (tallest) */}
            <PodiumCard trader={top3[0]} platformHeight={104} />
            {/* 3rd — right */}
            <PodiumCard trader={top3[2]} platformHeight={48} />
          </div>
        </div>

        {/* ── Leaderboard Table (ranks 4-25) ────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 28,
        }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '56px 1fr 110px 120px 110px 76px 88px',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.68rem', fontWeight: 700,
            letterSpacing: '0.09em', textTransform: 'uppercase' as const,
            color: 'rgba(255,255,255,0.3)',
          }}>
            <span>Rank</span>
            <span>Trader</span>
            <span>Tier</span>
            <span style={{ textAlign: 'right' }}>Volume</span>
            <span style={{ textAlign: 'right' }}>PnL</span>
            <span style={{ textAlign: 'right' }}>Swaps</span>
            <span style={{ textAlign: 'right' }}>24h Chg</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={sortKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {rest.map((trader, i) => (
                <motion.div
                  key={trader.addr}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.018 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '56px 1fr 110px 120px 110px 76px 88px',
                    padding: '11px 20px',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    fontSize: '0.88rem', fontWeight: 700,
                    color: trader.rank <= 10 ? '#FFB800' : 'rgba(255,255,255,0.4)',
                  }}>
                    #{trader.rank}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                    <Avatar addr={trader.addr} size={30} />
                    <span style={{
                      fontSize: '0.78rem', fontFamily: 'monospace',
                      color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {trader.addr}
                    </span>
                  </div>

                  <div><TierBadge tier={trader.tier} /></div>

                  <span style={{ textAlign: 'right', fontWeight: 700, color: '#00D4FF', fontSize: '0.83rem' }}>
                    {fmtVol(trader.vol)}
                  </span>

                  <span style={{
                    textAlign: 'right', fontWeight: 600, fontSize: '0.83rem',
                    color: trader.pnl >= 0 ? '#00FF88' : '#FF4D6A',
                  }}>
                    {fmtPnl(trader.pnl)}
                  </span>

                  <span style={{
                    textAlign: 'right', color: 'rgba(255,255,255,0.65)', fontSize: '0.83rem',
                  }}>
                    {trader.swaps.toLocaleString()}
                  </span>

                  <span style={{
                    textAlign: 'right', fontWeight: 600, fontSize: '0.8rem',
                    color: trader.change24h >= 0 ? '#00FF88' : '#FF4D6A',
                  }}>
                    {trader.change24h >= 0 ? '+' : ''}{trader.change24h.toFixed(1)}%
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom row ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28,
        }}>

          {/* Your Rank */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Medal size={17} color="#7B2FFF" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Your Rank</span>
            </div>

            {walletConnected && walletAddress ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <Avatar addr={walletAddress} size={48} />
                  <div>
                    <div style={{
                      fontFamily: 'monospace', fontSize: '0.78rem',
                      color: 'rgba(255,255,255,0.6)', marginBottom: 4,
                    }}>
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFB800', lineHeight: 1.1 }}>
                      #{userRank.toLocaleString()}
                    </div>
                    <div style={{ marginTop: 4 }}><TierBadge tier="Silver" /></div>
                  </div>
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20,
                }}>
                  {[
                    { label: 'Volume', val: '$48,200' },
                    { label: 'PnL',    val: '+$1,240' },
                    { label: 'Swaps',  val: '23'       },
                  ].map(({ label, val }) => (
                    <div key={label} style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 10, padding: '9px 10px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.38)', marginBottom: 4 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', marginBottom: 7,
                  }}>
                    <span>Progress toward Gold</span>
                    <span style={{ color: '#FFB800', fontWeight: 700 }}>{userProgress}%</span>
                  </div>
                  <div style={{
                    height: 7, borderRadius: 999,
                    background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${userProgress}%` }}
                      transition={{ duration: 1.1, ease: 'easeOut', delay: 0.3 }}
                      style={{
                        height: '100%', borderRadius: 999,
                        background: 'linear-gradient(90deg, #FFB800, #FC72FF)',
                      }}
                    />
                  </div>
                  <div style={{
                    fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 7,
                  }}>
                    Need ~$1.2M more volume to reach Gold tier
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 14, padding: '28px 0',
              }}>
                <div style={{
                  width: 58, height: 58, borderRadius: '50%',
                  background: 'rgba(123,47,255,0.12)',
                  border: '1px solid rgba(123,47,255,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Star size={24} color="#7B2FFF" />
                </div>
                <p style={{
                  margin: 0, color: 'rgba(255,255,255,0.48)',
                  textAlign: 'center', fontSize: '0.88rem', lineHeight: 1.5, maxWidth: 240,
                }}>
                  Connect your wallet to see your rank and track progress toward prizes
                </p>
                <button style={{
                  padding: '10px 26px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #7B2FFF, #FC72FF)',
                  color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                  boxShadow: '0 0 18px rgba(123,47,255,0.35)',
                }}>
                  Connect Wallet
                </button>
              </div>
            )}
          </div>

          {/* Prize section */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Award size={17} color="#FFB800" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Monthly Prizes</span>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.73rem', color: 'rgba(255,255,255,0.32)' }}>
              Prizes distributed on the 1st of each month
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {PRIZES.map(({ place, amount, color }) => (
                <div key={place} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${color}22`,
                  borderRadius: 10, padding: '10px 14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: color, boxShadow: `0 0 8px ${color}`,
                    }} />
                    <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
                      {place}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color }}>{amount}</span>
                </div>
              ))}
            </div>

            {/* Countdown timer */}
            <div style={{
              background: 'rgba(255,184,0,0.07)',
              border: '1px solid rgba(255,184,0,0.2)',
              borderRadius: 14, padding: '14px 16px',
            }}>
              <div style={{
                fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)',
                letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                marginBottom: 12, textAlign: 'center',
              }}>
                Next distribution in
              </div>
              <div style={{ display: 'flex', gap: 0, justifyContent: 'center', alignItems: 'center' }}>
                {[
                  { val: countdown.d, label: 'Days' },
                  { val: countdown.h, label: 'Hrs' },
                  { val: countdown.m, label: 'Min' },
                  { val: countdown.s, label: 'Sec' },
                ].map(({ val, label }, idx) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', minWidth: 46 }}>
                      <div style={{
                        fontSize: '1.5rem', fontWeight: 900, color: '#FFB800',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {String(val).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.32)' }}>{label}</div>
                    </div>
                    {idx < 3 && (
                      <span style={{
                        fontSize: '1.2rem', color: 'rgba(255,184,0,0.5)',
                        margin: '0 2px', paddingBottom: 14,
                      }}>:</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tier Legend ────────────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: '14px 20px',
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={13} color="rgba(255,255,255,0.3)" />
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              Tier thresholds:
            </span>
          </div>
          {([
            ['Diamond', 'Top 1%'],
            ['Platinum', 'Top 5%'],
            ['Gold', 'Top 15%'],
            ['Silver', 'Top 30%'],
            ['Bronze', 'Rest'],
          ] as [Tier, string][]).map(([tier, label]) => (
            <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: TIER_COLOR[tier], boxShadow: `0 0 6px ${TIER_COLOR[tier]}`,
              }} />
              <span style={{ fontSize: '0.74rem', color: TIER_COLOR[tier], fontWeight: 700 }}>{tier}</span>
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)' }}>{label}</span>
            </div>
          ))}
        </div>

      </div>
    </motion.div>
  );
}
