import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  ArrowUpDown,
  ChevronDown,
  Clock,
  Zap,
  Shield,
  CheckCircle,
  Loader,
  ExternalLink,
  Network,
} from 'lucide-react';
import { useStore } from '../store/useStore';

const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH',  color: '#627EEA', short: 'ETH'  },
  { id: 'base',     name: 'Base',     symbol: 'ETH',  color: '#0052FF', short: 'BASE' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH',  color: '#28A0F0', short: 'ARB'  },
  { id: 'optimism', name: 'Optimism', symbol: 'ETH',  color: '#FF0420', short: 'OP'   },
  { id: 'polygon',  name: 'Polygon',  symbol: 'MATIC', color: '#8247E5', short: 'MATIC' },
];

const BRIDGE_TOKENS = [
  { symbol: 'ETH',  name: 'Ethereum',    decimals: 18, mockBalance: 1.842  },
  { symbol: 'USDC', name: 'USD Coin',    decimals: 6,  mockBalance: 4280.5 },
  { symbol: 'USDT', name: 'Tether USD',  decimals: 6,  mockBalance: 1200.0 },
  { symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8,  mockBalance: 0.0341 },
];

type Chain = typeof CHAINS[number];
type BridgeToken = typeof BRIDGE_TOKENS[number];
type BridgeProtocol = 'Across Protocol' | 'Stargate' | 'Hop Protocol';

function getBridgeRoute(
  tokenSymbol: string,
  fromChainId: string,
  toChainId: string,
): { protocol: BridgeProtocol; time: string; fee: number } {
  if (tokenSymbol === 'ETH' || tokenSymbol === 'WBTC') {
    return { protocol: 'Across Protocol', time: '~2 min', fee: 0.002 };
  }
  if (tokenSymbol === 'USDC' || tokenSymbol === 'USDT') {
    if (fromChainId === 'polygon' || toChainId === 'polygon') {
      return { protocol: 'Hop Protocol', time: '~5–10 min', fee: 0.0005 };
    }
    return { protocol: 'Stargate', time: '~1–3 min', fee: 0.0005 };
  }
  return { protocol: 'Hop Protocol', time: '~5–10 min', fee: 0.002 };
}

const protocolColor: Record<BridgeProtocol, string> = {
  'Across Protocol': '#00D4FF',
  'Stargate':        '#7B2FFF',
  'Hop Protocol':    '#FC72FF',
};

