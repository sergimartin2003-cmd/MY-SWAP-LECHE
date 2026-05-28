import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Vote, CheckCircle, XCircle, Clock, Users, Zap,
  ChevronDown, ExternalLink, AlertTriangle, Info,
  FileText, TrendingUp, Shield,
} from 'lucide-react';
import { useStore } from '../store/useStore';

/* ── Types ───────────────────────────────────────────────────────────── */
type ProposalStatus = 'active' | 'passed' | 'defeated' | 'pending' | 'executed';
type VoteChoice = 'for' | 'against' | 'abstain';

interface Proposal {
  id: number;
  title: string;
  summary: string;
  author: string;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  quorum: number;
  threshold: number;
  startTime: number;
  endTime: number;
  category: 'protocol' | 'treasury' | 'fee' | 'upgrade';
  link: string;
}

/* ── Static data ─────────────────────────────────────────────────────── */
const PROPOSALS: Proposal[] = [
  {
    id: 12,
    title: 'NIP-12: Reduce protocol fee from 0.25% to 0.15%',
    summary: 'Lower the platform fee to attract higher volume, compensating with volume growth. Modelled impact: +38% volume, net fee revenue neutral within 60 days.',
    author: '0x4a2b...f3e1',
    status: 'active',
    votesFor: 4_820_000,
    votesAgainst: 1_240_000,
    votesAbstain: 320_000,
    quorum: 4_000_000,
    threshold: 60,
    startTime: Date.now() - 86_400_000 * 2,
    endTime: Date.now() + 86_400_000 * 3,
    category: 'fee',
    link: '#',
  },
  {
    id: 11,
    title: 'NIP-11: Deploy NexSwapRouter on Polygon zkEVM',
    summary: 'Expand the protocol to Polygon zkEVM to capture liquidity and users migrating from Polygon PoS. Estimated deployment cost: $4,200 from treasury.',
    author: '0x9c3d...2b7a',
    status: 'active',
    votesFor: 6_100_000,
    votesAgainst: 800_000,
    votesAbstain: 200_000,
    quorum: 4_000_000,
    threshold: 60,
    startTime: Date.now() - 86_400_000 * 1,
    endTime: Date.now() + 86_400_000 * 5,
    category: 'upgrade',
    link: '#',
  },
  {
    id: 10,
    title: 'NIP-10: Add Chainlink price feeds for volatility-adjusted slippage',
    summary: 'Use Chainlink oracle data to auto-adjust default slippage tolerance based on 1h realized volatility, reducing failed transactions during high-volatility periods.',
    author: '0x7f1a...8e4c',
    status: 'passed',
    votesFor: 7_280_000,
    votesAgainst: 1_100_000,
    votesAbstain: 440_000,
    quorum: 4_000_000,
    threshold: 60,
    startTime: Date.now() - 86_400_000 * 14,
    endTime: Date.now() - 86_400_000 * 7,
    category: 'protocol',
    link: '#',
  },
  {
    id: 9,
    title: 'NIP-9: Treasury allocation — $50k security audit budget',
    summary: 'Approve $50,000 USDC from treasury for a comprehensive smart contract audit by Trail of Bits or equivalent top-tier auditor before V2 launch.',
    author: '0x2e8f...1d3b',
    status: 'executed',
    votesFor: 8_900_000,
    votesAgainst: 400_000,
    votesAbstain: 100_000,
    quorum: 4_000_000,
    threshold: 60,
    startTime: Date.now() - 86_400_000 * 21,
    endTime: Date.now() - 86_400_000 * 14,
    category: 'treasury',
    link: '#',
  },
  {
    id: 8,
    title: 'NIP-8: Whitelist PEPE and SHIB as supported swap tokens',
    summary: 'Add PEPE and SHIB to the default token list. High community demand; both have deep Uniswap v3 liquidity. No smart contract changes required.',
    author: '0x5b9c...7f2d',
    status: 'defeated',
    votesFor: 2_100_000,
    votesAgainst: 5_400_000,
    votesAbstain: 900_000,
    quorum: 4_000_000,
    threshold: 60,
    startTime: Date.now() - 86_400_000 * 28,
    endTime: Date.now() - 86_400_000 * 21,
    category: 'protocol',
    link: '#',
  },
  {
    id: 7,
    title: 'NIP-7: Implement referral fee split (20% to referrer)',
    summary: 'Redirect 20% of platform fees to the wallet that referred the user via referral link. Requires frontend + contract change. Estimated 3 weeks dev time.',
    author: '0x1c4e...9a8f',
    status: 'pending',
    votesFor: 0,
    votesAgainst: 0,
    votesAbstain: 0,
    quorum: 4_000_000,
    threshold: 60,
    startTime: Date.now() + 86_400_000 * 2,
    endTime: Date.now() + 86_400_000 * 9,
    category: 'protocol',
    link: '#',
  },
];

