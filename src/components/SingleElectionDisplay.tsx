import { SingleElection } from '../types';
import type { ReactNode } from 'react';
import { 
  Users, CheckCircle, XCircle, ShieldCheck, 
  ThumbsUp, ThumbsDown, Award, AlertCircle, User
} from 'lucide-react';

export interface DisplayThemeConfig {
  id: 'election1' | 'election2';
  tag: string;
  tagColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  titleGradient: string;
  borderAccent: string;
  glowShadow: string;
  primaryBg: string;
  barGradient: string;
  winnerBadge: string;
  winnerRowBg: string;
  winnerBorder: string;
  statGradient: string;
  statBorder: string;
  statText: string;
}

export const electionTheme1: DisplayThemeConfig = {
  id: 'election1',
  tag: 'انتخابات اول',
  tagColor: 'text-indigo-700',
  badgeBg: 'bg-indigo-50',
  badgeBorder: 'border-indigo-200',
  badgeText: 'text-indigo-700',
  titleGradient: 'from-indigo-800 via-blue-700 to-slate-900',
  borderAccent: 'border-indigo-200',
  glowShadow: 'shadow-lg shadow-indigo-100/60',
  primaryBg: 'bg-indigo-600',
  barGradient: 'bg-gradient-to-l from-indigo-600 to-sky-500',
  winnerBadge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  winnerRowBg: 'bg-indigo-50/70',
  winnerBorder: 'border-indigo-300',
  statGradient: 'from-indigo-50/70 to-white',
  statBorder: 'border-indigo-200',
  statText: 'text-indigo-950',
};

export const electionTheme2: DisplayThemeConfig = {
  id: 'election2',
  tag: 'انتخابات دوم',
  tagColor: 'text-emerald-700',
  badgeBg: 'bg-emerald-50',
  badgeBorder: 'border-emerald-200',
  badgeText: 'text-emerald-700',
  titleGradient: 'from-emerald-800 via-teal-700 to-slate-900',
  borderAccent: 'border-emerald-200',
  glowShadow: 'shadow-lg shadow-emerald-100/60',
  primaryBg: 'bg-emerald-600',
  barGradient: 'bg-gradient-to-l from-emerald-600 to-teal-500',
  winnerBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  winnerRowBg: 'bg-emerald-50/70',
  winnerBorder: 'border-emerald-300',
  statGradient: 'from-emerald-50/70 to-white',
  statBorder: 'border-emerald-200',
  statText: 'text-emerald-950',
};

interface SingleElectionDisplayProps {
  election: SingleElection;
  theme: DisplayThemeConfig;
  isHalfScreen?: boolean;
  isDualMode?: boolean;
}

