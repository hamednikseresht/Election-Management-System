export type ElectionType = 'candidates' | 'confidence';

export interface Candidate {
  id: string;
  name: string;
  votes: number;
  photoUrl?: string;
}

export interface ConfidenceVoteData {
  candidateName: string;
  yesVotes: number;
  noVotes: number;
}

export interface BallotLogEntry {
  id: string;
  at: string;
  kind: 'valid' | 'invalid';
  candidateIds: string[];
}

export interface SingleElection {
  id: 'election1' | 'election2';
  title: string;
  type: ElectionType;
  totalVotes: number;
  isTotalBallotsKnown?: boolean;
  countedBallots?: number;
  invalidVotes: number;
  winnersCount: number;
  candidates: Candidate[];
  confidence: ConfidenceVoteData;
  active: boolean;
  concludedAt?: string;
  ballotLog?: BallotLogEntry[];
}

export type DisplayMode = 'dual' | 'single-1' | 'single-2';
export type ElectionScope = 'single' | 'dual';

export interface MultiElectionData {
  version: 2;
  electionScope?: ElectionScope;
  displayMode: DisplayMode;
  election1: SingleElection;
  election2: SingleElection;
}

export type ElectionData = MultiElectionData;
