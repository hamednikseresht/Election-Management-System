import { BallotLogEntry, Candidate, SingleElection } from '../types';
import { createId } from './ids';

export type RankStatus = 'winner' | 'tie' | 'alternate' | 'out';

export interface RankedCandidate extends Candidate {
  rank: number;
  status: RankStatus;
  percentageOfBallots: number;
  barWidth: number;
}

export interface CompetitiveStats {
  invalidVotes: number;
  totalCandidateMarks: number;
  maxCandidateVotes: number;
  minRequiredBallots: number;
  countedBallots: number;
  effectiveCounted: number;
  ballotBase: number;
  remainingBallots: number;
  countedPercentage: number;
  isTotalBallotsKnown: boolean;
  totalVotes: number;
  averageNamesPerBallot: number;
  ranked: RankedCandidate[];
  hasSeatTie: boolean;
}

export type ConfidenceOutcome = 'approved' | 'rejected' | 'counting';

export interface ConfidenceStats {
  yesVotes: number;
  noVotes: number;
  invalidVotes: number;
  validVotes: number;
  countedBallots: number;
  isTotalBallotsKnown: boolean;
  totalVotes: number;
  quorumBase: number;
  requiredYes: number;
  yesPercentage: number;
  noPercentage: number;
  isApproved: boolean;
  isCountingComplete: boolean;
  outcome: ConfidenceOutcome;
}

export function isElectionLocked(election: SingleElection): boolean {
  return Boolean(election.concludedAt);
}

export function getBallotLog(election: SingleElection): BallotLogEntry[] {
  return Array.isArray(election.ballotLog) ? election.ballotLog : [];
}

export function rankCandidates(
  candidates: Candidate[],
  winnersCount: number,
  ballotBase: number,
): RankedCandidate[] {
  const sorted = [...candidates].sort((a, b) => {
    if ((b.votes || 0) !== (a.votes || 0)) return (b.votes || 0) - (a.votes || 0);
    return a.name.localeCompare(b.name, 'fa');
  });

  const seats = Math.max(1, winnersCount || 1);
  const cutoffVotes = sorted[seats - 1]?.votes ?? 0;
  const firstTiedIndex = sorted.findIndex((c) => c.votes === cutoffVotes);
  const tiedCount = sorted.filter((c) => c.votes === cutoffVotes).length;
  const straddles =
    sorted.length > 0 &&
    firstTiedIndex >= 0 &&
    firstTiedIndex < seats &&
    firstTiedIndex + tiedCount > seats;
  const maxVotes = sorted[0]?.votes || 0;

  return sorted.map((c, i) => {
    let status: RankStatus;
    let rank = i + 1;
    if (straddles && c.votes === cutoffVotes) {
      status = 'tie';
      rank = firstTiedIndex + 1;
    } else if (i < seats) {
      status = 'winner';
    } else if (i < seats + 2) {
      status = 'alternate';
    } else {
      status = 'out';
    }

    return {
      ...c,
      rank,
      status,
      percentageOfBallots: ballotBase > 0 ? (c.votes / ballotBase) * 100 : 0,
      barWidth: maxVotes > 0 ? Math.max(4, (c.votes / maxVotes) * 100) : 4,
    };
  });
}

export function getCompetitiveStats(election: SingleElection): CompetitiveStats {
  const candidates = Array.isArray(election.candidates) ? election.candidates : [];
  const invalidVotes = typeof election.invalidVotes === 'number' ? Math.max(0, election.invalidVotes) : 0;
  const totalVotes = typeof election.totalVotes === 'number' ? Math.max(0, election.totalVotes) : 0;
  const isTotalBallotsKnown = election.isTotalBallotsKnown ?? true;
  const totalCandidateMarks = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
  const maxCandidateVotes = candidates.reduce((max, c) => Math.max(max, c.votes || 0), 0);
  const minRequiredBallots = maxCandidateVotes + invalidVotes;
  const countedBallots = Math.max(
    typeof election.countedBallots === 'number' ? election.countedBallots : 0,
    minRequiredBallots,
  );
  const ballotBase = countedBallots > 0 ? countedBallots : 1;
  const remainingBallots = isTotalBallotsKnown && totalVotes > 0
    ? Math.max(0, totalVotes - countedBallots)
    : 0;
  const countedPercentage = isTotalBallotsKnown && totalVotes > 0
    ? Math.min(100, Math.round((countedBallots / totalVotes) * 100))
    : 0;
  const validBallots = Math.max(1, countedBallots - invalidVotes);
  const ranked = rankCandidates(candidates, election.winnersCount || 1, countedBallots);

  return {
    invalidVotes,
    totalCandidateMarks,
    maxCandidateVotes,
    minRequiredBallots,
    countedBallots,
    effectiveCounted: countedBallots,
    ballotBase,
    remainingBallots,
    countedPercentage,
    isTotalBallotsKnown,
    totalVotes,
    averageNamesPerBallot: countedBallots > 0 ? totalCandidateMarks / validBallots : 0,
    ranked,
    hasSeatTie: ranked.some((c) => c.status === 'tie'),
  };
}