const NSX_REQUIRED = 1000; // min NSX to vote
const USER_NSX = 2_840;    // simulated user's NSX balance

/* ── Helpers ─────────────────────────────────────────────────────────── */
const STATUS_META: Record<ProposalStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active:   { label: 'Active',   color: '#00D4FF', bg: 'rgba(0,212,255,0.1)',   icon: Zap },
  passed:   { label: 'Passed',   color: '#00FF88', bg: 'rgba(0,255,136,0.1)',   icon: CheckCircle },
  executed: { label: 'Executed', color: '#7B2FFF', bg: 'rgba(123,47,255,0.12)', icon: Shield },
  defeated: { label: 'Defeated', color: '#FF2D78', bg: 'rgba(255,45,120,0.1)',  icon: XCircle },
  pending:  { label: 'Pending',  color: '#FFB800', bg: 'rgba(255,184,0,0.1)',   icon: Clock },
};

const CATEGORY_COLOR: Record<Proposal['category'], string> = {
  protocol: '#7B2FFF',
  treasury: '#00FF88',
  fee:      '#FC72FF',
  upgrade:  '#00D4FF',
};

function fmt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return n.toString();
}

function timeLeft(ts: number) {
  const diff = ts - Date.now();
  if (diff <= 0) return 'Ended';
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  if (d > 0) return `${d}d ${h}h left`;
  return `${h}h left`;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86_400_000);
  return d > 0 ? `${d}d ago` : 'Today';
}

