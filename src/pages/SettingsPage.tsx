import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Eye,
  Bell,
  Shield,
  Info,
  ChevronRight,
  AlertTriangle,
  Zap,
  Download,
  Trash2,
  ExternalLink,
  Code2,
  MessageCircle,
  Send,
  FileText,
  Plus,
  X,
  HelpCircle,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { SWAP_ROUTER_ADDRESS } from '../config/uniswap';
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains';

// ── Types ──────────────────────────────────────────────────────────────────

interface NexSettings {
  deadline: number;
  expertMode: boolean;
  mevProtection: boolean;
  currency: 'USD' | 'EUR' | 'GBP' | 'BTC';
  chartType: 'candlestick' | 'line' | 'area';
  compactMode: boolean;
  showUsdValues: boolean;
  animations: boolean;
  priceColors: 'default' | 'inverted';
  priceAlerts: boolean;
  txNotifications: boolean;
  govNotifications: boolean;
  weeklyDigest: boolean;
  email: string;
  analytics: boolean;
}

interface PriceAlert {
  id: string;
  token: string;
  targetPrice: string;
  direction: 'above' | 'below';
}

type SectionId = 'trading' | 'display' | 'notifications' | 'privacy' | 'about';

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'nexswap_settings';

const DEFAULT_SETTINGS: NexSettings = {
  deadline: 5,
  expertMode: false,
  mevProtection: true,
  currency: 'USD',
  chartType: 'candlestick',
  compactMode: false,
  showUsdValues: true,
  animations: true,
  priceColors: 'default',
  priceAlerts: false,
  txNotifications: true,
  govNotifications: false,
  weeklyDigest: false,
  email: '',
  analytics: true,
};

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'trading',       label: 'Trading',       icon: <Settings size={16} /> },
  { id: 'display',       label: 'Display',        icon: <Eye size={16} /> },
  { id: 'notifications', label: 'Notifications',  icon: <Bell size={16} /> },
  { id: 'privacy',       label: 'Privacy',        icon: <Shield size={16} /> },
  { id: 'about',         label: 'About',          icon: <Info size={16} /> },
];

