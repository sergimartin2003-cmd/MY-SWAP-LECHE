import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, TrendingUp, DollarSign, Zap,
  Copy, CheckCircle, Share2, Users, Gift, ExternalLink,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { TOKENS, TRADING_PAIRS } from '../data/tokens';
import { PROTOCOL_FEE_BPS } from '../config/uniswap';

/* ── Helpers ──────────────────────────────────────────────────────────── */
const fmt = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const fmtShort = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${Math.round(n)}`;
};

/* ── Generate simulated 30-day platform stats ─────────────────────────── */
function generateDailyStats() {
  const stats = [];
  let cumulativeFees = 0;
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayVol = 80_000 + Math.random() * 120_000 * (1 + i * 0.01);
    const dayFees = (dayVol * PROTOCOL_FEE_BPS) / 10000;
    const swaps = Math.floor(30 + Math.random() * 80);
    cumulativeFees += dayFees;
    stats.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: dayVol,
      fees: dayFees,
      swaps,
      cumFees: cumulativeFees,
    });
  }
  return stats;
}

/* ── Mini SVG Bar Chart ───────────────────────────────────────────────── */
function BarMiniChart({ data, color = '#7B2FFF' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const w = 400;
  const h = 80;
  const barW = w / data.length - 2;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
      {data.map((v, i) => {
        const barH = (v / max) * (h - 4);
        const x = i * (w / data.length);
        const y = h - barH;
        return (
          <rect
            key={i}
            x={x + 1}
            y={y}
            width={barW}
            height={barH}
            rx={2}
            fill={color}
            opacity={0.7 + (i / data.length) * 0.3}
          />
        );
      })}
    </svg>
  );
}

/* ── Mini SVG Line Chart ──────────────────────────────────────────────── */
function LineMiniChart({ data, color = '#00FF88' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 400;
  const h = 80;
  const pad = 4;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - pad * 2) + pad;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${pad},${h} ${points} ${w - pad},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#lineGrad)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Referral section ─────────────────────────────────────────────────── */
function ReferralPanel() {
  const { walletConnected, walletAddress, setShowWalletPanel } = useStore();
  const [copied, setCopied] = useState(false);

  const referralCode = useMemo(() => {
    if (!walletAddress) return '';
    return `NS-${walletAddress.slice(2, 8).toUpperCase()}`;
  }, [walletAddress]);

  const referralLink = `https://nexswap.app/?ref=${referralCode}`;

  // Simulated referral stats (in a real app these come from a backend)
  const refStats = useMemo(() => {
    if (!walletAddress) return null;
    const seed = parseInt(walletAddress.slice(2, 10), 16);
    return {
      totalReferrals: (seed % 23) + 1,
      activeUsers:    (seed % 8)  + 1,
      volumeReferred: ((seed % 100) + 10) * 1200,
      feesEarned:     ((seed % 100) + 10) * 1200 * 0.001, // 0.1% of referred volume
    };
  }, [walletAddress]);

  const copy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!walletConnected) {
    return (
      <div className="glass-card p-6 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(123,47,255,0.2), rgba(252,114,255,0.2))', border: '1px solid rgba(123,47,255,0.3)' }}>
          <Gift size={24} style={{ color: '#FC72FF' }} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Referral Program</h3>
          <p className="text-sm text-white/40">Connect your wallet to get your unique referral link and earn from every swap your friends make.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => setShowWalletPanel(true)}
          className="btn-primary max-w-xs text-sm"
        >
          Connect Wallet
        </motion.button>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Gift size={16} style={{ color: '#FC72FF' }} />
        <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">Referral Program</h3>
      </div>

      <p className="text-xs text-white/40">
        Share your link — you earn <span style={{ color: '#FC72FF' }}>0.1%</span> of every swap volume your referrals generate.
        They get <span style={{ color: '#00FF88' }}>10% off</span> platform fees for their first 30 days.
      </p>

      {/* Referral link */}
      <div>
        <p className="text-xs text-white/40 mb-1.5">Your referral link</p>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="flex-1 text-xs font-mono text-white/60 truncate">{referralLink}</span>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: copied ? 'rgba(0,255,136,0.15)' : 'rgba(123,47,255,0.2)',
              color: copied ? '#00FF88' : '#7B2FFF',
            }}
          >
            {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={() => navigator.share?.({ url: referralLink, title: 'NexSwap — Trade smarter' }).catch(() => {})}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 transition-colors"
          >
            <Share2 size={13} />
          </button>
        </div>
      </div>

      {/* Referral code badge */}
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 rounded-xl text-sm font-black font-mono"
          style={{ background: 'linear-gradient(135deg, rgba(123,47,255,0.2), rgba(252,114,255,0.2))', border: '1px solid rgba(123,47,255,0.3)', color: '#FC72FF', letterSpacing: '0.1em' }}>
          {referralCode}
        </div>
        <p className="text-xs text-white/30">Your code</p>
      </div>

      {/* Stats */}
      {refStats && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          {[
            { label: 'Referrals', value: refStats.totalReferrals, icon: Users, color: '#7B2FFF' },
            { label: 'Active Users', value: refStats.activeUsers, icon: Zap, color: '#00D4FF' },
            { label: 'Vol. Referred', value: fmt(refStats.volumeReferred), icon: BarChart2, color: '#FC72FF', raw: true },
            { label: 'Fees Earned', value: fmt(refStats.feesEarned), icon: DollarSign, color: '#00FF88', raw: true },
          ].map(({ label, value, icon: Icon, color, raw }) => (
            <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} style={{ color }} />
                <span className="text-xs text-white/40">{label}</span>
              </div>
              <p className="text-lg font-black font-mono" style={{ color }}>
                {raw ? value : value}
              </p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-white/20 text-center">
        Referral earnings are tracked on-chain and claimable monthly.
      </p>
    </div>
  );
}

/* ── Main analytics page ──────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [dailyStats] = useState(() => generateDailyStats());
  const [counter, setCounter] = useState(0);

  // Animate counters on mount
  useEffect(() => {
    const id = setInterval(() => setCounter(c => c < 100 ? c + 4 : 100), 16);
    return () => clearInterval(id);
  }, []);

  const totalVolume    = dailyStats.reduce((s, d) => s + d.volume, 0);
  const totalFees      = dailyStats.reduce((s, d) => s + d.fees, 0);
  const totalSwaps     = dailyStats.reduce((s, d) => s + d.swaps, 0);
  const avgDailyVol    = totalVolume / dailyStats.length;

  const pct = counter / 100;

  const topPairs = [...TRADING_PAIRS]
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, 6);

  const topTokens = [...TOKENS]
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-white flex items-center gap-2 mb-1">
          <BarChart2 size={22} className="text-neon-blue" />
          Analytics
        </h1>
        <p className="text-sm text-white/40">Platform stats · Last 30 days · Powered by Uniswap v3</p>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume Routed', value: fmt(totalVolume * pct), sub: `${PROTOCOL_FEE_BPS / 100}% platform fee`, color: '#00D4FF', icon: TrendingUp },
          { label: 'Platform Fees Earned', value: fmt(totalFees * pct), sub: `≈ ${fmt(totalFees / 30)}/day avg`, color: '#00FF88', icon: DollarSign },
          { label: 'Total Swaps', value: fmtShort(totalSwaps * pct), sub: `≈ ${Math.round(totalSwaps / 30)}/day avg`, color: '#FC72FF', icon: Zap },
          { label: 'Avg. Swap Size', value: fmt(avgDailyVol / (totalSwaps / 30)), sub: 'per transaction', color: '#7B2FFF', icon: BarChart2 },
        ].map(({ label, value, sub, color, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-white/40 font-medium leading-tight">{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-black font-mono" style={{ color }}>{value}</p>
            <p className="text-xs text-white/30 mt-1">{sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white/80">Daily Volume (30d)</h3>
              <p className="text-xs text-white/30 mt-0.5">USD equivalent routed through NexSwap</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black font-mono" style={{ color: '#00D4FF' }}>{fmt(totalVolume)}</p>
              <p className="text-xs text-white/30">Total 30d</p>
            </div>
          </div>
          <BarMiniChart data={dailyStats.map(d => d.volume)} color="#7B2FFF" />
          {/* X axis labels */}
          <div className="flex justify-between mt-1">
            <span className="text-xs text-white/20">{dailyStats[0].date}</span>
            <span className="text-xs text-white/20">{dailyStats[14].date}</span>
            <span className="text-xs text-white/20">{dailyStats[29].date}</span>
          </div>
        </motion.div>

        {/* Fees chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white/80">Cumulative Fees</h3>
              <p className="text-xs text-white/30 mt-0.5">Platform revenue (30d)</p>
            </div>
          </div>
          <LineMiniChart data={dailyStats.map(d => d.cumFees)} color="#00FF88" />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-white/30">{dailyStats[0].date}</span>
            <div className="text-right">
              <p className="text-xl font-black font-mono" style={{ color: '#00FF88' }}>{fmt(totalFees)}</p>
              <p className="text-xs text-white/30">earned total</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top pairs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-card p-5"
        >
          <h3 className="text-sm font-bold text-white/80 mb-4">Top Pairs by Volume</h3>
          <div className="space-y-2">
            {topPairs.map((pair, i) => {
              const feeEarned = (pair.volume24h * PROTOCOL_FEE_BPS) / 10000;
              const pctWidth = (pair.volume24h / topPairs[0].volume24h) * 100;
              return (
                <motion.div
                  key={pair.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span className="text-xs text-white/20 w-4 font-mono">#{i + 1}</span>
                  <div className="relative w-9 h-5 flex-shrink-0">
                    <img src={pair.baseToken.logoUrl} alt="" className="w-5 h-5 rounded-full absolute left-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <img src={pair.quoteToken.logoUrl} alt="" className="w-5 h-5 rounded-full absolute left-3"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">
                        {pair.baseToken.symbol}<span className="text-white/30">/{pair.quoteToken.symbol}</span>
                      </span>
                      <div className="text-right">
                        <span className="text-xs font-mono text-white/70">{fmt(pair.volume24h)}</span>
                        <span className="text-xs text-white/30 ml-2">fee: </span>
                        <span className="text-xs font-mono" style={{ color: '#00FF88' }}>{fmt(feeEarned)}</span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pctWidth}%`, background: 'linear-gradient(90deg, #7B2FFF, #00D4FF)' }} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Top tokens + referral teaser */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card p-5"
          >
            <h3 className="text-sm font-bold text-white/80 mb-4">Top Tokens</h3>
            <div className="space-y-2.5">
              {topTokens.map((token, i) => {
                const pctWidth = (token.volume24h / topTokens[0].volume24h) * 100;
                return (
                  <div key={token.symbol} className="flex items-center gap-3">
                    <img src={token.logoUrl} alt={token.symbol} className="w-6 h-6 rounded-full flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white">{token.symbol}</span>
                        <span className="text-xs font-mono text-white/50">{fmt(token.volume24h)}</span>
                      </div>
                      <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${pctWidth}%`, background: i === 0 ? '#7B2FFF' : i === 1 ? '#00D4FF' : i === 2 ? '#FC72FF' : '#00FF88' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Fee APR teaser */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-4"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.07), rgba(0,212,255,0.04))', border: '1px solid rgba(0,255,136,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={14} style={{ color: '#00FF88' }} />
              <h3 className="text-sm font-bold text-white/80">Projected Annual Revenue</h3>
            </div>
            <p className="text-2xl font-black font-mono" style={{ color: '#00FF88' }}>
              {fmt((totalFees / 30) * 365)}
            </p>
            <p className="text-xs text-white/30 mt-1">
              Based on last 30 days avg · {(PROTOCOL_FEE_BPS / 100).toFixed(2)}% fee
            </p>
            <a
              href="https://info.uniswap.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs mt-2 hover:underline"
              style={{ color: '#00D4FF' }}
            >
              <ExternalLink size={10} /> Uniswap pool analytics
            </a>
          </motion.div>
        </div>
      </div>

      {/* Referral Program */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <ReferralPanel />
      </motion.div>
    </div>
  );
}
