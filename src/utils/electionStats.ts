import { BallotLogEntry, Candidate, MajorityRule, SingleElection } from '../types';
import { createId } from './ids';

export type RankStatus = 'winner' | 'tie' | 'alternate' | 'out' | 'short';

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
  majorityRule: MajorityRule;
  requiredAbsoluteVotes: number;
  hasUnfilledSeats: boolean;
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

export function getMajorityRule(election: SingleElection): MajorityRule {
  return election.majorityRule === 'absolute' ? 'absolute' : 'relative';
}

export function requiredAbsoluteVotes(ballotBase: number): number {
  return ballotBase > 0 ? Math.floor(ballotBase / 2) + 1 : 1;
}

/** سقف مشخص روشن است (حتی اگر هنوز عدد کل صفر باشد). شمارش پویا = بدون سقف. */
export function isBallotCeilingMode(election: SingleElection): boolean {
  return election.isTotalBallotsKnown ?? true;
}

/** سقف عددی قابل اعمال است (حالت سقف + کل > ۰). */
export function hasBallotCeiling(election: SingleElection): boolean {
  return isBallotCeilingMode(election) && (election.totalVotes || 0) > 0;
}

export function capToBallotCeiling(election: SingleElection, counted: number): number {
  const next = Math.max(0, counted);
  if (!isBallotCeilingMode(election)) return next;
  return Math.min(next, Math.max(0, election.totalVotes || 0));
}

export function getRegisteredBallotCount(election: SingleElection): number {
  if (election.type === 'confidence') {
    const yesVotes = Math.max(0, election.confidence?.yesVotes || 0);
    const noVotes = Math.max(0, election.confidence?.noVotes || 0);
    const invalidVotes = Math.max(0, election.invalidVotes || 0);
    return yesVotes + noVotes + invalidVotes;
  }
  const invalidVotes = typeof election.invalidVotes === 'number' ? Math.max(0, election.invalidVotes) : 0;
  const maxCandidateVotes = (Array.isArray(election.candidates) ? election.candidates : [])
    .reduce((max, c) => Math.max(max, c.votes || 0), 0);
  return Math.max(
    typeof election.countedBallots === 'number' ? election.countedBallots : 0,
    maxCandidateVotes + invalidVotes,
  );
}

/**
 * ثبت تعرفه جدید:
 * - شمارش پویا: بدون محدودیت
 * - سقف مشخص: فقط وقتی تعداد ثبت‌شده هنوز از کل کمتر است (نتیجهٔ نهایی ≤ کل)
 */
export function canRegisterBallot(election: SingleElection): boolean {
  if (isElectionLocked(election)) return false;
  if (!isBallotCeilingMode(election)) return true;
  const total = Math.max(0, election.totalVotes || 0);
  return getRegisteredBallotCount(election) < total;
}

/** حداکثر نام مجاز روی یک تعرفه = تعداد نفرات منتخب */
export function getMaxMarksPerBallot(election: SingleElection): number {
  return Math.max(1, election.winnersCount || 1);
}

export function isBallotSelectionWithinLimit(
  election: SingleElection,
  candidateIds: string[],
): boolean {
  const unique = new Set(candidateIds.filter(Boolean));
  return unique.size > 0 && unique.size <= getMaxMarksPerBallot(election);
}

/**
 * پایان رأی‌گیری فقط وقتی همهٔ تعرفه‌های سقف ثبت شده باشند.
 * در شمارش پویا سقف نیست و پایان آزاد است.
 */
export function getConcludeBlockReason(election: SingleElection): string | null {
  if (isElectionLocked(election)) return null;
  if (!isBallotCeilingMode(election)) return null;
  const total = Math.max(0, election.totalVotes || 0);
  if (total <= 0) {
    return 'برای پایان رأی‌گیری ابتدا سقف کل تعرفه‌ها را وارد کنید.';
  }
  const counted = getRegisteredBallotCount(election);
  if (counted < total) {
    return `پایان رأی‌گیری فقط پس از ثبت همهٔ تعرفه‌ها ممکن است (${counted.toLocaleString('fa-IR')} از ${total.toLocaleString('fa-IR')} برگه).`;
  }
  return null;
}

export function canConcludeElection(election: SingleElection): boolean {
  return getConcludeBlockReason(election) === null;
}

export function rankCandidates(
  candidates: Candidate[],
  winnersCount: number,
  ballotBase: number,
  majorityRule: MajorityRule = 'relative',
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
  const absoluteNeeded = requiredAbsoluteVotes(ballotBase);

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

    if (
      majorityRule === 'absolute' &&
      (status === 'winner' || status === 'tie') &&
      c.votes < absoluteNeeded
    ) {
      status = 'short';
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
  const majorityRule = getMajorityRule(election);
  const ranked = rankCandidates(candidates, election.winnersCount || 1, countedBallots, majorityRule);
  const seats = Math.max(1, election.winnersCount || 1);

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
    majorityRule,
    requiredAbsoluteVotes: requiredAbsoluteVotes(countedBallots),
    hasUnfilledSeats: majorityRule === 'absolute' && ranked.filter((c) => c.status === 'winner').length < seats,
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
  const uniqueIds = [...new Set(candidateIds.filter(Boolean))];
  if (
    uniqueIds.length === 0 ||
    !canRegisterBallot(election) ||
    !isBallotSelectionWithinLimit(election, uniqueIds)
  ) {
    return election;
  }
  const selected = new Set(uniqueIds);
  const newCandidates = election.candidates.map((c) =>
    selected.has(c.id) ? { ...c, votes: c.votes + 1 } : c,
  );
  const newMax = newCandidates.reduce((max, c) => Math.max(max, c.votes), 0);
  const currentBallots = typeof election.countedBallots === 'number' ? election.countedBallots : 0;

  return {
    ...election,
    candidates: newCandidates,
    countedBallots: capToBallotCeiling(election, Math.max(currentBallots + 1, newMax + election.invalidVotes)),
    ballotLog: pushLog(election, 'valid', uniqueIds),
  };
}

export function submitInvalidBallot(election: SingleElection): SingleElection {
  if (!canRegisterBallot(election)) return election;
  const currentBallots = typeof election.countedBallots === 'number' ? election.countedBallots : 0;
  return {
    ...election,
    invalidVotes: election.invalidVotes + 1,
    countedBallots: capToBallotCeiling(election, currentBallots + 1),
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
  if (getConcludeBlockReason(election)) return election;
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
