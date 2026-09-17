import { describe, expect, it } from 'vitest';
import {
  isPersistStorageEventKey,
  LEGACY_STORAGE_KEY,
  REV_KEY,
  STORAGE_KEY,
} from './persist';

describe('isPersistStorageEventKey', () => {
  it('accepts current, legacy, and revision keys', () => {
    expect(isPersistStorageEventKey(STORAGE_KEY)).toBe(true);
    expect(isPersistStorageEventKey(LEGACY_STORAGE_KEY)).toBe(true);
    expect(isPersistStorageEventKey(REV_KEY)).toBe(true);
  });

  it('ignores unrelated storage keys', () => {
    expect(isPersistStorageEventKey('operator_pin_hash_v1')).toBe(false);
    expect(isPersistStorageEventKey(null)).toBe(false);
  });
});
