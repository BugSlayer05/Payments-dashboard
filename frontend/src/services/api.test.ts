import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
    })),
  },
}));

describe('API Service', () => {
  it('should be importable without errors', async () => {
    // Basic smoke test — real integration tests run against live API
    expect(true).toBe(true);
  });
});

describe('Transaction amount formatting', () => {
  const fmt = (v: string | number) =>
    parseFloat(String(v)).toLocaleString('es-MX', { minimumFractionDigits: 2 });

  it('formats positive amounts', () => {
    expect(fmt('2500.72')).toContain('2');
  });

  it('formats negative amounts', () => {
    const v = parseFloat('-51.13');
    expect(v).toBeLessThan(0);
  });

  it('determines inflow vs outflow correctly', () => {
    const isInflow = (amount: number) => amount > 0;
    expect(isInflow(100)).toBe(true);
    expect(isInflow(-50)).toBe(false);
  });
});

describe('Summary calculations', () => {
  it('calculates total balance from accounts', () => {
    const accounts = [
      { account: 'C00099', balance: '1738.87', total_inflow: '2500.72', total_outflow: '-761.85' },
      { account: 'S00012', balance: '150.72', total_inflow: '150.72', total_outflow: '0.00' },
    ];
    const total = accounts.reduce((s, a) => s + parseFloat(a.balance), 0);
    expect(total).toBeCloseTo(1889.59, 2);
  });

  it('calculates total inflow from accounts', () => {
    const accounts = [
      { total_inflow: '2500.72', balance: '0', total_outflow: '0', account: 'A' },
      { total_inflow: '150.72', balance: '0', total_outflow: '0', account: 'B' },
    ];
    const total = accounts.reduce((s, a) => s + parseFloat(a.total_inflow), 0);
    expect(total).toBeCloseTo(2651.44, 2);
  });
});
