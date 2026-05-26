import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { TradingPair, TimeFrame } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TIMEFRAMES: TimeFrame[] = ['1H', '4H', '1D', '1W', '1M'];

interface Props {
  pair: TradingPair;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background: '#0d0d20', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-white/50 mb-1">{new Date(label as string).toLocaleString()}</p>
      <p className="text-white font-semibold font-mono">${Number(payload[0].value).toLocaleString('en-US', { maximumFractionDigits: 6 })}</p>
    </div>
  );
};

export default function PairChart({ pair }: Props) {
  const [timeframe, setTimeframe] = useState<TimeFrame>('1D');

  const pointsMap: Record<TimeFrame, number> = { '1H': 12, '4H': 24, '1D': 48, '1W': 100, '1M': 168 };

  const data = useMemo(() => {
    const points = pair.priceHistory.slice(-pointsMap[timeframe]);
    return points.map(p => ({
      time: p.time,
      price: p.close,
      volume: p.volume,
    }));
  }, [pair, timeframe]);

  const startPrice = data[0]?.price ?? pair.price;
  const endPrice = data[data.length - 1]?.price ?? pair.price;
  const isPositive = endPrice >= startPrice;
  const changePercent = ((endPrice - startPrice) / startPrice * 100).toFixed(2);

  const lineColor = isPositive ? '#00FF88' : '#FF2D78';
  const gradientId = `gradient-${pair.id}`;

  const formatPrice = (p: number) => {
    if (p < 0.001) return p.toExponential(3);
    if (p < 1) return p.toFixed(5);
    if (p < 100) return p.toFixed(4);
    return p.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-4">
      {/* Price header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-black font-mono text-white">${formatPrice(pair.price)}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full"
              style={{ background: isPositive ? 'rgba(0,255,136,0.12)' : 'rgba(255,45,120,0.12)', color: lineColor }}>
              {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {isPositive ? '+' : ''}{changePercent}%
            </span>
            <span className="text-xs text-white/30">{timeframe} change</span>
          </div>
        </div>
        {/* Timeframe selector */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: timeframe === tf ? 'rgba(123,47,255,0.4)' : 'transparent',
                color: timeframe === tf ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Price chart */}
      <motion.div
        key={`${pair.id}-${timeframe}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ height: 220 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Volume chart */}
      <div style={{ height: 60 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 5, left: 5, bottom: 0 }}>
            <Bar dataKey="volume" fill={`${lineColor}33`} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-white/20 text-center -mt-2">Volume</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: '24h High', value: `$${formatPrice(pair.high24h)}`, color: '#00FF88' },
          { label: '24h Low', value: `$${formatPrice(pair.low24h)}`, color: '#FF2D78' },
          { label: '24h Volume', value: `$${(pair.volume24h / 1e9).toFixed(2)}B` },
          { label: 'Liquidity', value: `$${(pair.liquidity / 1e6).toFixed(0)}M` },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-white/30 mb-1">{stat.label}</p>
            <p className="text-sm font-semibold font-mono" style={{ color: stat.color ?? 'rgba(255,255,255,0.85)' }}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
