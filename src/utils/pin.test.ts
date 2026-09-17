import { describe, expect, it } from 'vitest';
import { hashPin, isValidPinFormat } from './pin';

describe('isValidPinFormat', () => {
  it('accepts 4 to 8 digits', () => {
    expect(isValidPinFormat('1234')).toBe(true);
    expect(isValidPinFormat('12345678')).toBe(true);
  });

  it('rejects short, long, or non-digit pins', () => {
    expect(isValidPinFormat('123')).toBe(false);
    expect(isValidPinFormat('123456789')).toBe(false);
    expect(isValidPinFormat('12ab')).toBe(false);
    expect(isValidPinFormat('')).toBe(false);
  });
});

describe('hashPin', () => {
  it('returns a stable hash for the same pin', async () => {
    const first = await hashPin('2468');
    const second = await hashPin('2468');
    expect(first).toBe(second);
    expect(first.length).toBeGreaterThan(8);
  });

  it('produces different hashes for different pins', async () => {
    expect(await hashPin('1111')).not.toBe(await hashPin('1112'));
  });
});
