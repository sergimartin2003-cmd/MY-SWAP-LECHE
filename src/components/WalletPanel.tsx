import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, ExternalLink, LogOut, ChevronRight,
  Wallet, Zap, CheckCircle, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSwitchChain,
} from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains';
import { useStore } from '../store/useStore';
import { CHAIN_META } from '../config/wagmi';
import { TOKENS } from '../data/tokens';

const CHAINS = [mainnet, polygon, arbitrum, optimism, base];

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/* ─────────────────────────── Token balances row ─────────────────── */
function BalanceRow({ symbol, amount, usdValue, logoUrl }: {
  symbol: string; amount: string; usdValue: string; logoUrl: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-1">
      <img src={logoUrl} alt={symbol}
        className="w-8 h-8 rounded-full flex-shrink-0"
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{symbol}</p>
        <p className="text-xs text-white/40 font-mono">{amount}</p>
      </div>
      <p className="text-sm font-mono text-white/60">{usdValue}</p>
    </div>
  );
}

/* ─────────────────────────── Main panel ─────────────────────────── */
export default function WalletPanel() {
  const show           = useStore(s => s.showWalletPanel);
  const setShow        = useStore(s => s.setShowWalletPanel);
  const tokenBalances  = useStore(s => s.tokenBalances);

  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect }   = useDisconnect();
  const { switchChain }  = useSwitchChain();
  const { data: balance, refetch: refetchBalance } = useBalance({ address });

  const [copied, setCopied]         = useState(false);
  const [showNetworks, setShowNetworks] = useState(false);

  // Auto-refetch balance every 15 s while panel is open
  useEffect(() => {
    if (!show || !address) return;
    const id = setInterval(() => refetchBalance(), 15_000);
    return () => clearInterval(id);
  }, [show, address, refetchBalance]);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const explorerUrl = () => {
    const cid = chain?.id ?? mainnet.id;
    const explorers: Record<number, string> = {
      [mainnet.id]:  'https://etherscan.io/address/',
      [polygon.id]:  'https://polygonscan.com/address/',
      [arbitrum.id]: 'https://arbiscan.io/address/',
      [optimism.id]: 'https://optimistic.etherscan.io/address/',
      [base.id]:     'https://basescan.org/address/',
    };
    return (explorers[cid] ?? 'https://etherscan.io/address/') + address;
  };

  const chainMeta = chain ? CHAIN_META[chain.id] : CHAIN_META[mainnet.id];

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShow(false)}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm flex flex-col overflow-hidden"
            style={{
              background: 'rgba(10,10,26,0.98)',
              borderLeft: '1px solid rgba(123,47,255,0.2)',
              boxShadow: '-20px 0 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #7B2FFF, #00D4FF)' }}>
                  <Wallet size={14} className="text-white" />
                </div>
                <h2 className="text-base font-bold text-white">Wallet</h2>
              </div>
              <button
                onClick={() => setShow(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-5">

              {/* ── NOT CONNECTED ─────────────────────────────── */}
              {!isConnected && (
                <>
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: 'linear-gradient(135deg, rgba(123,47,255,0.2), rgba(0,212,255,0.15))', border: '1px solid rgba(123,47,255,0.3)' }}>
                      <Wallet size={28} className="text-neon-blue" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Connect your wallet</h3>
                    <p className="text-sm text-white/40">Choose a wallet to get started</p>
                  </div>

                  {/* Connector buttons */}
                  <div className="space-y-2.5">
                    {connectors.map(connector => {
                      const meta = getConnectorMeta(connector.id);
                      return (
                        <motion.button
                          key={connector.uid}
                          whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(123,47,255,0.2)' }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isPending}
                          onClick={() => connect({ connector })}
                          className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <span className="text-2xl">{meta.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">{meta.label}</p>
                            <p className="text-xs text-white/40">{meta.desc}</p>
                          </div>
                          {isPending
                            ? <RefreshCw size={16} className="text-white/30 animate-spin" />
                            : <ChevronRight size={16} className="text-white/30" />
                          }
                        </motion.button>
                      );
                    })}
                  </div>

                  {connectError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                      style={{ background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.2)', color: '#FF2D78' }}>
                      <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{connectError.message.slice(0, 120)}</span>
                    </div>
                  )}

                  <p className="text-center text-xs text-white/20 px-4">
                    By connecting, you agree to the Terms of Service and acknowledge our Privacy Policy.
                  </p>
                </>
              )}

              {/* ── CONNECTED ────────────────────────────────── */}
              {isConnected && address && (
                <>
                  {/* Account card */}
                  <div className="rounded-xl p-4"
                    style={{ background: 'linear-gradient(135deg, rgba(123,47,255,0.1), rgba(0,212,255,0.06))', border: '1px solid rgba(123,47,255,0.25)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <AddressAvatar address={address} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/40 mb-0.5">Connected</p>
                        <p className="text-sm font-mono text-white font-medium">{truncate(address)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={copyAddress}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ background: copied ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)' }}
                        >
                          {copied
                            ? <CheckCircle size={13} style={{ color: '#00FF88' }} />
                            : <Copy size={13} className="text-white/40 hover:text-white/70" />
                          }
                        </button>
                        <a
                          href={explorerUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-white/40 hover:text-white/70 transition-colors"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>

                    {/* ETH Balance */}
                    <div className="flex justify-between items-baseline pt-3 border-t border-white/5">
                      <span className="text-xs text-white/40">Balance</span>
                      <div className="text-right">
                        <p className="text-lg font-black font-mono text-white">
                          {balance ? parseFloat(balance.formatted).toFixed(4) : '—'}{' '}
                          <span className="text-sm font-semibold text-white/60">{balance?.symbol}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Network */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Network</p>
                      <button
                        onClick={() => setShowNetworks(!showNetworks)}
                        className="text-xs text-neon-blue hover:underline"
                      >
                        {showNetworks ? 'Hide' : 'Switch'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <span className="text-lg">{chainMeta?.icon ?? '⟠'}</span>
                      <span className="text-sm font-semibold text-white">{chain?.name ?? 'Unknown'}</span>
                      <div className="ml-auto w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                    </div>

                    <AnimatePresence>
                      {showNetworks && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-2"
                        >
                          <div className="grid grid-cols-2 gap-1.5">
                            {CHAINS.map(c => {
                              const meta = CHAIN_META[c.id];
                              const active = chain?.id === c.id;
                              return (
                                <button
                                  key={c.id}
                                  onClick={() => { switchChain({ chainId: c.id }); setShowNetworks(false); }}
                                  className="flex items-center gap-2 p-2.5 rounded-xl text-sm transition-all"
                                  style={{
                                    background: active ? `${meta.color}22` : 'rgba(255,255,255,0.04)',
                                    border: active ? `1px solid ${meta.color}55` : '1px solid rgba(255,255,255,0.07)',
                                    color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                                  }}
                                >
                                  <span>{meta.icon}</span>
                                  <span className="font-medium text-xs">{meta.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Zap, label: 'Buy Crypto', color: '#7B2FFF', action: () => {} },
                      { icon: ExternalLink, label: 'Explorer', color: '#00D4FF', action: () => window.open(explorerUrl(), '_blank') },
                    ].map(({ icon: Icon, label, color, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}
                      >
                        <Icon size={14} /> {label}
                      </button>
                    ))}
                  </div>

                  {/* Token balances — real on-chain data from store */}
                  <div>
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Assets</p>
                    <div className="rounded-xl divide-y divide-white/[0.04]"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {(() => {
                        const ownedTokens = TOKENS.filter(t => {
                          const bal = tokenBalances[t.address] ?? 0;
                          return bal > 0;
                        });
                        if (ownedTokens.length === 0) {
                          return (
                            <p className="text-xs text-white/30 text-center py-4">No tokens found</p>
                          );
                        }
                        return ownedTokens.map(t => {
                          const bal = tokenBalances[t.address] ?? 0;
                          const usd = bal * t.price;
                          return (
                            <BalanceRow
                              key={t.symbol}
                              symbol={t.symbol}
                              logoUrl={t.logoUrl}
                              amount={`${bal.toFixed(bal < 0.001 ? 8 : 4)}`}
                              usdValue={`$${usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
                            />
                          );
                        });
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer — Disconnect */}
            {isConnected && (
              <div className="px-5 py-4 border-t border-white/5">
                <button
                  onClick={() => { disconnect(); setShow(false); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
                  style={{ background: 'rgba(255,45,120,0.07)', border: '1px solid rgba(255,45,120,0.15)' }}
                >
                  <LogOut size={16} /> Disconnect Wallet
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function getConnectorMeta(id: string) {
  const lower = id.toLowerCase();
  // MetaMask — injected with target metaMask or generic io.metamask
  if (lower === 'metamask' || lower === 'io.metamask')
    return { icon: '🦊', label: 'MetaMask',         desc: 'Browser extension wallet' };
  // Phantom EVM
  if (lower === 'phantom' || lower === 'app.phantom')
    return { icon: '👻', label: 'Phantom',           desc: 'Solana & EVM wallet' };
  // Trust Wallet
  if (lower === 'trust' || lower === 'com.trustwallet.app')
    return { icon: '🛡️', label: 'Trust Wallet',      desc: 'Multi-chain mobile wallet' };
  // Brave Wallet
  if (lower === 'bravewallet' || lower === 'com.brave.wallet')
    return { icon: '🦁', label: 'Brave Wallet',      desc: 'Built into Brave browser' };
  // Generic injected (Rabby, Frame, etc.)
  if (lower === 'injected')
    return { icon: '🌐', label: 'Browser Wallet',    desc: 'Rabby, Frame, or any injected wallet' };
  // Coinbase Wallet / Smart Wallet
  if (lower === 'coinbasewallet' || lower === 'coinbasewalletsdk')
    return { icon: '🔵', label: 'Coinbase Wallet',   desc: 'Smart Wallet or Coinbase app' };
  // WalletConnect
  if (lower === 'walletconnect')
    return { icon: '🔗', label: 'WalletConnect',     desc: 'Scan QR with Rainbow, Trust, etc.' };
  // Gnosis Safe
  if (lower === 'safe' || lower === 'gnosissafe')
    return { icon: '🔒', label: 'Gnosis Safe',       desc: 'Multi-sig smart contract wallet' };
  return { icon: '💼', label: id,                    desc: 'Connect wallet' };
}

function AddressAvatar({ address }: { address: string }) {
  // Simple colorful avatar from address characters
  const hue = parseInt(address.slice(2, 8), 16) % 360;
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
      style={{ background: `linear-gradient(135deg, hsl(${hue},70%,50%), hsl(${(hue+60)%360},70%,50%))` }}
    >
      {address.slice(2, 4).toUpperCase()}
    </div>
  );
}