export function getConfidenceStats(election: SingleElection): ConfidenceStats {
  const yesVotes = Math.max(0, election.confidence?.yesVotes || 0);
  const noVotes = Math.max(0, election.confidence?.noVotes || 0);
  const invalidVotes = Math.max(0, election.invalidVotes || 0);
  const validVotes = yesVotes + noVotes;
  const countedBallots = validVotes + invalidVotes;
  const isTotalBallotsKnown = election.isTotalBallotsKnown ?? true;
  const totalVotes = Math.max(0, election.totalVotes || 0);
  const quorumBase = isTotalBallotsKnown && totalVotes > 0 ? totalVotes : countedBallots;
  const requiredYes = quorumBase > 0 ? Math.floor(quorumBase / 2) + 1 : 1;
  const yesPercentage = quorumBase > 0 ? (yesVotes / quorumBase) * 100 : 0;
  const noPercentage = quorumBase > 0 ? (noVotes / quorumBase) * 100 : 0;
  const isCountingComplete = isTotalBallotsKnown && totalVotes > 0 && countedBallots >= totalVotes;
  const isApproved = quorumBase > 0 && yesVotes >= requiredYes;
  const outcome: ConfidenceOutcome = isApproved
    ? 'approved'
    : isCountingComplete || Boolean(election.concludedAt)
      ? 'rejected'
      : 'counting';

  return {
    yesVotes,
    noVotes,
    invalidVotes,
    validVotes,
    countedBallots,
    isTotalBallotsKnown,
    totalVotes,
    quorumBase,
    requiredYes,
    yesPercentage,
    noPercentage,
    isApproved,
    isCountingComplete,
    outcome,
  };
}

function pushLog(election: SingleElection, kind: BallotLogEntry['kind'], candidateIds: string[]): BallotLogEntry[] {
  return [
    ...getBallotLog(election),
    {
      id: createId('ballot'),
      at: new Date().toISOString(),
      kind,
      candidateIds,
    },
  ];
}

export function submitValidBallot(election: SingleElection, candidateIds: string[]): SingleElection {
  if (candidateIds.length === 0) return election;
  const selected = new Set(candidateIds);
  const newCandidates = election.candidates.map((c) =>
    selected.has(c.id) ? { ...c, votes: c.votes + 1 } : c,
  );
  const newMax = newCandidates.reduce((max, c) => Math.max(max, c.votes), 0);
  const currentBallots = typeof election.countedBallots === 'number' ? election.countedBallots : 0;

  return {
    ...election,
    candidates: newCandidates,
    countedBallots: Math.max(currentBallots + 1, newMax + election.invalidVotes),
    ballotLog: pushLog(election, 'valid', candidateIds),
  };
}

export function submitInvalidBallot(election: SingleElection): SingleElection {
  const currentBallots = typeof election.countedBallots === 'number' ? election.countedBallots : 0;
  return {
    ...election,
    invalidVotes: election.invalidVotes + 1,
    countedBallots: currentBallots + 1,
    ballotLog: pushLog(election, 'invalid', []),
  };
}

export function undoLastBallot(election: SingleElection): SingleElection {
  const log = getBallotLog(election);
  const last = log[log.length - 1];
  if (!last) return election;

  const rest = log.slice(0, -1);
  if (last.kind === 'invalid') {
    return {
      ...election,
      invalidVotes: Math.max(0, election.invalidVotes - 1),
      countedBallots: Math.max(0, (election.countedBallots || 0) - 1),
      ballotLog: rest,
    };
  }

  const selected = new Set(last.candidateIds);
  return {
    ...election,
    candidates: election.candidates.map((c) =>
      selected.has(c.id) ? { ...c, votes: Math.max(0, c.votes - 1) } : c,
    ),
    countedBallots: Math.max(0, (election.countedBallots || 0) - 1),
    ballotLog: rest,
  };
}

export function concludeElection(election: SingleElection): SingleElection {
  return {
    ...election,
    concludedAt: election.concludedAt || new Date().toISOString(),
  };
}

export function reopenElection(election: SingleElection): SingleElection {
  return {
    ...election,
    concludedAt: undefined,
  };
}