/* ── Vote bar ────────────────────────────────────────────────────────── */
function VoteBar({ p }: { p: Proposal }) {
  const total = p.votesFor + p.votesAgainst + p.votesAbstain || 1;
  const forPct     = (p.votesFor     / total) * 100;
  const againstPct = (p.votesAgainst / total) * 100;
  const abstainPct = (p.votesAbstain / total) * 100;
  const quorumPct  = Math.min((total / p.quorum) * 100, 100);

  return (
    <div className="space-y-2">
      {/* Segmented bar */}
      <div className="flex rounded-full overflow-hidden h-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
        {forPct > 0 && (
          <motion.div initial={{ width: 0 }} animate={{ width: `${forPct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ background: '#00FF88' }} />
        )}
        {againstPct > 0 && (
          <motion.div initial={{ width: 0 }} animate={{ width: `${againstPct}%` }} transition={{ duration: 0.8, delay: 0.1 }}
            style={{ background: '#FF2D78' }} />
        )}
        {abstainPct > 0 && (
          <motion.div initial={{ width: 0 }} animate={{ width: `${abstainPct}%` }} transition={{ duration: 0.8, delay: 0.2 }}
            style={{ background: 'rgba(255,255,255,0.2)' }} />
        )}
      </div>
      {/* Labels */}
      <div className="flex justify-between text-xs text-white/40">
        <span style={{ color: '#00FF88' }}>For {forPct.toFixed(1)}%</span>
        <span style={{ color: '#FF2D78' }}>Against {againstPct.toFixed(1)}%</span>
        <span>Abstain {abstainPct.toFixed(1)}%</span>
      </div>
      {/* Quorum */}
      <div className="flex items-center gap-2 text-xs text-white/30">
        <div className="flex-1 h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${quorumPct}%` }} transition={{ duration: 1 }}
            className="h-full rounded-full" style={{ background: quorumPct >= 100 ? '#00FF88' : '#7B2FFF' }} />
        </div>
        <span>Quorum {quorumPct >= 100 ? '✓' : `${quorumPct.toFixed(0)}%`}</span>
      </div>
    </div>
  );
}

/* ── Vote modal ──────────────────────────────────────────────────────── */
function VoteModal({ proposal, onClose, onVote }: {
  proposal: Proposal;
  onClose: () => void;
  onVote: (choice: VoteChoice) => void;
}) {
  const [choice, setChoice] = useState<VoteChoice | null>(null);

  const CHOICES: { key: VoteChoice; label: string; color: string; icon: React.ElementType }[] = [
    { key: 'for',     label: 'Vote For',     color: '#00FF88', icon: CheckCircle },
    { key: 'against', label: 'Vote Against', color: '#FF2D78', icon: XCircle },
    { key: 'abstain', label: 'Abstain',      color: '#FFB800', icon: Clock },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,4,8,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ background: '#0d0d24', border: '1px solid rgba(123,47,255,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Cast Your Vote</h3>
          <p className="text-xs text-white/40 line-clamp-2">{proposal.title}</p>
        </div>

        <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(123,47,255,0.08)', border: '1px solid rgba(123,47,255,0.2)' }}>
          <span className="text-white/50">Voting power: </span>
          <span className="font-bold" style={{ color: '#7B2FFF' }}>{fmt(USER_NSX)} NSX</span>
        </div>

        <div className="space-y-2">
          {CHOICES.map(({ key, label, color, icon: Icon }) => (
            <button key={key}
              onClick={() => setChoice(key)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold"
              style={{
                background: choice === key ? `rgba(${key === 'for' ? '0,255,136' : key === 'against' ? '255,45,120' : '255,184,0'},0.12)` : 'rgba(255,255,255,0.04)',
                border: choice === key ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.08)',
                color: choice === key ? color : 'rgba(255,255,255,0.6)',
              }}
            >
              <Icon size={16} /> {label}
              {choice === key && <CheckCircle size={14} className="ml-auto" style={{ color }} />}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/50 transition-colors hover:text-white/80"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Cancel
          </button>
          <motion.button
            whileHover={choice ? { scale: 1.02 } : {}}
            whileTap={choice ? { scale: 0.98 } : {}}
            disabled={!choice}
            onClick={() => choice && onVote(choice)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: choice ? 'linear-gradient(135deg, #7B2FFF, #00D4FF)' : 'rgba(255,255,255,0.07)',
              opacity: choice ? 1 : 0.5,
            }}>
            Confirm Vote
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Proposal card ───────────────────────────────────────────────────── */
function ProposalCard({
  proposal, onVote, userVoted,
}: {
  proposal: Proposal;
  onVote: (p: Proposal) => void;
  userVoted: Set<number>;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta    = STATUS_META[proposal.status];
  const MetaIcon = meta.icon;
  const hasVoted = userVoted.has(proposal.id);
  const isActive = proposal.status === 'active';
  const total = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono text-white/30">NIP-{proposal.id}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                style={{ background: `rgba(${CATEGORY_COLOR[proposal.category].replace('#','').match(/../g)?.map(h=>parseInt(h,16)).join(',')},0.15)`, color: CATEGORY_COLOR[proposal.category] }}>
                {proposal.category}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                style={{ background: meta.bg, color: meta.color }}>
                <MetaIcon size={10} /> {meta.label}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white leading-snug">{proposal.title}</h3>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="text-xs text-white/50 leading-relaxed mb-3 overflow-hidden">
              {proposal.summary}
            </motion.p>
          )}
        </AnimatePresence>

        <VoteBar p={proposal} />

        <div className="flex items-center justify-between mt-3 text-xs text-white/30">
          <span>By {proposal.author}</span>
          <span>{isActive ? timeLeft(proposal.endTime) : timeAgo(proposal.endTime)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center gap-2">
        <button onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors">
          <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Less' : 'More'}
        </button>

        <div className="flex items-center gap-1 text-xs text-white/30 ml-2">
          <Users size={12} /> {fmt(total)} votes
        </div>

        <a href={proposal.link} className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors ml-1">
          <ExternalLink size={12} /> Forum
        </a>

        <div className="ml-auto flex gap-2">
          {isActive && !hasVoted && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => onVote(proposal)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7B2FFF, #00D4FF)' }}>
              Vote
            </motion.button>
          )}
          {hasVoted && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
              style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
              <CheckCircle size={11} /> Voted
            </span>
          )}
          {proposal.status === 'pending' && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(255,184,0,0.1)', color: '#FFB800' }}>
              Starts in {timeLeft(proposal.startTime)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────── */
export default function GovernancePage() {
  const { walletConnected, walletAddress, addNotification, setShowWalletPanel } = useStore();
  const [filter, setFilter]       = useState<'all' | 'active' | 'passed' | 'defeated'>('all');
  const [votingOn, setVotingOn]   = useState<Proposal | null>(null);
  const [userVoted, setUserVoted] = useState<Set<number>>(new Set());

  const filtered = filter === 'all'
    ? PROPOSALS
    : PROPOSALS.filter(p => {
        if (filter === 'active')   return p.status === 'active' || p.status === 'pending';
        if (filter === 'passed')   return p.status === 'passed' || p.status === 'executed';
        if (filter === 'defeated') return p.status === 'defeated';
        return true;
      });

  const activeCount  = PROPOSALS.filter(p => p.status === 'active').length;
  const totalVotes   = PROPOSALS.reduce((s, p) => s + p.votesFor + p.votesAgainst + p.votesAbstain, 0);
  const treasuryUSD  = 284_000;

  const handleVoteClick = (p: Proposal) => {
    if (!walletConnected) { setShowWalletPanel(true); return; }
    if (USER_NSX < NSX_REQUIRED) {
      addNotification({ type: 'error', title: 'Insufficient NSX', message: `You need at least ${NSX_REQUIRED.toLocaleString()} NSX to vote.` });
      return;
    }
    setVotingOn(p);
  };

  const handleVoteConfirm = (choice: VoteChoice) => {
    if (!votingOn) return;
    setUserVoted(prev => new Set([...prev, votingOn.id]));
    setVotingOn(null);
    addNotification({
      type: 'success',
      title: 'Vote cast!',
      message: `You voted "${choice}" on NIP-${votingOn.id} with ${fmt(USER_NSX)} NSX.`,
    });
  };

  const TABS = [
    { id: 'all',      label: 'All Proposals' },
    { id: 'active',   label: `Active (${activeCount})` },
    { id: 'passed',   label: 'Passed' },
    { id: 'defeated', label: 'Defeated' },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <AnimatePresence>
        {votingOn && (
          <VoteModal proposal={votingOn} onClose={() => setVotingOn(null)} onVote={handleVoteConfirm} />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-1">
              <Vote size={28} style={{ color: '#7B2FFF' }} />
              Governance
            </h1>
            <p className="text-sm text-white/40">Shape the future of NexSwap. Propose, discuss, and vote on protocol changes.</p>
          </div>
          {walletConnected ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs"
              style={{ background: 'rgba(123,47,255,0.1)', border: '1px solid rgba(123,47,255,0.25)' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: '#7B2FFF' }} />
              <span className="text-white/50">{walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</span>
              <span className="font-bold ml-1" style={{ color: '#7B2FFF' }}>{fmt(USER_NSX)} NSX</span>
            </div>
          ) : (
            <button onClick={() => setShowWalletPanel(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7B2FFF, #00D4FF)' }}>
              Connect to Vote
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active Proposals', value: activeCount.toString(), color: '#00D4FF', icon: FileText },
          { label: 'Total Votes Cast', value: `${(totalVotes / 1e6).toFixed(1)}M NSX`, color: '#7B2FFF', icon: Users },
          { label: 'Treasury Balance', value: `$${(treasuryUSD / 1e3).toFixed(0)}k`, color: '#00FF88', icon: TrendingUp },
          { label: 'Proposals Passed', value: PROPOSALS.filter(p => p.status === 'passed' || p.status === 'executed').length.toString(), color: '#FC72FF', icon: CheckCircle },
        ].map(({ label, value, color, icon: Icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} style={{ color }} />
              <span className="text-xs text-white/40">{label}</span>
            </div>
            <p className="text-xl font-black font-mono text-white">{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Proposals list ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter tabs */}
          <div className="flex gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setFilter(t.id as typeof filter)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: filter === t.id ? 'rgba(123,47,255,0.3)' : 'transparent',
                  color: filter === t.id ? '#fff' : 'rgba(255,255,255,0.4)',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) => (
                <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <ProposalCard proposal={p} onVote={handleVoteClick} userVoted={userVoted} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* How to vote */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Info size={15} style={{ color: '#00D4FF' }} /> How it works
            </h3>
            {[
              { step: '01', title: 'Hold NSX tokens', desc: `Minimum ${NSX_REQUIRED.toLocaleString()} NSX required to vote.` },
              { step: '02', title: 'Review proposals', desc: 'Read full proposals on the governance forum.' },
              { step: '03', title: 'Cast your vote', desc: 'For, Against, or Abstain. 1 NSX = 1 vote.' },
              { step: '04', title: 'Execution', desc: 'Passed proposals are executed by the multisig.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <span className="text-xs font-black font-mono w-5 flex-shrink-0 mt-0.5" style={{ color: '#7B2FFF' }}>{step}</span>
                <div>
                  <p className="text-xs font-semibold text-white">{title}</p>
                  <p className="text-xs text-white/40 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Your voting power */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-5"
            style={{ background: 'rgba(123,47,255,0.07)', border: '1px solid rgba(123,47,255,0.2)' }}>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Zap size={15} style={{ color: '#7B2FFF' }} /> Voting Power
            </h3>
            {walletConnected ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Your NSX</span>
                  <span className="font-bold text-white">{USER_NSX.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Delegated to you</span>
                  <span className="font-bold text-white">0</span>
                </div>
                <div className="h-px my-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Total power</span>
                  <span className="font-black text-lg" style={{ color: '#7B2FFF' }}>{USER_NSX.toLocaleString()}</span>
                </div>
                <div className="text-xs text-white/30 pt-1">
                  ≈ {((USER_NSX / 10_000_000) * 100).toFixed(3)}% of total supply
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-white/40 mb-3">Connect wallet to see your voting power</p>
                <button onClick={() => setShowWalletPanel(true)}
                  className="w-full py-2 rounded-lg text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7B2FFF, #FC72FF)' }}>
                  Connect Wallet
                </button>
              </div>
            )}
          </motion.div>

          {/* Security notice */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="rounded-2xl p-4 flex items-start gap-3 text-xs"
            style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)', color: '#FFB800' }}>
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <span>Passed proposals require a 2-of-4 multisig execution. On-chain execution may take up to 48h after vote ends.</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
