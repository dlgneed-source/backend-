import { describe, expect, it } from 'vitest';
import { buildCsv, sanitizeCsvCell } from './exportCsv';

describe('exportCsv utility', () => {
  it('sanitizes formula-injection cells', () => {
    expect(sanitizeCsvCell('=2+2')).toBe('"\t=2+2"');
    expect(sanitizeCsvCell('+SUM(A1:A3)')).toBe('"\t+SUM(A1:A3)"');
  });

  it('builds CSV with dynamic headers', () => {
    const csv = buildCsv([
      { id: '1', name: 'Alice' },
      { id: '2', amount: 50 },
    ]);
    expect(csv.split('\n')[0]).toContain('id');
    expect(csv.split('\n')[0]).toContain('name');
    expect(csv.split('\n')[0]).toContain('amount');
  });
});