const RECENT_BRIDGES = [
  { wallet: '0x3f2a...b91c', from: 'ethereum', to: 'base',     token: 'ETH',  amount: '0.5',   status: 'Completed', ago: '2m ago'  },
  { wallet: '0xa17d...4e3f', from: 'arbitrum', to: 'optimism', token: 'USDC', amount: '2,500', status: 'Completed', ago: '5m ago'  },
  { wallet: '0x88ba...c052', from: 'base',     to: 'polygon',  token: 'USDT', amount: '1,000', status: 'Pending',   ago: '7m ago'  },
  { wallet: '0x59fc...77da', from: 'ethereum', to: 'arbitrum', token: 'WBTC', amount: '0.012', status: 'Completed', ago: '11m ago' },
  { wallet: '0xd23e...19ab', from: 'optimism', to: 'base',     token: 'ETH',  amount: '1.2',   status: 'Completed', ago: '18m ago' },
  { wallet: '0x1c4f...82e7', from: 'polygon',  to: 'ethereum', token: 'USDC', amount: '800',   status: 'Pending',   ago: '24m ago' },
];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function ChainCircle({ chain, size = 24 }: { chain: Chain; size?: number }) {
  const fontSize = size <= 18 ? 7 : size <= 28 ? 9 : 10;
  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 35%, ${chain.color}cc, ${chain.color}55)`,
        boxShadow: `0 0 8px ${chain.color}55`,
        fontSize,
        letterSpacing: '-0.5px',
      }}
    >
      {chain.short}
    </div>
  );
}

function ChainSelector({
  label,
  selected,
  onChange,
  exclude,
}: {
  label: string;
  selected: Chain;
  onChange: (chain: Chain) => void;
  exclude?: string;
}) {
  const [open, setOpen] = useState(false);
  const options = CHAINS.filter(c => c.id !== exclude);

  return (
    <div className="relative flex-1">
      <p className="text-xs text-white/40 mb-1.5 font-medium">{label}</p>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/[0.06]"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <ChainCircle chain={selected} size={28} />
        <span className="text-sm font-semibold text-white flex-1 text-left">{selected.name}</span>
        <ChevronDown size={14} className="text-white/40" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
            style={{
              background: '#0d0a2e',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            {options.map(chain => (
              <button
                key={chain.id}
                onClick={() => { onChange(chain); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all"
              >
                <ChainCircle chain={chain} size={24} />
                <span className="flex-1 text-left">{chain.name}</span>
                {chain.id === selected.id && (
                  <CheckCircle size={13} style={{ color: '#00FF88' }} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

function TokenDropdown({
  token,
  onChange,
}: {
  token: BridgeToken;
  onChange: (t: BridgeToken) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm text-white transition-all hover:bg-white/[0.06]"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}
      >
        <span>{token.symbol}</span>
        <ChevronDown size={12} className="text-white/40" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-1 z-50 w-44 rounded-xl overflow-hidden"
            style={{
              background: '#0d0a2e',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            {BRIDGE_TOKENS.map(t => (
              <button
                key={t.symbol}
                onClick={() => { onChange(t); setOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-all"
              >
                <span className="font-semibold">{t.symbol}</span>
                <span className="text-xs text-white/30 flex-1 text-right">{t.name}</span>
                {t.symbol === token.symbol && <CheckCircle size={11} style={{ color: '#00FF88' }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function BridgePage() {
  const { walletConnected, walletAddress, connectWallet } = useStore();

  const [fromChain, setFromChain] = useState<Chain>(CHAINS[0]);
  const [toChain,   setToChain]   = useState<Chain>(CHAINS[1]);
  const [token,     setToken]     = useState<BridgeToken>(BRIDGE_TOKENS[0]);
  const [amount,    setAmount]    = useState('');
  const [bridging,  setBridging]  = useState(false);

  const route   = getBridgeRoute(token.symbol, fromChain.id, toChain.id);
  const parsed  = parseFloat(amount) || 0;
  const decimalsToShow = token.decimals > 8 ? 2 : 6;
  const received = parsed > 0 ? (parsed * (1 - route.fee)).toFixed(decimalsToShow) : '';
  const feeAmt   = parsed > 0 ? (parsed * route.fee).toFixed(Math.min(decimalsToShow + 2, 8)) : '';

  function flipChains() {
    const prev = fromChain;
    setFromChain(toChain);
    setToChain(prev);
  }

  function handleMax() {
    setAmount(String(token.mockBalance));
  }

  function handleTokenChange(t: BridgeToken) {
    setToken(t);
    setAmount('');
  }

  function handleBridge() {
    if (!walletConnected || !parsed || bridging) return;
    setBridging(true);
    setTimeout(() => setBridging(false), 2200);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-8"
      >
        {/* ═══════════════════════════════════════
            LEFT COLUMN — Bridge form
        ═══════════════════════════════════════ */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="glass-card p-6"
            style={{ border: '1px solid rgba(123,47,255,0.2)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl" style={{ background: 'rgba(123,47,255,0.15)' }}>
                <GitBranch size={18} style={{ color: '#7B2FFF' }} />
              </div>
              <div>
                <h1 className="text-lg font-black text-white">Bridge</h1>
                <p className="text-xs text-white/30">Move assets across chains instantly</p>
              </div>
            </div>

            {/* Chain selectors row */}
            <div className="flex items-end gap-2 mb-4">
              <ChainSelector
                label="From"
                selected={fromChain}
                onChange={c => { setFromChain(c); if (c.id === toChain.id) setToChain(fromChain); }}
                exclude={toChain.id}
              />

              <motion.button
                whileHover={{ scale: 1.15, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={flipChains}
                title="Flip chains"
                className="mb-1 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: 'rgba(123,47,255,0.18)', border: '1px solid rgba(123,47,255,0.35)' }}
              >
                <ArrowUpDown size={15} style={{ color: '#7B2FFF' }} />
              </motion.button>

              <ChainSelector
                label="To"
                selected={toChain}
                onChange={c => { setToChain(c); if (c.id === fromChain.id) setFromChain(toChain); }}
                exclude={fromChain.id}
              />
            </div>

            {/* Token + amount input */}
            <div
              className="mb-4 rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-white/40 font-medium">Token &amp; Amount</p>
                <span className="text-xs text-white/25">
                  Balance:{' '}
                  {walletConnected
                    ? `${token.mockBalance.toLocaleString()} ${token.symbol}`
                    : '—'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <TokenDropdown token={token} onChange={handleTokenChange} />

                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-white/20 text-right min-w-0"
                />

                <button
                  onClick={handleMax}
                  className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all hover:opacity-80 flex-shrink-0"
                  style={{ background: 'rgba(0,212,255,0.12)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)' }}
                >
                  Max
                </button>
              </div>
            </div>

            {/* Estimated receive + route info */}
            <AnimatePresence>
              {parsed > 0 && (
                <motion.div
                  key="route-info"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mb-4"
                >
                  <div
                    className="rounded-xl p-4 space-y-2.5"
                    style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">You receive</span>
                      <span className="text-sm font-bold text-white font-mono">
                        {received} {token.symbol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">Bridge fee</span>
                      <span className="text-xs font-mono text-white/55">
                        {(route.fee * 100).toFixed(2)}% · {feeAmt} {token.symbol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">Route</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          color: protocolColor[route.protocol],
                          background: `${protocolColor[route.protocol]}18`,
                          border: `1px solid ${protocolColor[route.protocol]}35`,
                        }}
                      >
                        {route.protocol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">Estimated time</span>
                      <span className="flex items-center gap-1 text-xs text-white/55">
                        <Clock size={11} />
                        {route.time}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            {walletConnected ? (
              <motion.button
                whileHover={parsed > 0 && !bridging ? { scale: 1.02, boxShadow: '0 0 30px rgba(123,47,255,0.5)' } : {}}
                whileTap={parsed > 0 && !bridging ? { scale: 0.97 } : {}}
                onClick={handleBridge}
                disabled={!parsed || bridging}
                className="w-full py-3.5 rounded-xl font-bold text-base text-white transition-all flex items-center justify-center gap-2"
                style={{
                  background: parsed > 0 && !bridging
                    ? 'linear-gradient(135deg, #7B2FFF, #00D4FF)'
                    : 'rgba(255,255,255,0.06)',
                  color: parsed > 0 && !bridging ? '#fff' : 'rgba(255,255,255,0.25)',
                  cursor: parsed > 0 && !bridging ? 'pointer' : 'not-allowed',
                }}
              >
                {bridging ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                    >
                      <Loader size={16} />
                    </motion.div>
                    Bridging…
                  </>
                ) : parsed > 0 ? (
                  <>
                    <Zap size={16} />
                    Bridge {amount} {token.symbol}
                  </>
                ) : (
                  'Enter an amount'
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(123,47,255,0.4)' }}
                whileTap={{ scale: 0.98 }}
                onClick={connectWallet}
                className="w-full py-3.5 rounded-xl font-bold text-base text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #7B2FFF, #FC72FF)' }}
              >
                Connect Wallet
              </motion.button>
            )}

            {walletConnected && walletAddress && (
              <p className="text-center text-xs text-white/20 mt-2 font-mono">
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              </p>
            )}
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════
            RIGHT COLUMN — Info panels
        ═══════════════════════════════════════ */}
        <div className="lg:col-span-3 space-y-6">

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { label: 'Total Bridged', value: '$2.4B', sub: 'all-time volume',    color: '#7B2FFF' },
              { label: 'Active Routes', value: '12',    sub: '5 chains supported', color: '#00D4FF' },
              { label: 'Avg Time',      value: '2.1m',  sub: 'median bridge time', color: '#00FF88' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="glass-card p-4 text-center"
              >
                <p className="text-2xl font-black font-mono" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-xs text-white/60 font-medium mt-1">{stat.label}</p>
                <p className="text-xs text-white/25 mt-0.5">{stat.sub}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Recent bridges table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass-card overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white/80">Recent Bridges</h3>
              <span className="text-xs text-white/25">Live activity</span>
            </div>

            <div className="grid grid-cols-5 gap-2 px-5 py-2.5 border-b border-white/5 text-xs text-white/25 font-medium">
              <div>Wallet</div>
              <div>Route</div>
              <div>Token</div>
              <div className="text-right">Status</div>
              <div className="text-right">Time</div>
            </div>

            {RECENT_BRIDGES.map((row, i) => {
              const fc = CHAINS.find(c => c.id === row.from) ?? CHAINS[0];
              const tc = CHAINS.find(c => c.id === row.to)   ?? CHAINS[1];
              const done = row.status === 'Completed';
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="grid grid-cols-5 gap-2 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.025] transition-all items-center"
                >
                  <div className="font-mono text-white/45 text-xs truncate">{row.wallet}</div>

                  <div className="flex items-center gap-1.5">
                    <ChainCircle chain={fc} size={18} />
                    <span className="text-white/25 text-xs">→</span>
                    <ChainCircle chain={tc} size={18} />
                  </div>

                  <div className="text-xs font-semibold text-white/70">
                    {row.amount}{' '}
                    <span className="text-white/35">{row.token}</span>
                  </div>

                  <div className="text-right">
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={
                        done
                          ? { background: 'rgba(0,255,136,0.1)', color: '#00FF88' }
                          : { background: 'rgba(255,184,0,0.1)', color: '#FFB800' }
                      }
                    >
                      {done ? <CheckCircle size={9} /> : <Loader size={9} />}
                      {row.status}
                    </span>
                  </div>

                  <div className="text-right text-xs text-white/25 font-mono">{row.ago}</div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Supported networks grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Network size={15} style={{ color: '#00D4FF' }} />
              <h3 className="text-sm font-bold text-white/80">Supported Networks</h3>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {CHAINS.map((chain, i) => (
                <motion.div
                  key={chain.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.42 + i * 0.07 }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl cursor-default transition-all hover:bg-white/5"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <ChainCircle chain={chain} size={36} />
                  <span className="text-xs text-white/45 font-medium text-center leading-tight">
                    {chain.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bridge protocol comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="grid grid-cols-3 gap-3"
          >
            {([
              {
                name:   'Across Protocol' as BridgeProtocol,
                desc:   'Fastest ETH bridging via UMA optimistic oracle',
                time:   '~2 min',
                fee:    '0.20%',
                tokens: 'ETH, WBTC',
              },
              {
                name:   'Stargate' as BridgeProtocol,
                desc:   'Unified stablecoin liquidity via LayerZero',
                time:   '~1–3 min',
                fee:    '0.05%',
                tokens: 'USDC, USDT',
              },
              {
                name:   'Hop Protocol' as BridgeProtocol,
                desc:   'AMM-based bridge with bonded relayers',
                time:   '~5–10 min',
                fee:    '0.20%',
                tokens: 'ETH, USDC',
              },
            ]).map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${protocolColor[p.name]}22`,
                }}
              >
                <div
                  className="text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2"
                  style={{ background: `${protocolColor[p.name]}15`, color: protocolColor[p.name] }}
                >
                  {p.name}
                </div>
                <p className="text-xs text-white/38 leading-relaxed mb-3">{p.desc}</p>
                <div className="space-y-1.5">
                  {[
                    { label: 'Time',   val: p.time,   icon: <Clock size={9} /> },
                    { label: 'Fee',    val: p.fee,    icon: null },
                    { label: 'Tokens', val: p.tokens, icon: null },
                  ].map(({ label, val, icon }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-white/25">{label}</span>
                      <span className="text-white/55 font-mono flex items-center gap-1">
                        {icon}
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Security notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.2)' }}
          >
            <div
              className="p-1.5 rounded-lg mt-0.5 flex-shrink-0"
              style={{ background: 'rgba(255,184,0,0.12)' }}
            >
              <Shield size={14} style={{ color: '#FFB800' }} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#FFB800' }}>
                Bridge Security
              </p>
              <p className="text-xs text-white/40 leading-relaxed">
                Bridges are secured by a combination of optimistic verification, liquidity
                networks, and decentralised relayers.{' '}
                <strong className="text-white/60">Across Protocol</strong> uses UMA's optimistic
                oracle,{' '}
                <strong className="text-white/60">Stargate</strong> uses LayerZero message
                passing, and{' '}
                <strong className="text-white/60">Hop Protocol</strong> uses bonded relayers.
                Always verify the destination address before confirming. Large transfers may
                require additional wait time for on-chain finality.
              </p>
              <a
                href="https://l2beat.com/bridges"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold mt-2 hover:opacity-80 transition-opacity"
                style={{ color: '#FFB800' }}
              >
                View bridge risk ratings on L2BEAT <ExternalLink size={10} />
              </a>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