const CHAIN_INFO = [
  { name: 'Ethereum',  chain: mainnet,  color: '#627EEA' },
  { name: 'Polygon',   chain: polygon,  color: '#8247E5' },
  { name: 'Arbitrum',  chain: arbitrum, color: '#28A0F0' },
  { name: 'Optimism',  chain: optimism, color: '#FF0420' },
  { name: 'Base',      chain: base,     color: '#0052FF' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function loadSettings(): NexSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: NexSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  accentColor?: string;
}

function Toggle({ checked, onChange, disabled = false, accentColor = '#7B2FFF' }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
      style={{
        background: checked ? accentColor : 'rgba(255,255,255,0.12)',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
      />
    </button>
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
}

function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="flex-1 px-3 py-2 text-sm font-semibold transition-colors"
          style={{
            background: value === opt.value ? '#7B2FFF' : 'transparent',
            color: value === opt.value ? '#fff' : 'rgba(255,255,255,0.5)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ open, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'rgba(18,10,40,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  tooltip?: string;
}

function SettingRow({ label, description, children, tooltip }: SettingRowProps) {
  const [tipOpen, setTipOpen] = useState(false);
  return (
    <div className="flex items-start justify-between gap-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{label}</span>
          {tooltip && (
            <div className="relative">
              <button
                onMouseEnter={() => setTipOpen(true)}
                onMouseLeave={() => setTipOpen(false)}
                onClick={() => setTipOpen((v) => !v)}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <HelpCircle size={14} />
              </button>
              <AnimatePresence>
                {tipOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute left-0 top-6 z-20 w-56 rounded-lg p-3 text-xs text-white/70"
                    style={{ background: 'rgba(18,10,40,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    {tooltip}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ── Trading section ────────────────────────────────────────────────────────

type SlippageMode = '0.1' | '0.5' | '1.0' | 'custom';

interface TradingSectionProps {
  settings: NexSettings;
  update: (patch: Partial<NexSettings>) => void;
}

function TradingSection({ settings, update }: TradingSectionProps) {
  const { setSlippage, setGasSpeed, slippage, gasSpeed } = useStore();
  const [customSlippage, setCustomSlippage] = useState('');
  const [slippageMode, setSlippageMode] = useState<SlippageMode>(() => {
    if (slippage === 0.1) return '0.1';
    if (slippage === 0.5) return '0.5';
    if (slippage === 1.0) return '1.0';
    return 'custom';
  });
  const [expertModal, setExpertModal] = useState(false);

  function handleSlippageMode(mode: SlippageMode) {
    setSlippageMode(mode);
    if (mode !== 'custom') {
      setSlippage(parseFloat(mode));
    }
  }

  function handleCustomSlippage(raw: string) {
    setCustomSlippage(raw);
    const val = parseFloat(raw);
    if (!isNaN(val) && val > 0 && val <= 50) {
      setSlippage(val);
    }
  }

  function handleExpertToggle(on: boolean) {
    if (on) {
      setExpertModal(true);
    } else {
      update({ expertMode: false });
    }
  }

  function confirmExpert() {
    update({ expertMode: true });
    setExpertModal(false);
  }

  const gasOptions: { value: 'slow' | 'standard' | 'fast' | 'instant'; label: string }[] = [
    { value: 'slow',     label: 'Slow' },
    { value: 'standard', label: 'Standard' },
    { value: 'fast',     label: 'Fast' },
    { value: 'instant',  label: 'Instant' },
  ];

  return (
    <div>
      <h2 className="text-xl font-black text-white mb-1">Trading</h2>
      <p className="text-sm text-white/40 mb-6">Configure swap behaviour and transaction defaults.</p>

      {/* Slippage */}
      <SettingRow label="Default Slippage" description="Maximum price movement you're willing to accept.">
        <div className="flex flex-col items-end gap-2">
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
            {(['0.1', '0.5', '1.0', 'custom'] as SlippageMode[]).map((opt) => (
              <button
                key={opt}
                onClick={() => handleSlippageMode(opt)}
                className="px-3 py-2 text-xs font-semibold transition-colors"
                style={{
                  background: slippageMode === opt ? '#7B2FFF' : 'transparent',
                  color: slippageMode === opt ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              >
                {opt === 'custom' ? 'Custom' : `${opt}%`}
              </button>
            ))}
          </div>
          {slippageMode === 'custom' && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0.01"
                max="50"
                step="0.01"
                value={customSlippage}
                onChange={(e) => handleCustomSlippage(e.target.value)}
                placeholder={String(slippage)}
                className="w-20 rounded-lg px-2 py-1.5 text-sm text-white text-right font-mono focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              />
              <span className="text-sm text-white/50">%</span>
            </div>
          )}
        </div>
      </SettingRow>

      {/* Gas Speed */}
      <SettingRow label="Default Gas Speed" description="Controls transaction confirmation time and fee.">
        <Segmented
          options={gasOptions}
          value={gasSpeed}
          onChange={(v) => setGasSpeed(v)}
        />
      </SettingRow>

      {/* Deadline */}
      <SettingRow label="Transaction Deadline" description="Transaction reverts if not confirmed within this time.">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={4320}
            value={settings.deadline}
            onChange={(e) => update({ deadline: Math.max(1, parseInt(e.target.value) || 5) })}
            className="w-20 rounded-lg px-2 py-1.5 text-sm text-white text-right font-mono focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          />
          <span className="text-sm text-white/50">min</span>
        </div>
      </SettingRow>

      {/* Expert Mode */}
      <SettingRow
        label="Expert Mode"
        description="Removes confirmation dialogs and allows high slippage without warnings."
      >
        <Toggle checked={settings.expertMode} onChange={handleExpertToggle} accentColor="#FC72FF" />
      </SettingRow>
      {settings.expertMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 rounded-xl px-4 py-3 mb-1 text-sm font-semibold"
          style={{ background: 'rgba(252,114,255,0.08)', border: '1px solid rgba(252,114,255,0.25)', color: '#FC72FF' }}
        >
          <AlertTriangle size={15} />
          Expert mode is active. Trade carefully.
        </motion.div>
      )}

      {/* MEV Protection */}
      <SettingRow
        label="MEV Protection"
        description="Routes transactions through Flashbots to block sandwich attacks."
        tooltip="MEV bots can front-run your swaps. Enabling this sends transactions privately via Flashbots, preventing sandwich attacks at the cost of slightly longer confirmation times."
      >
        <Toggle checked={settings.mevProtection} onChange={(v) => update({ mevProtection: v })} accentColor="#00D4FF" />
      </SettingRow>

      {/* Expert mode confirmation modal */}
      <Modal open={expertModal} onClose={() => setExpertModal(false)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(252,114,255,0.15)' }}>
            <AlertTriangle size={20} style={{ color: '#FC72FF' }} />
          </div>
          <h3 className="text-lg font-black text-white">Enable Expert Mode?</h3>
        </div>
        <p className="text-sm text-white/60 mb-6 leading-relaxed">
          Expert mode enables high slippage and removes all confirmation dialogs. Bad trade rates or total loss of funds are possible.
          <br /><br />
          Only proceed if you know exactly what you're doing.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setExpertModal(false)}
            className="flex-1 rounded-xl py-3 text-sm font-semibold text-white/70 transition-colors hover:text-white"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Cancel
          </button>
          <button
            onClick={confirmExpert}
            className="flex-1 rounded-xl py-3 text-sm font-black transition-opacity hover:opacity-80"
            style={{ background: '#FC72FF', color: '#fff' }}
          >
            Enable
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ── Chart SVG previews ─────────────────────────────────────────────────────

function CandlestickPreview() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
      <rect x="4"  y="5"  width="4" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <line x1="6"  y1="2"  x2="6"  y2="5"  stroke="currentColor" strokeWidth="1.5" />
      <line x1="6"  y1="15" x2="6"  y2="18" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="8"  width="4" height="7"  rx="1" fill="#FC72FF" opacity="0.8" />
      <line x1="14" y1="4"  x2="14" y2="8"  stroke="#FC72FF" strokeWidth="1.5" />
      <line x1="14" y1="15" x2="14" y2="19" stroke="#FC72FF" strokeWidth="1.5" />
      <rect x="20" y="3"  width="4" height="11" rx="1" fill="currentColor" opacity="0.8" />
      <line x1="22" y1="1"  x2="22" y2="3"  stroke="currentColor" strokeWidth="1.5" />
      <line x1="22" y1="14" x2="22" y2="18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function LinePreview() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
      <polyline points="2,16 8,10 14,13 20,5 26,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AreaPreview() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
      <path d="M2,16 L8,10 L14,13 L20,5 L26,8 L26,19 L2,19 Z" fill="currentColor" opacity="0.25" />
      <polyline points="2,16 8,10 14,13 20,5 26,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Display section ────────────────────────────────────────────────────────

interface DisplaySectionProps {
  settings: NexSettings;
  update: (patch: Partial<NexSettings>) => void;
}

function DisplaySection({ settings, update }: DisplaySectionProps) {
  const currencies: { value: NexSettings['currency']; label: string }[] = [
    { value: 'USD', label: '🇺🇸 USD' },
    { value: 'EUR', label: '🇪🇺 EUR' },
    { value: 'GBP', label: '🇬🇧 GBP' },
    { value: 'BTC', label: '₿ BTC' },
  ];

  const chartOptions: { value: NexSettings['chartType']; label: string; preview: React.ReactNode }[] = [
    { value: 'candlestick', label: 'Candlestick', preview: <CandlestickPreview /> },
    { value: 'line',        label: 'Line',         preview: <LinePreview /> },
    { value: 'area',        label: 'Area',         preview: <AreaPreview /> },
  ];

  return (
    <div>
      <h2 className="text-xl font-black text-white mb-1">Display</h2>
      <p className="text-sm text-white/40 mb-6">Customise how information is presented.</p>

      {/* Currency */}
      <SettingRow label="Currency" description="Fiat currency used for price display.">
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
          {currencies.map((c) => (
            <button
              key={c.value}
              onClick={() => update({ currency: c.value })}
              className="px-3 py-2 text-xs font-semibold transition-colors"
              style={{
                background: settings.currency === c.value ? '#7B2FFF' : 'transparent',
                color: settings.currency === c.value ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Chart Type */}
      <SettingRow label="Chart Type" description="Default chart style for trading pairs.">
        <div className="flex gap-2">
          {chartOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ chartType: opt.value })}
              className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
              style={{
                background: settings.chartType === opt.value ? 'rgba(123,47,255,0.25)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${settings.chartType === opt.value ? '#7B2FFF' : 'rgba(255,255,255,0.10)'}`,
                color: settings.chartType === opt.value ? '#7B2FFF' : 'rgba(255,255,255,0.45)',
              }}
            >
              <span style={{ color: settings.chartType === opt.value ? '#7B2FFF' : 'rgba(255,255,255,0.35)' }}>
                {opt.preview}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Compact Mode */}
      <SettingRow label="Compact Mode" description="Reduces padding and font sizes throughout the UI.">
        <Toggle checked={settings.compactMode} onChange={(v) => update({ compactMode: v })} />
      </SettingRow>

      {/* Show USD Values */}
      <SettingRow label="Show USD Values" description="Display USD equivalent below token amounts.">
        <Toggle checked={settings.showUsdValues} onChange={(v) => update({ showUsdValues: v })} accentColor="#00D4FF" />
      </SettingRow>

      {/* Animations */}
      <SettingRow label="Animations" description="Enable motion animations. Disable for better performance.">
        <Toggle checked={settings.animations} onChange={(v) => update({ animations: v })} accentColor="#00FF88" />
      </SettingRow>

      {/* Price Change Color */}
      <SettingRow label="Price Change Colour" description="Colour convention for positive/negative price changes.">
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
          <button
            onClick={() => update({ priceColors: 'default' })}
            className="px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5"
            style={{
              background: settings.priceColors === 'default' ? '#7B2FFF' : 'transparent',
              color: settings.priceColors === 'default' ? '#fff' : 'rgba(255,255,255,0.5)',
            }}
          >
            <span style={{ color: settings.priceColors === 'default' ? '#00FF88' : 'inherit' }}>▲</span>
            Green/Red
          </button>
          <button
            onClick={() => update({ priceColors: 'inverted' })}
            className="px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5"
            style={{
              background: settings.priceColors === 'inverted' ? '#7B2FFF' : 'transparent',
              color: settings.priceColors === 'inverted' ? '#fff' : 'rgba(255,255,255,0.5)',
            }}
          >
            <span style={{ color: settings.priceColors === 'inverted' ? '#FC72FF' : 'inherit' }}>▲</span>
            Red/Green
          </button>
        </div>
      </SettingRow>
    </div>
  );
}

// ── Notifications section ──────────────────────────────────────────────────

interface NotificationsSectionProps {
  settings: NexSettings;
  update: (patch: Partial<NexSettings>) => void;
}

function NotificationsSection({ settings, update }: NotificationsSectionProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [addingAlert, setAddingAlert] = useState(false);
  const [alertToken, setAlertToken] = useState('ETH');
  const [alertPrice, setAlertPrice] = useState('');
  const [alertDir, setAlertDir] = useState<'above' | 'below'>('above');

  function addAlert() {
    if (!alertPrice) return;
    const newAlert: PriceAlert = {
      id: Math.random().toString(36).slice(2),
      token: alertToken,
      targetPrice: alertPrice,
      direction: alertDir,
    };
    setAlerts((prev) => [...prev, newAlert]);
    setAlertPrice('');
    setAddingAlert(false);
  }

  return (
    <div>
      <h2 className="text-xl font-black text-white mb-1">Notifications</h2>
      <p className="text-sm text-white/40 mb-6">Choose what alerts you want to receive.</p>

      {/* Price Alerts */}
      <SettingRow label="Price Alerts" description="Get notified when a token hits your target price.">
        <Toggle checked={settings.priceAlerts} onChange={(v) => update({ priceAlerts: v })} accentColor="#00FF88" />
      </SettingRow>

      <AnimatePresence>
        {settings.priceAlerts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-4 rounded-xl p-4 space-y-3" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)' }}>
              {alerts.length === 0 && !addingAlert && (
                <p className="text-xs text-white/40">No price alerts set.</p>
              )}
              {alerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-white/80 font-semibold">{a.token}</span>
                  <span className="text-white/50">{a.direction === 'above' ? '≥' : '≤'} ${a.targetPrice}</span>
                  <button
                    onClick={() => setAlerts((prev) => prev.filter((x) => x.id !== a.id))}
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {addingAlert ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={alertToken}
                      onChange={(e) => setAlertToken(e.target.value.toUpperCase())}
                      placeholder="Token (e.g. ETH)"
                      className="flex-1 rounded-lg px-3 py-2 text-sm text-white focus:outline-none font-mono"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                    />
                    <select
                      value={alertDir}
                      onChange={(e) => setAlertDir(e.target.value as 'above' | 'below')}
                      className="rounded-lg px-2 py-2 text-sm text-white focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      <option value="above">Above</option>
                      <option value="below">Below</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={alertPrice}
                      onChange={(e) => setAlertPrice(e.target.value)}
                      placeholder="Target price in USD"
                      className="flex-1 rounded-lg px-3 py-2 text-sm text-white focus:outline-none font-mono"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                    />
                    <button
                      onClick={addAlert}
                      className="rounded-lg px-3 py-2 text-sm font-bold"
                      style={{ background: '#00FF88', color: '#000' }}
                    >
                      Set
                    </button>
                    <button
                      onClick={() => setAddingAlert(false)}
                      className="rounded-lg px-3 py-2 text-sm text-white/50 hover:text-white/80 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingAlert(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80"
                  style={{ color: '#00FF88' }}
                >
                  <Plus size={14} /> Add Alert
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Updates */}
      <SettingRow label="Transaction Updates" description="Notifications when your swaps confirm or fail.">
        <Toggle checked={settings.txNotifications} onChange={(v) => update({ txNotifications: v })} accentColor="#00D4FF" />
      </SettingRow>

      {/* Governance */}
      <SettingRow label="New Proposals" description="Get notified about new governance proposals.">
        <Toggle checked={settings.govNotifications} onChange={(v) => update({ govNotifications: v })} />
      </SettingRow>

      {/* Weekly Digest */}
      <SettingRow label="Weekly Digest" description="Receive a weekly summary of your trading activity.">
        <Toggle checked={settings.weeklyDigest} onChange={(v) => update({ weeklyDigest: v })} />
      </SettingRow>

      <AnimatePresence>
        {settings.weeklyDigest && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-4 rounded-xl p-4" style={{ background: 'rgba(123,47,255,0.08)', border: '1px solid rgba(123,47,255,0.2)' }}>
              <label className="block text-xs font-semibold text-white/60 mb-2">Email Address</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="you@example.com"
                className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Privacy section ────────────────────────────────────────────────────────

interface PrivacySectionProps {
  settings: NexSettings;
  update: (patch: Partial<NexSettings>) => void;
  onReset: () => void;
}

function PrivacySection({ settings, update, onReset }: PrivacySectionProps) {
  const { addNotification } = useStore();
  const [clearModal, setClearModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  function handleClearHistory() {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('nexswap_tx') || k.startsWith('nexswap_history'))) {
        keys.push(k);
      }
    }
    keys.forEach((k) => localStorage.removeItem(k));
    setClearModal(false);
    addNotification({ type: 'success', title: 'History cleared', message: 'Transaction history has been removed.' });
  }

  function handleExportData() {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try { data[key] = JSON.parse(localStorage.getItem(key) ?? ''); }
        catch { data[key] = localStorage.getItem(key); }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexswap-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification({ type: 'success', title: 'Data exported', message: 'Your data has been downloaded as JSON.' });
  }

  function handleDeleteAll() {
    onReset();
    setDeleteModal(false);
    addNotification({ type: 'info', title: 'Settings reset', message: 'All settings have been restored to defaults.' });
  }

  return (
    <div>
      <h2 className="text-xl font-black text-white mb-1">Privacy</h2>
      <p className="text-sm text-white/40 mb-6">Manage your data and privacy preferences.</p>

      {/* Analytics */}
      <SettingRow
        label="Analytics"
        description="Opt into anonymous usage data to help improve NexSwap."
        tooltip="We only collect aggregate, anonymised data such as which features are used. No wallet addresses or trade data are ever shared."
      >
        <Toggle checked={settings.analytics} onChange={(v) => update({ analytics: v })} accentColor="#00D4FF" />
      </SettingRow>

      {/* Clear History */}
      <SettingRow label="Clear Transaction History" description="Remove all locally stored transaction records.">
        <button
          onClick={() => setClearModal(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
        >
          <Trash2 size={14} />
          Clear
        </button>
      </SettingRow>

      {/* Export */}
      <SettingRow label="Export Data" description="Download all your stored app data as a JSON file.">
        <button
          onClick={handleExportData}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}
        >
          <Download size={14} />
          Export
        </button>
      </SettingRow>

      {/* Delete All */}
      <SettingRow label="Delete All Settings" description="Reset every setting to factory defaults and clear stored data.">
        <button
          onClick={() => setDeleteModal(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'rgba(255,60,60,0.12)', border: '1px solid rgba(255,60,60,0.3)', color: '#FF4444' }}
        >
          <Trash2 size={14} />
          Delete All
        </button>
      </SettingRow>

      {/* Clear history modal */}
      <Modal open={clearModal} onClose={() => setClearModal(false)}>
        <h3 className="text-lg font-black text-white mb-3">Clear Transaction History?</h3>
        <p className="text-sm text-white/60 mb-6">
          This will permanently delete all locally stored transaction records. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setClearModal(false)}
            className="flex-1 rounded-xl py-3 text-sm font-semibold text-white/70 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleClearHistory}
            className="flex-1 rounded-xl py-3 text-sm font-black"
            style={{ background: '#FF4444', color: '#fff' }}
          >
            Clear
          </button>
        </div>
      </Modal>

      {/* Delete all modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(255,68,68,0.15)' }}>
            <AlertTriangle size={20} style={{ color: '#FF4444' }} />
          </div>
          <h3 className="text-lg font-black text-white">Delete All Settings?</h3>
        </div>
        <p className="text-sm text-white/60 mb-6 leading-relaxed">
          All customisations will be permanently reset to their factory defaults. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteModal(false)}
            className="flex-1 rounded-xl py-3 text-sm font-semibold text-white/70 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAll}
            className="flex-1 rounded-xl py-3 text-sm font-black"
            style={{ background: '#FF4444', color: '#fff' }}
          >
            Delete All
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ── About section ──────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <div>
      <h2 className="text-xl font-black text-white mb-1">About</h2>
      <p className="text-sm text-white/40 mb-6">Version information and important links.</p>

      {/* Version badge */}
      <div
        className="rounded-xl p-4 mb-4 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div>
          <p className="text-sm font-black text-white">NexSwap</p>
          <p className="text-xs text-white/40 mt-0.5">Version 1.0.0</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: '#00FF88' }} />
          <span className="text-xs text-white/50">All systems operational</span>
        </div>
      </div>

      {/* Contract addresses */}
      <div
        className="rounded-xl p-4 mb-4 space-y-3"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-xs font-black text-white/60 uppercase tracking-wider mb-3">Smart Contract Addresses</p>
        {CHAIN_INFO.map(({ name, chain, color }) => {
          const addr = SWAP_ROUTER_ADDRESS[chain.id];
          const explorerBase = chain.blockExplorers?.default.url ?? 'https://etherscan.io';
          return (
            <div key={chain.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-sm text-white/70 font-semibold">{name}</span>
              </div>
              <a
                href={`${explorerBase}/address/${addr}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono transition-opacity hover:opacity-80"
                style={{ color: '#00D4FF' }}
              >
                {shortAddr(addr)}
                <ExternalLink size={11} />
              </a>
            </div>
          );
        })}
      </div>

      {/* Community links */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-xs font-black text-white/60 uppercase tracking-wider mb-3">Community & Resources</p>
        <div className="space-y-1">
          {[
            { icon: <FileText size={15} />,       label: 'Documentation', href: 'https://docs.nexswap.io',   color: '#7B2FFF' },
            { icon: <Code2 size={15} />,            label: 'GitHub',        href: 'https://github.com/nexswap', color: 'rgba(255,255,255,0.7)' },
            { icon: <MessageCircle size={15} />,   label: 'Discord',       href: 'https://discord.gg/nexswap', color: '#5865F2' },
            { icon: <Send size={15} />,             label: 'Twitter / X',   href: 'https://x.com/nexswap',      color: '#1DA1F2' },
          ].map(({ icon, label, href, color }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between py-2 px-1 rounded-lg transition-colors hover:bg-white/5"
            >
              <div className="flex items-center gap-3" style={{ color }}>
                {icon}
                <span className="text-sm font-semibold text-white/80">{label}</span>
              </div>
              <ChevronRight size={14} className="text-white/30" />
            </a>
          ))}
        </div>
      </div>

      {/* Legal */}
      <div className="flex gap-4">
        {[
          { label: 'Terms of Service', href: '/terms' },
          { label: 'Privacy Policy',  href: '/privacy' },
        ].map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-2"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { addNotification } = useStore();
  const [settings, setSettings] = useState<NexSettings>(loadSettings);
  const [activeSection, setActiveSection] = useState<SectionId>('trading');
  const prevSettingsRef = useRef<string>(JSON.stringify(loadSettings()));

  // Persist and notify on every meaningful change
  useEffect(() => {
    const serialised = JSON.stringify(settings);
    if (serialised === prevSettingsRef.current) return;
    prevSettingsRef.current = serialised;
    saveSettings(settings);
    addNotification({ type: 'success', title: 'Settings saved', message: 'Your preferences have been updated.' });
  }, [settings, addNotification]);

  const update = useCallback((patch: Partial<NexSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  function handleReset() {
    const fresh = { ...DEFAULT_SETTINGS };
    localStorage.removeItem(STORAGE_KEY);
    prevSettingsRef.current = JSON.stringify(fresh);
    setSettings(fresh);
  }

  const sectionContent: Record<SectionId, React.ReactNode> = {
    trading:       <TradingSection       settings={settings} update={update} />,
    display:       <DisplaySection       settings={settings} update={update} />,
    notifications: <NotificationsSection settings={settings} update={update} />,
    privacy:       <PrivacySection       settings={settings} update={update} onReset={handleReset} />,
    about:         <AboutSection />,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'rgba(123,47,255,0.2)', border: '1px solid rgba(123,47,255,0.4)' }}
          >
            <Settings size={20} style={{ color: '#7B2FFF' }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Settings</h1>
            <p className="text-xs text-white/40">Preferences are saved automatically</p>
          </div>
        </div>

        {/* Mobile tabs */}
        <div
          className="md:hidden flex overflow-x-auto gap-1 rounded-xl p-1 mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap"
              style={{
                background: activeSection === s.id ? '#7B2FFF' : 'transparent',
                color: activeSection === s.id ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Desktop layout */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <nav
            className="hidden md:flex flex-col w-44 flex-shrink-0 rounded-2xl p-2 self-start sticky top-24"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors text-left"
                style={{
                  background: activeSection === s.id ? 'rgba(123,47,255,0.2)' : 'transparent',
                  color: activeSection === s.id ? '#7B2FFF' : 'rgba(255,255,255,0.5)',
                  borderLeft: activeSection === s.id ? '2px solid #7B2FFF' : '2px solid transparent',
                }}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </nav>

          {/* Content panel */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {sectionContent[activeSection]}
              </motion.div>
            </AnimatePresence>

            {activeSection !== 'about' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between mt-4 px-2"
              >
                <p className="text-xs text-white/30 flex items-center gap-1.5">
                  <Zap size={11} style={{ color: '#7B2FFF' }} />
                  Changes are saved automatically to localStorage.
                </p>
                <button
                  onClick={handleReset}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  Reset to defaults
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