export function SingleElectionDisplay({ 
  election, 
  theme, 
  isHalfScreen = false,
  isDualMode = false
}: SingleElectionDisplayProps) {
  const isConfidenceMode = election.type === 'confidence';
  const isTotalBallotsKnown = election.isTotalBallotsKnown ?? true;

  const totalVotes = typeof election.totalVotes === 'number' ? election.totalVotes : 0;
  const invalidVotes = typeof election.invalidVotes === 'number' ? election.invalidVotes : 0;
  const candidates = Array.isArray(election.candidates) ? election.candidates : [];
  const confidence = election.confidence || { candidateName: 'شخص معرفی شده', yesVotes: 0, noVotes: 0 };

  // Competitive calculations
  const validVotesCompetitive = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);
  const maxCandidateVotes = sortedCandidates.length > 0 ? sortedCandidates[0].votes : 0;

  // Ballots logic
  const minRequiredBallots = maxCandidateVotes + invalidVotes;
  const countedBallots = typeof election.countedBallots === 'number'
    ? Math.max(election.countedBallots, minRequiredBallots)
    : minRequiredBallots;

  // Ballot base for percentage of voters/ballots who voted for this candidate
  const ballotBase = countedBallots > 0 ? countedBallots : (totalVotes > 0 ? totalVotes : 1);

  // Confidence calculations
  const yesVotes = typeof confidence.yesVotes === 'number' ? confidence.yesVotes : 0;
  const noVotes = typeof confidence.noVotes === 'number' ? confidence.noVotes : 0;
  const validVotesConfidence = yesVotes + noVotes;
  const totalCountedConfidence = validVotesConfidence + invalidVotes;

  const isApproved = totalVotes > 0 && yesVotes > Math.floor(totalVotes / 2);
  const isCountingComplete = totalVotes > 0 && totalCountedConfidence >= totalVotes;

  const yesPercentage = totalVotes > 0 
    ? ((yesVotes / totalVotes) * 100).toFixed(1) 
    : '0';
  const noPercentage = totalVotes > 0 
    ? ((noVotes / totalVotes) * 100).toFixed(1) 
    : '0';

  if (!election.active) {
    return (
      <div className="w-full h-full min-h-[350px] rounded-3xl border-2 border-dashed border-slate-300 bg-white/80 p-8 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="p-4 rounded-2xl bg-slate-100 text-slate-500 border border-slate-200 mb-4">
          <AlertCircle size={36} />
        </div>
        <div className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 mb-2">
          {isDualMode ? (theme.id === 'election1' ? 'انتخابات اول' : 'انتخابات دوم') : 'انتخابات'}
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">
          {election.title || 'عنوان انتخابات'} (غیرفعال)
        </h3>
        <p className="text-xs text-slate-500 max-w-sm">
          این انتخابات در حال حاضر در وضعیت غیرفعال قرار دارد. در صورت نیاز، از پنل اپراتور می‌توانید آن را فعال کنید.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-3xl border ${theme.borderAccent} bg-white text-slate-900 ${theme.glowShadow} p-4 sm:p-6 flex flex-col transition-all duration-300`}>
      
      {/* Election Header Box */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          {isDualMode && (
            <div className={`px-2.5 py-1 rounded-lg ${theme.badgeBg} border ${theme.badgeBorder} ${theme.badgeText} text-xs font-black flex items-center gap-1.5 shrink-0`}>
              {theme.id === 'election1' ? <Users size={14} /> : <ShieldCheck size={14} />}
              <span>{theme.id === 'election1' ? 'انتخابات اول' : 'انتخابات دوم'}</span>
            </div>
          )}
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-slate-600 bg-slate-100 border border-slate-200">
            {isConfidenceMode ? 'رأی اعتماد' : 'چند کاندیدا'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isConfidenceMode ? (
            <span className="text-xs font-medium text-slate-600">
              نصاب: اکثریت مطلق (&gt;۵۰٪)
            </span>
          ) : (
            <span className={`text-xs px-2.5 py-0.5 rounded-full ${theme.winnerBadge} font-bold flex items-center gap-1 border`}>
              <Award size={13} />
              <span>{election.winnersCount || 1} نفر منتخب</span>
            </span>
          )}
        </div>
      </div>

      {/* Election Title */}
      <div className="text-center mb-5">
        <h2 className={`text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l ${theme.titleGradient} drop-shadow-xs leading-tight`}>
          {election.title || 'عنوان انتخابات'}
        </h2>
      </div>

      {/* -------------------- MODE: CANDIDATES -------------------- */}
      {!isConfidenceMode && (
        <div className="flex-1 flex flex-col justify-between">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            <StatCard 
              title="کل تعرفه‌ها" 
              value={isTotalBallotsKnown && totalVotes > 0 ? `${totalVotes.toLocaleString('fa-IR')}` : 'نامشخص'} 
              subtitle={isTotalBallotsKnown && totalVotes > 0 ? 'برگه‌های مأخوذه' : 'شمارش آزاد (پویا)'}
              icon={<Users size={17} className="text-blue-600" />}
              gradient="from-blue-50 to-white"
              borderColor="border-blue-200"
              textColor="text-blue-950"
            />
            <StatCard 
              title="تعرفه‌های قرائت‌شده" 
              value={`${countedBallots.toLocaleString('fa-IR')}`} 
              subtitle={isTotalBallotsKnown && totalVotes > 0 
                ? `${Math.min(100, Math.round((countedBallots / totalVotes) * 100))}% کل برگه‌ها` 
                : 'برگه‌های خوانده‌شده'}
              icon={<CheckCircle size={17} className={theme.tagColor} />}
              gradient={theme.statGradient}
              borderColor={theme.statBorder}
              textColor={theme.statText}
            />
            <StatCard 
              title="برگه‌های باطله / سفید" 
              value={`${invalidVotes.toLocaleString('fa-IR')}`} 
              subtitle="تعرفه‌های غیرقابل قبول"
              icon={<XCircle size={17} className="text-rose-600" />}
              gradient="from-rose-50 to-white"
              borderColor="border-rose-200"
              textColor="text-rose-950"
            />
            <StatCard 
              title="مجموع آرای کاندیداها" 
              value={`${validVotesCompetitive.toLocaleString('fa-IR')}`} 
              subtitle={countedBallots > 0 
                ? `میانگین ${(validVotesCompetitive / Math.max(1, countedBallots - invalidVotes)).toFixed(1)} نام در هر برگه` 
                : 'کل انتخاب‌های ثبت‌شده'}
              icon={<Award size={17} className="text-emerald-600" />}
              gradient="from-emerald-50 to-white"
              borderColor="border-emerald-200"
              textColor="text-emerald-950"
            />
          </div>

          {/* Progress Bar for Ballots Reading */}
          {isTotalBallotsKnown && totalVotes > 0 && (
            <div className="mb-4 p-3 rounded-2xl border border-slate-200 bg-slate-50">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-slate-700">
                  پیشرفت قرائت تعرفه‌ها (برگه‌های رأی):
                </span>
                <span className="font-black text-slate-900">
                  {countedBallots.toLocaleString('fa-IR')} از {totalVotes.toLocaleString('fa-IR')} برگه ({Math.min(100, Math.round((countedBallots / totalVotes) * 100)).toLocaleString('fa-IR')}٪)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-200">
                <div 
                  className={`h-full ${theme.barGradient} transition-all duration-500 rounded-full`} 
                  style={{ width: `${Math.min(100, (countedBallots / totalVotes) * 100)}%` }} 
                />
              </div>
            </div>
          )}

          {/* Candidate Bars */}
          <div className="flex flex-col gap-2.5 flex-1">
            {sortedCandidates.map((candidate, index) => {
              const isWinner = index < (election.winnersCount || 1);
              
              // Percentage of ballot papers that contain this candidate's name
              const percentageOfBallots = ballotBase > 0 
                ? ((candidate.votes / ballotBase) * 100).toFixed(1) 
                : '0.0';
              
              // Visual width proportional to the highest candidate
              const barWidth = maxCandidateVotes > 0 
                ? Math.max(4, (candidate.votes / maxCandidateVotes) * 100) 
                : 4;

              return (
                <div
                  key={candidate.id}
                  className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isWinner 
                      ? `${theme.winnerRowBg} ${theme.winnerBorder} shadow-sm` 
                      : 'bg-slate-50/80 border-slate-200'
                  } p-3 sm:p-3.5 flex flex-col justify-center`}
                >
                  {/* Smooth Progress Bar */}
                  <div className="absolute inset-y-0 right-0 z-0 flex items-center justify-end w-full px-2 py-1.5 pointer-events-none">
                    <div 
                      className={`h-full rounded-xl opacity-20 transition-all duration-500 ease-out ${
                        isWinner ? theme.barGradient : 'bg-slate-300'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className="relative z-10 flex items-center gap-3">
                    {/* Rank Indicator */}
                    <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-colors ${
                      isWinner 
                        ? `${theme.badgeBg} ${theme.tagColor} border ${theme.badgeBorder}`
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      <span className="text-base font-black">{(index + 1).toLocaleString('fa-IR')}</span>
                    </div>

                    {/* Candidate Photo / Avatar */}
                    {candidate.photoUrl ? (
                      <img 
                        src={candidate.photoUrl} 
                        alt={candidate.name} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-xs shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-200/90 border border-slate-300/80 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
                        <User size={20} className="text-slate-400" />
                      </div>
                    )}

                    {/* Candidate Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-bold truncate text-slate-900">
                          {candidate.name}
                        </h4>
                        {isWinner && (
                          <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${theme.winnerBadge} border`}>
                            منتخب ({index + 1})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Votes & Percentage of Ballots */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-left">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900">
                            {candidate.votes.toLocaleString('fa-IR')}
                          </span>
                          <span className="text-[11px] text-slate-600">رأی</span>
                        </div>
                      </div>

                      <div className="w-16 text-left">
                        <div className={`font-black text-base sm:text-lg tabular-nums ${theme.tagColor}`}>
                          {parseFloat(percentageOfBallots).toLocaleString('fa-IR')}٪
                        </div>
                        <div className="text-[9px] font-medium text-slate-600">از تعرفه‌ها</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {sortedCandidates.length === 0 && (
              <div className="text-center py-10 font-medium text-sm text-slate-400">
                کاندیدایی برای این انتخابات تعریف نشده است
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------- MODE: CONFIDENCE VOTE -------------------- */}
      {isConfidenceMode && (
        <div className="flex-1 flex flex-col justify-between">
          {/* Subject Card */}
          <div className="rounded-2xl p-4 sm:p-5 mb-4 text-center border bg-slate-50 border-slate-200">
            <div className={`text-xs font-bold mb-1 flex items-center justify-center gap-1.5 ${theme.tagColor}`}>
              <ShieldCheck size={16} />
              <span>موضوع رأی اعتماد</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black mb-1 text-slate-900">
              {confidence.candidateName || 'شخص معرفی شده'}
            </h3>
            <p className="text-xs text-slate-600">
              حد نصاب قانونی: کسب اکثریت مطلق آرا (حداقل {Math.floor(totalVotes / 2) + 1} رأی موافق)
            </p>
          </div>

          {/* Stat Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            <StatCard 
              title="کل مأخوذه" 
              value={totalVotes} 
              subtitle="تعرفه‌ها"
              icon={<Users size={16} className="text-blue-600" />}
              gradient="from-blue-50 to-white"
              borderColor="border-blue-200"
              textColor="text-blue-950"
            />
            <StatCard 
              title="موافق (آری)" 
              value={yesVotes} 
              subtitle="آرای مثبت"
              icon={<ThumbsUp size={16} className="text-emerald-600" />}
              gradient="from-emerald-50 to-white"
              borderColor="border-emerald-200"
              textColor="text-emerald-950"
            />
            <StatCard 
              title="مخالف (نه)" 
              value={noVotes} 
              subtitle="آرای منفی"
              icon={<ThumbsDown size={16} className="text-rose-600" />}
              gradient="from-rose-50 to-white"
              borderColor="border-rose-200"
              textColor="text-rose-950"
            />
            <StatCard 
              title="باطله / ممتنع" 
              value={invalidVotes} 
              subtitle="سفید یا مخدوش"
              icon={<XCircle size={16} className="text-amber-600" />}
              gradient="from-amber-50 to-white"
              borderColor="border-amber-200"
              textColor="text-amber-950"
            />
          </div>

          {/* Visual Gauge Bar */}
          <div className="border rounded-2xl p-4 sm:p-5 mb-4 bg-slate-50 border-slate-200">
            <div className="flex justify-between items-center mb-2.5">
              <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-emerald-700">
                <ThumbsUp size={16} />
                <span>موافق: {parseFloat(yesPercentage).toLocaleString('fa-IR')}٪ ({yesVotes.toLocaleString('fa-IR')} رأی)</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-rose-700">
                <span>مخالف: {parseFloat(noPercentage).toLocaleString('fa-IR')}٪ ({noVotes.toLocaleString('fa-IR')} رأی)</span>
                <ThumbsDown size={16} />
              </div>
            </div>

            {/* Split Progress Bar */}
            <div className="w-full h-10 rounded-xl overflow-hidden flex p-1 border border-slate-300 bg-slate-200 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg flex items-center justify-center font-black text-white text-xs shadow-xs transition-all duration-500 ease-out"
                style={{ width: `${Math.max(yesVotes > 0 ? 5 : 0, parseFloat(yesPercentage))}%` }}
              >
                {yesVotes > 0 && `${yesVotes.toLocaleString('fa-IR')}`}
              </div>

              <div className="w-1 shrink-0 bg-slate-300"></div>

              <div 
                className="h-full bg-gradient-to-l from-rose-600 to-rose-500 rounded-lg flex items-center justify-center font-black text-white text-xs mr-auto shadow-xs transition-all duration-500 ease-out"
                style={{ width: `${Math.max(noVotes > 0 ? 5 : 0, parseFloat(noPercentage))}%` }}
              >
                {noVotes > 0 && `${noVotes.toLocaleString('fa-IR')}`}
              </div>
            </div>
          </div>

          {/* Outcome Badge */}
          <div className={`rounded-2xl p-4 border text-center flex items-center justify-center gap-3 ${
            isApproved 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm' 
              : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isApproved 
                ? 'bg-emerald-500/20 text-emerald-600' 
                : isCountingComplete 
                  ? 'bg-rose-500/20 text-rose-600' 
                  : 'bg-amber-500/20 text-amber-600'
            }`}>
              {isApproved ? <CheckCircle size={24} /> : isCountingComplete ? <AlertCircle size={24} /> : <ShieldCheck size={24} />}
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-slate-500">
                وضعیت حد نصاب قانونی
              </div>
              <div className="text-sm sm:text-base font-black text-slate-900">
                {isApproved 
                  ? 'رأی اعتماد مورد تأیید قرار گرفت (کسب اکثریت مطلق)' 
                  : isCountingComplete 
                    ? 'رأی اعتماد احراز نگردید' 
                    : `در حال شمارش (حداقل ${Math.floor(totalVotes / 2) + 1} رأی موافق لازم است)`}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function StatCard({ title, value, icon, gradient, borderColor, textColor, subtitle }: {
  title: string;
  value: number | string;
  icon: ReactNode;
  gradient: string;
  borderColor: string;
  textColor: string;
  subtitle?: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} border ${borderColor} rounded-2xl p-2.5 sm:p-3 shadow-xs flex items-center gap-2.5`}>
      <div className="p-2 rounded-xl shrink-0 border bg-white border-slate-200 shadow-xs">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-none mb-1 truncate text-slate-600">{title}</div>
        <div className={`text-base sm:text-lg font-black ${textColor} tabular-nums leading-tight truncate`}>
          {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
        </div>
        {subtitle && (
          <div className="text-[10px] font-medium leading-none mt-0.5 truncate text-slate-500">{subtitle}</div>
        )}
      </div>
    </div>
  );
}
