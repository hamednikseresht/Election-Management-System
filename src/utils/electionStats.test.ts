import { describe, expect, it } from 'vitest';
import { SingleElection } from '../types';
import {
  getCompetitiveStats,
  getConfidenceStats,
  rankCandidates,
  submitInvalidBallot,
  submitValidBallot,
  undoLastBallot,
  canRegisterBallot,
  canConcludeElection,
  getConcludeBlockReason,
  getMaxMarksPerBallot,
  isBallotSelectionWithinLimit,
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

  it('keeps plurality winners under relative majority', () => {
    const stats = getCompetitiveStats(
      election({
        countedBallots: 20,
        winnersCount: 2,
        majorityRule: 'relative',
        candidates: [
          { id: 'a', name: 'الف', votes: 8 },
          { id: 'b', name: 'ب', votes: 6 },
          { id: 'c', name: 'ج', votes: 3 },
        ],
      }),
    );
    expect(stats.ranked.map((c) => c.status)).toEqual(['winner', 'winner', 'alternate']);
  });

  it('requires more than half of ballots for absolute majority winners', () => {
    const stats = getCompetitiveStats(
      election({
        countedBallots: 20,
        winnersCount: 2,
        majorityRule: 'absolute',
        candidates: [
          { id: 'a', name: 'الف', votes: 12 },
          { id: 'b', name: 'ب', votes: 6 },
          { id: 'c', name: 'ج', votes: 3 },
        ],
      }),
    );
    expect(stats.requiredAbsoluteVotes).toBe(11);
    expect(stats.ranked[0].status).toBe('winner');
    expect(stats.ranked[1].status).toBe('short');
    expect(stats.hasUnfilledSeats).toBe(true);
  });
});

describe('ballot ceiling', () => {
  it('blocks extra ballots once counted equals the known total', () => {
    const full = election({
      totalVotes: 2,
      isTotalBallotsKnown: true,
      countedBallots: 2,
    });
    expect(canRegisterBallot(full)).toBe(false);
    expect(submitValidBallot(full, ['a']).countedBallots).toBe(2);
    expect(submitInvalidBallot(full).invalidVotes).toBe(0);
  });

  it('blocks registration in ceiling mode until a positive total is set', () => {
    const unset = election({
      totalVotes: 0,
      isTotalBallotsKnown: true,
      countedBallots: 0,
    });
    expect(canRegisterBallot(unset)).toBe(false);
    expect(submitValidBallot(unset, ['a']).countedBallots).toBe(0);
  });

  it('allows registration while counted is still below the total', () => {
    const room = election({
      totalVotes: 3,
      isTotalBallotsKnown: true,
      countedBallots: 2,
    });
    expect(canRegisterBallot(room)).toBe(true);
    expect(submitValidBallot(room, ['a']).countedBallots).toBe(3);
  });

  it('allows unlimited ballots when the ceiling is off', () => {
    const open = election({
      isTotalBallotsKnown: false,
      countedBallots: 50,
      totalVotes: 10,
    });
    expect(canRegisterBallot(open)).toBe(true);
    expect(submitValidBallot(open, ['a']).countedBallots).toBe(51);
  });

  it('rejects more marks on one ballot than winnersCount', () => {
    const data = election({
      winnersCount: 2,
      isTotalBallotsKnown: false,
      countedBallots: 0,
      candidates: [
        { id: 'a', name: 'الف', votes: 0 },
        { id: 'b', name: 'ب', votes: 0 },
        { id: 'c', name: 'ج', votes: 0 },
      ],
    });
    expect(getMaxMarksPerBallot(data)).toBe(2);
    expect(isBallotSelectionWithinLimit(data, ['a', 'b'])).toBe(true);
    expect(isBallotSelectionWithinLimit(data, ['a', 'b', 'c'])).toBe(false);

    const rejected = submitValidBallot(data, ['a', 'b', 'c']);
    expect(rejected.countedBallots).toBe(0);
    expect(rejected.candidates.every((c) => c.votes === 0)).toBe(true);

    const ok = submitValidBallot(data, ['a', 'b']);
    expect(ok.countedBallots).toBe(1);
    expect(ok.candidates.find((c) => c.id === 'a')?.votes).toBe(1);
    expect(ok.candidates.find((c) => c.id === 'c')?.votes).toBe(0);
  });

  it('blocks concluding until every known ballot is registered', () => {
    const partial = election({
      totalVotes: 10,
      isTotalBallotsKnown: true,
      countedBallots: 4,
    });
    expect(canConcludeElection(partial)).toBe(false);
    expect(getConcludeBlockReason(partial)).toContain('همه');

    const complete = election({
      totalVotes: 4,
      isTotalBallotsKnown: true,
      countedBallots: 4,
    });
    expect(canConcludeElection(complete)).toBe(true);
    expect(canConcludeElection(election({ isTotalBallotsKnown: false, countedBallots: 1 }))).toBe(true);
  });
});
