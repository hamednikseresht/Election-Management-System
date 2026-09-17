import { describe, expect, it } from 'vitest';
import { SingleElection } from '../types';
import {
  getCompetitiveStats,
  getConfidenceStats,
  rankCandidates,
  submitInvalidBallot,
  submitValidBallot,
  undoLastBallot,
} from './electionStats';

function election(partial: Partial<SingleElection> = {}): SingleElection {
  return {
    id: 'election1',
    title: 'آزمایش',
    type: 'candidates',
    totalVotes: 100,
    isTotalBallotsKnown: true,
    countedBallots: 0,
    invalidVotes: 0,
    winnersCount: 2,
    candidates: [
      { id: 'a', name: 'الف', votes: 0 },
      { id: 'b', name: 'ب', votes: 0 },
      { id: 'c', name: 'ج', votes: 0 },
    ],
    confidence: { candidateName: 'نامزد', yesVotes: 0, noVotes: 0 },
    active: true,
    ballotLog: [],
    ...partial,
  };
}

describe('rankCandidates', () => {
  it('marks a clean winner set', () => {
    const ranked = rankCandidates(
      [
        { id: 'a', name: 'الف', votes: 10 },
        { id: 'b', name: 'ب', votes: 8 },
        { id: 'c', name: 'ج', votes: 3 },
      ],
      2,
      20,
    );
    expect(ranked.map((c) => c.status)).toEqual(['winner', 'winner', 'alternate']);
  });

  it('flags a seat tie instead of picking arbitrarily', () => {
    const ranked = rankCandidates(
      [
        { id: 'a', name: 'الف', votes: 10 },
        { id: 'b', name: 'ب', votes: 7 },
        { id: 'c', name: 'ج', votes: 7 },
        { id: 'd', name: 'د', votes: 7 },
      ],
      2,
      20,
    );
    expect(ranked[0].status).toBe('winner');
    expect(ranked.slice(1).every((c) => c.status === 'tie')).toBe(true);
    expect(ranked.slice(1).every((c) => c.rank === 2)).toBe(true);
  });

  it('treats an exact filled seat group as winners, not a tie', () => {
    const ranked = rankCandidates(
      [
        { id: 'a', name: 'الف', votes: 5 },
        { id: 'b', name: 'ب', votes: 5 },
        { id: 'c', name: 'ج', votes: 5 },
      ],
      3,
      15,
    );
    expect(ranked.every((c) => c.status === 'winner')).toBe(true);
  });
});

describe('getConfidenceStats', () => {
  it('uses absolute majority of ballots in both display and report', () => {
    const stats = getConfidenceStats(
      election({
        type: 'confidence',
        totalVotes: 100,
        invalidVotes: 4,
        confidence: { candidateName: 'نامزد', yesVotes: 51, noVotes: 40 },
      }),
    );
    expect(stats.requiredYes).toBe(51);
    expect(stats.isApproved).toBe(true);
    expect(stats.outcome).toBe('approved');
    expect(stats.yesPercentage).toBe(51);
  });

  it('does not approve a mere yes>no without absolute majority', () => {
    const stats = getConfidenceStats(
      election({
        type: 'confidence',
        totalVotes: 100,
        confidence: { candidateName: 'نامزد', yesVotes: 40, noVotes: 30 },
      }),
    );
    expect(stats.isApproved).toBe(false);
    expect(stats.outcome).toBe('counting');
  });

  it('rejects after counting completes without quorum', () => {
    const stats = getConfidenceStats(
      election({
        type: 'confidence',
        totalVotes: 10,
        invalidVotes: 1,
        confidence: { candidateName: 'نامزد', yesVotes: 4, noVotes: 5 },
      }),
    );
    expect(stats.isCountingComplete).toBe(true);
    expect(stats.outcome).toBe('rejected');
  });
});

describe('ballot log undo', () => {
  it('reverses a valid ballot and an invalid ballot', () => {
    let data = submitValidBallot(election(), ['a', 'b']);
    expect(data.candidates.find((c) => c.id === 'a')?.votes).toBe(1);
    expect(data.countedBallots).toBe(1);

    data = submitInvalidBallot(data);
    expect(data.invalidVotes).toBe(1);
    expect(data.countedBallots).toBe(2);

    data = undoLastBallot(data);
    expect(data.invalidVotes).toBe(0);
    expect(data.countedBallots).toBe(1);

    data = undoLastBallot(data);
    expect(data.candidates.every((c) => c.votes === 0)).toBe(true);
    expect(data.countedBallots).toBe(0);
    expect(data.ballotLog).toEqual([]);
  });
});

describe('getCompetitiveStats', () => {
  it('computes percentages from counted ballots, not name marks', () => {
    const stats = getCompetitiveStats(
      election({
        countedBallots: 10,
        invalidVotes: 1,
        candidates: [
          { id: 'a', name: 'الف', votes: 8 },
          { id: 'b', name: 'ب', votes: 3 },
        ],
      }),
    );
    expect(stats.countedBallots).toBe(10);
    expect(stats.ranked[0].percentageOfBallots).toBe(80);
  });
});
