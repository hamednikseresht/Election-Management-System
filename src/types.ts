export type ElectionType = 'candidates' | 'confidence';

export interface Candidate {
  id: string;
  name: string;
  votes: number;
  photoUrl?: string; // عکس کاندیدا (Base64 یا لینک)
}

export interface ConfidenceVoteData {
  candidateName: string;
  yesVotes: number;
  noVotes: number;
}

export interface SingleElection {
  id: 'election1' | 'election2';
  title: string;
  type: ElectionType;
  totalVotes: number; // کل تعرفه‌ها / برگه‌های مأخوذه (در صورت مشخص بودن سقف)
  isTotalBallotsKnown?: boolean; // آیا سقف کل برگه‌های مأخوذه مشخص است یا نامشخص/پویا است؟
  countedBallots?: number; // تعداد تعرفه‌ها / برگه‌های قرائت‌شده تا این لحظه
  invalidVotes: number; // برگه‌های باطله و سفید
  winnersCount: number; // تعداد نفرات منتخب
  candidates: Candidate[];
  confidence: ConfidenceVoteData;
  active: boolean; // فعال یا غیرفعال بودن این انتخابات
  concludedAt?: string; // تاریخ و ساعت رسمی پایان رأی‌گیری
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

// Backward compatibility alias
export type ElectionData = MultiElectionData;
