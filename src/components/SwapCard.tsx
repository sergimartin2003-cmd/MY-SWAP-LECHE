import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownUp, Settings, ChevronDown, AlertTriangle, Info, Loader2, CheckCircle, ExternalLink, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useStore } from '../store/useStore';
import type { Token, GasSpeed } from '../types';
import TokenSelectorModal from './TokenSelectorModal';
import { useParaSwapQuote } from '../hooks/useParaSwapQuote';
import { useSwapExecution } from '../hooks/useSwapExecution';

const GAS_OPTIONS: { speed: GasSpeed; label: string; time: string; gwei: number }[] = [
  { speed: 'slow', label: 'Slow', time: '~5 min', gwei: 18 },
  { speed: 'standard', label: 'Standard', time: '~1 min', gwei: 25 },
  { speed: 'fast', label: 'Fast', time: '~30s', gwei: 35 },
  { speed: 'instant', label: 'Instant', time: '~10s', gwei: 55 },
];
const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0];

export default function SwapCard() {
  const { tokenIn, tokenOut, amountIn, amountOut, slippage, gasSpeed, priceImpact, setTokenIn, setTokenOut, setAmountIn, setAmountOut, flipTokens, setSlippage, setGasSpeed, setShowWalletPanel, addNotification } = useStore();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [showSettings, setShowSettings] = useState(false);
  const [showTokenInModal, setShowTokenInModal] = useState(false);
  const [showTokenOutModal, setShowTokenOutModal] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);

  const { quote, loading: quoteLoading, error: quoteError } = useParaSwapQuote(tokenIn, tokenOut, amountIn, chainId);
  useEffect(() => { if (quote) setAmountOut(quote.destAmountFormatted); }, [quote, setAmountOut]);
  const displayAmountOut = quote ? quote.destAmountFormatted : amountOut;

  const { status: swapStatus, needsApproval, isLoading: execLoading, errorMsg: execError, swapHash, approve, executeSwap, reset: resetSwap } = useSwapExecution({ tokenIn, tokenOut, amountIn, slippage, quote, chainId });

  useEffect(() => {
    if (swapStatus === 'success') {
      addNotification({ type: 'success', title: 'Swap confirmed! 🎉', message: `${amountIn} ${tokenIn.symbol} → ${displayAmountOut} ${tokenOut.symbol}` });
      setAmountIn('');
      setTimeout(resetSwap, 3000);
    }
    if (swapStatus === 'error' && execError) { addNotification({ type: 'error', title: 'Swap failed', message: execError }); setTimeout(resetSwap, 4000); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapStatus]);

  const handleFlip = () => { setIsFlipping(true); setTimeout(() => { flipTokens(); setIsFlipping(false); }, 300); };
  const handleSwap = () => {
    if (!isConnected) { setShowWalletPanel(true); return; }
    if (!amountIn || !displayAmountOut) return;
    if (needsApproval) { approve(); return; }
    executeSwap();
  };

  const impactColor = priceImpact < 1 ? '#00FF88' : priceImpact < 5 ? '#FFB800' : '#FF2D78';
  const impactBg = priceImpact < 1 ? 'rgba(0,255,136,0.1)' : priceImpact < 5 ? 'rgba(255,184,0,0.1)' : 'rgba(255,45,120,0.1)';
  const exchangeRate = tokenIn.price / tokenOut.price;
  const gasFeeUSD = quote?.gasCostUSD ? `$${parseFloat(quote.gasCostUSD).toFixed(2)}` : `$${(GAS_OPTIONS.find(g => g.speed === gasSpeed)!.gwei * 21000 * 1e-9 * 3842).toFixed(2)}`;

  const swapButtonLabel = () => {
    if (!isConnected)               return '🔗 Connect Wallet';
    if (swapStatus === 'approving') return 'Approving…';
    if (swapStatus === 'approved')  return `Swap ${tokenIn.symbol} → ${tokenOut.symbol}`;
    if (swapStatus === 'swapping')  return 'Swapping…';
    if (swapStatus === 'success')   return '✓ Swap Complete';
    if (swapStatus === 'error')     return 'Try Again';
    if (execLoading)                return 'Processing…';
    if (!amountIn)                  return 'Enter Amount';
    if (quoteLoading)               return 'Fetching Quote…';
    if (needsApproval)              return `Approve ${tokenIn.symbol}`;
    if (priceImpact > 15)           return '⚠️ High Impact — Swap Anyway';
    return `Swap ${tokenIn.symbol} → ${tokenOut.symbol}`;
  };
  const swapButtonDisabled = (swapStatus === 'success') || (execLoading && swapStatus !== 'error') || (isConnected && (!amountIn || !displayAmountOut)) || quoteLoading;

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} className="glass-card mb-3 p-4 overflow-hidden">
            <h4 className="text-sm font-semibold text-white/70 mb-3">Transaction Settings</h4>
            <div className="mb-4">
              <p className="text-xs text-white/40 mb-2 flex items-center gap-1.5">Slippage Tolerance <Info size={11} className="text-white/30" /></p>
              <div className="flex gap-2">
                {SLIPPAGE_OPTIONS.map(s => (
                  <button key={s} onClick={() => { setSlippage(s); setCustomSlippage(''); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: slippage === s && !customSlippage ? 'rgba(123,47,255,0.3)' : 'rgba(255,255,255,0.05)', border: slippage === s && !customSlippage ? '1px solid rgba(123,47,255,0.5)' : '1px solid rgba(255,255,255,0.08)', color: slippage === s && !customSlippage ? '#fff' : 'rgba(255,255,255,0.5)' }}>{s}%</button>
                ))}
                <input type="number" placeholder="Custom" value={customSlippage}
                  onChange={e => { setCustomSlippage(e.target.value); setSlippage(parseFloat(e.target.value) || 0.5); }}
                  className="w-20 px-2 py-1.5 rounded-lg text-xs font-medium outline-none text-white placeholder-white/30"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-2">Gas Speed</p>
              <div className="grid grid-cols-4 gap-1.5">
                {GAS_OPTIONS.map(opt => (
                  <button key={opt.speed} onClick={() => setGasSpeed(opt.speed)} className="p-2 rounded-lg text-center transition-all"
                    style={{ background: gasSpeed === opt.speed ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)', border: gasSpeed === opt.speed ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs font-semibold text-white">{opt.label}</p><p className="text-xs text-white/40 mt-0.5">{opt.time}</p><p className="text-xs font-mono mt-0.5" style={{ color: '#00D4FF' }}>{opt.gwei}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="glass-card p-5" style={{ border: '1px solid rgba(123,47,255,0.2)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Swap</h2>
          <div className="flex items-center gap-2">
            {quote && <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}><Zap size={10} /> ParaSwap</div>}
            <motion.button whileHover={{ scale: 1.1, rotate: 30 }} whileTap={{ scale: 0.9 }} onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl transition-colors" style={{ background: showSettings ? 'rgba(123,47,255,0.2)' : 'rgba(255,255,255,0.05)', color: showSettings ? '#7B2FFF' : 'rgba(255,255,255,0.5)' }}>
              <Settings size={16} /></motion.button>
          </div>
        </div>
        <TokenInput label="You Pay" token={tokenIn} amount={amountIn} onAmountChange={setAmountIn} onTokenClick={() => setShowTokenInModal(true)} showMax />
        <div className="flex justify-center my-2 relative z-10">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9, rotate: 180 }} animate={{ rotate: isFlipping ? 180 : 0 }} onClick={handleFlip}
            className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(123,47,255,0.3), rgba(0,212,255,0.2))', border: '1px solid rgba(123,47,255,0.3)' }}>
            <ArrowDownUp size={16} className="text-white" /></motion.button>
        </div>
        <div className="relative">
          <TokenInput label="You Receive" token={tokenOut} amount={displayAmountOut} onAmountChange={() => {}} onTokenClick={() => setShowTokenOutModal(true)} readOnly />
          {quoteLoading && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 size={16} className="text-neon-blue animate-spin" /></div>}
        </div>
        {quoteError && <p className="text-xs text-yellow-400/80 mt-1 ml-1">⚠ Live quote unavailable — showing estimate</p>}
        {amountIn && displayAmountOut && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex justify-between text-xs"><span className="text-white/40">Rate</span><span className="text-white/70 font-mono">1 {tokenIn.symbol} ≈ {exchangeRate.toFixed(6)} {tokenOut.symbol}</span></div>
            {!quote && <div className="flex justify-between text-xs"><span className="text-white/40">Price Impact</span><span className="font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: impactBg, color: impactColor }}>{priceImpact > 3 && <AlertTriangle size={10} />}{priceImpact.toFixed(2)}%</span></div>}
            <div className="flex justify-between text-xs"><span className="text-white/40">Slippage</span><span className="text-white/70">{slippage}%</span></div>
            <div className="flex justify-between text-xs"><span className="text-white/40">Route</span><span className="text-white/70 font-mono">{tokenIn.symbol} → {tokenOut.symbol}</span></div>
            <div className="flex justify-between text-xs"><span className="text-white/40">Network Fee</span><span className="text-white/70">{gasFeeUSD}</span></div>
          </motion.div>
        )}
        {isConnected && needsApproval && amountIn && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex items-start gap-2.5 p-3 rounded-xl text-xs" style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)', color: '#FFB800' }}>
            <Info size={13} className="mt-0.5 flex-shrink-0" /><span>Approve <strong>{tokenIn.symbol}</strong> before swapping. One-time per token.</span>
          </motion.div>
        )}
        <motion.button whileHover={swapButtonDisabled ? {} : { scale: 1.02, boxShadow: '0 0 40px rgba(123,47,255,0.4)' }} whileTap={swapButtonDisabled ? {} : { scale: 0.98 }}
          onClick={handleSwap} disabled={swapButtonDisabled}
          className="btn-primary mt-4 text-base flex items-center justify-center gap-2"
          style={swapStatus === 'success' ? { background: 'linear-gradient(135deg, #00FF88, #00D4FF)' } : {}}>
          {execLoading && <Loader2 size={16} className="animate-spin" />}
          {swapStatus === 'success' && <CheckCircle size={16} />}
          {swapButtonLabel()}
        </motion.button>
        {swapHash && (
          <a href={`https://etherscan.io/tx/${swapHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 mt-2 text-xs text-white/30 hover:text-white/60 transition-colors">
            <ExternalLink size={11} /> View on Etherscan
          </a>
        )}
      </div>
      <TokenSelectorModal isOpen={showTokenInModal}  onClose={() => setShowTokenInModal(false)}  onSelect={setTokenIn}  excludeToken={tokenOut} />
      <TokenSelectorModal isOpen={showTokenOutModal} onClose={() => setShowTokenOutModal(false)} onSelect={setTokenOut} excludeToken={tokenIn}  />
    </div>
  );
}

interface TokenInputProps { label: string; token: Token; amount: string; onAmountChange: (v: string) => void; onTokenClick: () => void; readOnly?: boolean; showMax?: boolean; }

function TokenInput({ label, token, amount, onAmountChange, onTokenClick, readOnly, showMax }: TokenInputProps) {
  const { isConnected } = useAccount();
  return (
    <div className="rounded-xl p-4 transition-all duration-200" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-white/40 font-medium">{label}</span>
        {isConnected && token.balance !== undefined && <span className="text-xs text-white/30">Balance: <span className="text-white/50">{token.balance.toFixed(4)} {token.symbol}</span></span>}
      </div>
      <div className="flex items-center gap-3">
        <input type="number" placeholder="0.0" value={amount} onChange={e => onAmountChange(e.target.value)} readOnly={readOnly} className="token-input flex-1" min="0" />
        <div className="flex items-center gap-2">
          {showMax && isConnected && token.balance !== undefined && (
            <button onClick={() => onAmountChange(((token.balance ?? 0) * 0.95).toFixed(6))} className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: 'rgba(0,212,255,0.15)', color: '#00D4FF' }}>MAX</button>
          )}
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onTokenClick}
            className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm text-white"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', minWidth: '100px' }}>
            <img src={token.logoUrl} alt={token.symbol} className="w-5 h-5 rounded-full" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span>{token.symbol}</span><ChevronDown size={14} className="text-white/50" />
          </motion.button>
        </div>
      </div>
      {amount && <p className="text-xs text-white/30 mt-1.5">≈ ${(parseFloat(amount) * token.price).toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>}
    </div>
  );
}
