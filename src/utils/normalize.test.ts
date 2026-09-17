import { describe, expect, it } from 'vitest';
import { normalizeElectionData } from './normalize';

describe('normalizeElectionData', () => {
  it('returns an empty election instead of sample names', () => {
    const data = normalizeElectionData(null);
    expect(data.election1.candidates).toEqual([]);
    expect(data.election1.title).toBe('');
    expect(data.election1.ballotLog).toEqual([]);
  });

  it('keeps ballot logs from a v2 backup', () => {
    const data = normalizeElectionData({
      version: 2,
      election1: {
        title: 'مجمع',
        candidates: [{ id: 'a', name: 'الف', votes: 1 }],
        ballotLog: [{ id: 'b1', at: '2026-01-01', kind: 'valid', candidateIds: ['a'] }],
      },
    });
    expect(data.election1.ballotLog).toHaveLength(1);
    expect(data.election1.ballotLog?.[0].kind).toBe('valid');
  });
});
