import {
  BallotLogEntry,
  Candidate,
  DisplayMode,
  ElectionType,
  MultiElectionData,
  SingleElection,
} from '../types';
import { createId } from './ids';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && !Number.isNaN(value) ? Math.max(0, value) : fallback;
}

export function emptyElection(id: 'election1' | 'election2'): SingleElection {
  return {
    id,
    title: '',
    type: 'candidates',
    totalVotes: 0,
    isTotalBallotsKnown: true,
    countedBallots: 0,
    invalidVotes: 0,
    winnersCount: 1,
    majorityRule: 'relative',
    candidates: [],
    confidence: { candidateName: '', yesVotes: 0, noVotes: 0 },
    active: true,
    ballotLog: [],
  };
}

export const defaultSingleElection1 = emptyElection('election1');
export const defaultSingleElection2 = emptyElection('election2');

export const defaultMultiElectionData: MultiElectionData = {
  version: 2,
  electionScope: 'single',
  displayMode: 'single-1',
  election1: defaultSingleElection1,
  election2: defaultSingleElection2,
};

function normalizeCandidates(raw: unknown, fallback: Candidate[]): Candidate[] {
  if (!Array.isArray(raw)) return fallback;
  return raw.map((item, index) => {
    const c = isRecord(item) ? item : {};
    return {
      id: typeof c.id === 'string' && c.id ? c.id : createId(`c-${index}`),
      name: typeof c.name === 'string' ? c.name : '',
      votes: asNumber(c.votes),
      photoUrl: typeof c.photoUrl === 'string' ? c.photoUrl : undefined,
    };
  });
}

function normalizeBallotLog(raw: unknown): BallotLogEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: BallotLogEntry[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    if (item.kind !== 'valid' && item.kind !== 'invalid') continue;
    entries.push({
      id: typeof item.id === 'string' ? item.id : createId('ballot'),
      at: typeof item.at === 'string' ? item.at : new Date().toISOString(),
      kind: item.kind,
      candidateIds: Array.isArray(item.candidateIds)
        ? item.candidateIds.filter((id): id is string => typeof id === 'string')
        : [],
    });
  }
  return entries;
}

export function normalizeSingleElection(raw: unknown, defaultElection: SingleElection): SingleElection {
  if (!isRecord(raw)) return defaultElection;
  const rawType: ElectionType = raw.type === 'confidence' ? 'confidence' : 'candidates';
  const rawConfidence = isRecord(raw.confidence) ? raw.confidence : {};

  return {
    id: defaultElection.id,
    title: typeof raw.title === 'string' ? raw.title : defaultElection.title,
    type: rawType,
    totalVotes: asNumber(raw.totalVotes),
    isTotalBallotsKnown: typeof raw.isTotalBallotsKnown === 'boolean' ? raw.isTotalBallotsKnown : true,
    countedBallots: asNumber(raw.countedBallots),
    invalidVotes: asNumber(raw.invalidVotes),
    winnersCount: Math.max(1, asNumber(raw.winnersCount, defaultElection.winnersCount)),
    majorityRule: raw.majorityRule === 'absolute' ? 'absolute' : 'relative',
    candidates: normalizeCandidates(raw.candidates, defaultElection.candidates),
    confidence: {
      candidateName:
        typeof rawConfidence.candidateName === 'string'
          ? rawConfidence.candidateName
          : defaultElection.confidence.candidateName,
      yesVotes: asNumber(rawConfidence.yesVotes),
      noVotes: asNumber(rawConfidence.noVotes),
    },
    active: typeof raw.active === 'boolean' ? raw.active : true,
    concludedAt: typeof raw.concludedAt === 'string' ? raw.concludedAt : undefined,
    ballotLog: normalizeBallotLog(raw.ballotLog),
  };
}

export function normalizeElectionData(raw: unknown): MultiElectionData {
  if (!isRecord(raw)) return defaultMultiElectionData;

  if (raw.version === 2 || isRecord(raw.election1) || isRecord(raw.election2)) {
    const rawScope = raw.electionScope === 'dual' ? 'dual' : 'single';
    const displayMode: DisplayMode =
      raw.displayMode === 'dual' || raw.displayMode === 'single-1' || raw.displayMode === 'single-2'
        ? raw.displayMode
        : rawScope === 'single'
          ? 'single-1'
          : 'dual';

    return {
      version: 2,
      electionScope: rawScope,
      displayMode,
      election1: normalizeSingleElection(raw.election1, defaultSingleElection1),
      election2: normalizeSingleElection(raw.election2, defaultSingleElection2),
      updatedAt: typeof raw.updatedAt === 'number' && raw.updatedAt > 0 ? raw.updatedAt : 0,
    };
  }

  return {
    version: 2,
    electionScope: 'single',
    displayMode: 'single-1',
    election1: normalizeSingleElection(raw, defaultSingleElection1),
    election2: defaultSingleElection2,
    updatedAt: 0,
  };
}
