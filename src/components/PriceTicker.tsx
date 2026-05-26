import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PriceTicker() {
  const { pairs, updatePrices } = useStore();
  useEffect(() => {
    const interval = setInterval(() => {
      updatePrices();
    }, 3000);
    return () => clearInterval(interval);
  }, [updatePrices]);

  const items = [...pairs, ...pairs];

  const formatPrice = (price: number) => {
    if (price < 0.0001) return price.toExponential(4);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 100) return price.toFixed(2);
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <div
      className="w-full overflow-hidden relative"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        height: '36px',
      }}
    >
      {/* Gradient fades */}
      <div className="absolute left-0 top-0 bottom-0 w-12 z-10" style={{ background: 'linear-gradient(to right, #050510, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-12 z-10" style={{ background: 'linear-gradient(to left, #050510, transparent)' }} />

      <div
        className="flex items-center h-full animate-ticker"
        style={{ width: 'max-content' }}
      >
        {items.map((pair, idx) => {
          const isPos = pair.change24h >= 0;
          return (
            <div key={`${pair.id}-${idx}`} className="flex items-center gap-1.5 px-5 whitespace-nowrap cursor-pointer group">
              <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">
                {pair.baseToken.symbol}/{pair.quoteToken.symbol}
              </span>
              <span className="text-xs font-mono text-white/90 group-hover:text-white transition-colors">
                ${formatPrice(pair.price)}
              </span>
              <span className="flex items-center gap-0.5 text-xs font-medium" style={{ color: isPos ? '#00FF88' : '#FF2D78' }}>
                {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {isPos ? '+' : ''}{pair.change24h.toFixed(2)}%
              </span>
              <span className="text-white/10 ml-2">•</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
