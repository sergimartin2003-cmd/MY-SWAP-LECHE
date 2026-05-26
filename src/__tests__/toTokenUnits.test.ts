import { describe, it, expect } from 'vitest';
import { toTokenUnits } from '../hooks/useUniswapQuote';

describe('toTokenUnits', () => {
  it('converts whole ETH to wei', () => {
    expect(toTokenUnits('1', 18)).toBe(1_000_000_000_000_000_000n);
  });

  it('converts 0.5 ETH to wei', () => {
    expect(toTokenUnits('0.5', 18)).toBe(500_000_000_000_000_000n);
  });

  it('converts 1 USDC (6 decimals)', () => {
    expect(toTokenUnits('1', 6)).toBe(1_000_000n);
  });

  it('converts 0.000001 USDC (minimum unit)', () => {
    expect(toTokenUnits('0.000001', 6)).toBe(1n);
  });

  it('handles zero', () => {
    expect(toTokenUnits('0', 18)).toBe(0n);
  });

  it('handles empty-like input gracefully', () => {
    expect(toTokenUnits('0.0', 18)).toBe(0n);
  });

  it('truncates extra decimal places', () => {
    // 1.1234567890 with 6 decimals → truncates to 6 places
    expect(toTokenUnits('1.1234567890', 6)).toBe(1_123_456n);
  });

  it('handles 100 WBTC (8 decimals)', () => {
    expect(toTokenUnits('100', 8)).toBe(10_000_000_000n);
  });

  it('handles large amounts without float precision loss', () => {
    // 1 million USDC — would lose precision with parseFloat
    expect(toTokenUnits('1000000', 6)).toBe(1_000_000_000_000n);
  });

  it('handles fractional large amounts', () => {
    expect(toTokenUnits('9999.999999', 6)).toBe(9_999_999_999n);
  });
});
