import { SingleElection } from '../types';
import type { ReactNode } from 'react';
import { getCompetitiveStats, getConfidenceStats, isElectionLocked } from '../utils/electionStats';
import {
  Users, CheckCircle, XCircle, ShieldCheck,
  ThumbsUp, ThumbsDown, Award, AlertCircle, User,
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
  tagColor: 'text-sky-800',
  badgeBg: 'bg-sky-50',
  badgeBorder: 'border-sky-200',
  badgeText: 'text-sky-900',
  titleGradient: 'text-slate-900',
  borderAccent: 'border-slate-200',
  glowShadow: 'shadow-sm',
  primaryBg: 'bg-sky-700',
  barGradient: 'bg-sky-700',
  winnerBadge: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  winnerRowBg: 'bg-emerald-50/70',
  winnerBorder: 'border-emerald-300',
  statGradient: 'bg-white',
  statBorder: 'border-slate-200',
  statText: 'text-slate-900',
};

export const electionTheme2: DisplayThemeConfig = {
  id: 'election2',
  tag: 'انتخابات دوم',
  tagColor: 'text-slate-700',
  badgeBg: 'bg-slate-100',
  badgeBorder: 'border-slate-300',
  badgeText: 'text-slate-900',
  titleGradient: 'text-slate-900',
  borderAccent: 'border-slate-200',
  glowShadow: 'shadow-sm',
  primaryBg: 'bg-slate-800',
  barGradient: 'bg-slate-800',
  winnerBadge: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  winnerRowBg: 'bg-emerald-50/70',
  winnerBorder: 'border-emerald-300',
  statGradient: 'bg-white',
  statBorder: 'border-slate-200',
  statText: 'text-slate-900',
};

interface SingleElectionDisplayProps {
  election: SingleElection;
  theme: DisplayThemeConfig;
  isHalfScreen?: boolean;
  isDualMode?: boolean;
  variant?: 'preview' | 'hall';
}

export function SingleElectionDisplay({
  election,
  theme,
  isHalfScreen: _isHalfScreen = false,
  isDualMode = false,
  variant = 'preview',
}: SingleElectionDisplayProps) {
  const isHall = variant === 'hall';
  const isConfidenceMode = election.type === 'confidence';
  const competitive = getCompetitiveStats(election);
  const confidenceStats = getConfidenceStats(election);
  const locked = isElectionLocked(election);

  const {
    invalidVotes,
    totalCandidateMarks: validVotesCompetitive,
    countedBallots,
    countedPercentage,
    isTotalBallotsKnown,
    totalVotes,
    averageNamesPerBallot,
    ranked: sortedCandidates,
    hasSeatTie,
    majorityRule,
    requiredAbsoluteVotes,
    hasUnfilledSeats,
  } = competitive;

  const {
    yesVotes,
    noVotes,
    yesPercentage,
    noPercentage,
    requiredYes,
    outcome,
  } = confidenceStats;

  if (!election.active) {
    return (
      <div className={`w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white/80 flex flex-col items-center justify-center text-center shadow-sm ${isHall ? 'ems-hall-panel min-h-0 h-full' : 'h-full min-h-[350px] p-8'}`}>
        <div className="p-4 rounded-2xl bg-slate-100 text-slate-500 border border-slate-200 mb-4">
          <AlertCircle size={isHall ? 48 : 36} />
        </div>
        <div className={`font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200 mb-2 ${isHall ? 'ems-hall-badge' : 'text-[11px] px-2.5 py-1'}`}>
          {isDualMode ? (theme.id === 'election1' ? 'انتخابات اول' : 'انتخابات دوم') : 'انتخابات'}
        </div>
        <h3 className={`font-bold text-slate-800 mb-1 ${isHall ? 'ems-hall-title' : 'text-xl'}`}>
          {election.title || 'عنوان انتخابات'} (غیرفعال)
        </h3>
        <p className={`text-slate-500 max-w-md ${isHall ? 'ems-hall-meta' : 'text-xs'}`}>
          این انتخابات در حال حاضر در وضعیت غیرفعال قرار دارد. در صورت نیاز، از پنل اپراتور می‌توانید آن را فعال کنید.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-2xl border flex flex-col transition-colors duration-200 ${theme.borderAccent} bg-white text-slate-900 ${theme.glowShadow} ${
        isHall ? 'ems-hall-panel min-h-0' : 'p-4 sm:p-6'
      }`}
    >
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 ${isHall ? 'ems-hall-header' : 'pb-4 mb-5'}`}>
        <div className="flex items-center gap-2.5 flex-wrap">
          {isDualMode && (
            <div className={`${theme.badgeBg} border ${theme.badgeBorder} ${theme.badgeText} font-bold flex items-center gap-1.5 shrink-0 rounded-lg ${isHall ? 'ems-hall-badge' : 'px-2.5 py-1 text-xs'}`}>
              {theme.id === 'election1' ? <Users size={isHall ? 18 : 14} /> : <ShieldCheck size={isHall ? 18 : 14} />}
              <span>{theme.id === 'election1' ? 'انتخابات اول' : 'انتخابات دوم'}</span>
            </div>
          )}
          <span className={`font-semibold rounded-md text-slate-600 bg-slate-100 border border-slate-200 ${isHall ? 'ems-hall-badge' : 'text-[11px] px-2 py-0.5'}`}>
            {isConfidenceMode ? 'رأی اعتماد' : 'چند کاندیدا'}
          </span>
          {locked && (
            <span className={`font-bold rounded-md bg-sky-50 text-sky-900 border border-sky-200 ${isHall ? 'ems-hall-badge' : 'text-[11px] px-2 py-0.5'}`}>
              شمارش قفل است
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isConfidenceMode ? (
            <span className={`font-medium text-slate-600 ${isHall ? 'ems-hall-meta' : 'text-xs'}`}>
              نصاب: اکثریت مطلق (&gt;۵۰٪)
            </span>
          ) : (
            <>
              <span className={`${theme.winnerBadge} font-bold flex items-center gap-1 border rounded-md ${isHall ? 'ems-hall-badge' : 'text-xs px-2 py-0.5'}`}>
                <Award size={isHall ? 16 : 13} />
                <span>{election.winnersCount || 1} نفر منتخب</span>
              </span>
              <span className={`font-semibold text-slate-600 ${isHall ? 'ems-hall-meta' : 'text-[11px]'}`}>
                {majorityRule === 'absolute' ? 'اکثریت مطلق' : 'اکثریت نسبی'}
              </span>
            </>
          )}
        </div>
      </div>

      <div className={`text-center ${isHall ? 'ems-hall-title-wrap' : 'mb-5'}`}>
        <h2 className={`font-bold leading-tight tracking-tight text-slate-900 ${isHall ? 'ems-hall-title' : 'text-2xl sm:text-3xl'}`}>
          {election.title || 'عنوان انتخابات'}
        </h2>
      </div>

      {!isConfidenceMode && (
        <div className="flex-1 flex flex-col justify-between min-h-0">
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 ${isHall ? 'ems-hall-stats' : 'mb-5'}`}>
            <StatCard
              isHall={isHall}
              title="کل تعرفه‌ها"
              value={isTotalBallotsKnown && totalVotes > 0 ? `${totalVotes.toLocaleString('fa-IR')}` : 'نامشخص'}
              subtitle={isTotalBallotsKnown && totalVotes > 0 ? 'برگه‌های مأخوذه' : 'شمارش آزاد (پویا)'}
              icon={<Users size={isHall ? 18 : 17} className="text-slate-700" />}
            />
            <StatCard
              isHall={isHall}
              title="تعرفه‌های قرائت‌شده"
              value={`${countedBallots.toLocaleString('fa-IR')}`}
              subtitle={
                isTotalBallotsKnown && totalVotes > 0
                  ? `${Math.min(100, Math.round((countedBallots / totalVotes) * 100))}٪ کل برگه‌ها`
                  : 'برگه‌های خوانده‌شده'
              }
              icon={<CheckCircle size={isHall ? 18 : 17} className={theme.tagColor} />}
            />
            <StatCard
              isHall={isHall}
              title="برگه‌های باطله / سفید"
              value={`${invalidVotes.toLocaleString('fa-IR')}`}
              subtitle="تعرفه‌های غیرقابل قبول"
              icon={<XCircle size={isHall ? 18 : 17} className="text-rose-700" />}
            />
            <StatCard
              isHall={isHall}
              title="مجموع آرای کاندیداها"
              value={`${validVotesCompetitive.toLocaleString('fa-IR')}`}
              subtitle={
                countedBallots > 0
                  ? `میانگین ${averageNamesPerBallot.toFixed(1)} نام در هر برگه`
                  : 'کل انتخاب‌های ثبت‌شده'
              }
              icon={<Award size={isHall ? 18 : 17} className="text-slate-700" />}
            />
          </div>

          {isTotalBallotsKnown && totalVotes > 0 && (
            <div className={`rounded-2xl border border-slate-200 bg-slate-50 shrink-0 ${isHall ? 'p-2 mb-2' : 'mb-4 p-3'}`}>
              <div className={`flex justify-between items-center mb-1.5 ${isHall ? 'ems-hall-meta' : 'text-xs'}`}>
                <span className="font-bold text-slate-700">پیشرفت قرائت تعرفه‌ها:</span>
                <span className="font-bold text-slate-900">
                  {countedBallots.toLocaleString('fa-IR')} از {totalVotes.toLocaleString('fa-IR')} برگه ({countedPercentage.toLocaleString('fa-IR')}٪)
                </span>
              </div>
              <div className={`w-full rounded-full overflow-hidden bg-slate-200 ${isHall ? 'ems-hall-bar' : 'h-2.5'}`}>
                <div
                  className={`h-full ${theme.barGradient} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(100, (countedBallots / totalVotes) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className={`flex flex-col flex-1 min-h-0 ${isHall ? 'ems-hall-candidates' : 'gap-2.5'}`}>
            {hasSeatTie && (
              <div className={`mb-1 font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 ${isHall ? 'ems-hall-meta' : 'text-xs'}`}>
                تساوی در کسب کرسی: بدون تصمیم هیئت رئیسه، منتخب نهایی از میان نامزدهای هم‌رأی مشخص نمی‌شود.
              </div>
            )}
            {hasUnfilledSeats && (
              <div className={`mb-1 font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 ${isHall ? 'ems-hall-meta' : 'text-xs'}`}>
                کرسی خالی: حداقل اکثریت مطلق {requiredAbsoluteVotes.toLocaleString('fa-IR')} رأی (بیش از نصف برگه‌های قرائت‌شده) احراز نشده. همه کرسی‌ها پر نمی‌شوند.
              </div>
            )}

            {sortedCandidates.map((candidate) => {
              const isWinner = candidate.status === 'winner';
              const isTie = candidate.status === 'tie';
              const isShort = candidate.status === 'short';
              const percentageOfBallots = candidate.percentageOfBallots.toFixed(1);
              const barWidth = candidate.barWidth;

              return (
                <div
                  key={candidate.id}
                  className={`relative overflow-hidden rounded-2xl border transition-colors duration-200 ${
                    isTie
                      ? 'bg-slate-50 border-slate-400'
                      : isShort
                        ? 'bg-slate-50 border-slate-300'
                        : isWinner
                          ? `${theme.winnerRowBg} ${theme.winnerBorder}`
                          : 'bg-slate-50/80 border-slate-200'
                  } ${isHall ? 'ems-hall-candidate-row' : 'p-3 sm:p-3.5'} flex flex-col justify-center`}
                >
                  <div className="absolute inset-y-0 right-0 z-0 flex items-center justify-end w-full px-2 py-1.5 pointer-events-none">
                    <div
                      className={`h-full rounded-xl opacity-20 transition-all duration-500 ease-out ${
                        isWinner ? theme.barGradient : 'bg-slate-300'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className={`relative z-10 flex items-center ${isHall ? 'gap-2.5' : 'gap-3'}`}>
                    <div
                      className={`flex items-center justify-center rounded-xl shrink-0 ${
                        isWinner
                          ? `${theme.badgeBg} ${theme.tagColor} border ${theme.badgeBorder}`
                          : 'bg-slate-200 text-slate-700'
                      } ${isHall ? 'w-9 h-9' : 'w-9 h-9'}`}
                    >
                      <span className={isHall ? 'ems-hall-rank' : 'text-base font-bold'}>
                        {candidate.rank.toLocaleString('fa-IR')}
                      </span>
                    </div>

                    {candidate.photoUrl ? (
                      <img
                        src={candidate.photoUrl}
                        alt={candidate.name}
                        referrerPolicy="no-referrer"
                        className={`rounded-full object-cover border-2 border-white shrink-0 ${isHall ? 'ems-hall-avatar' : 'w-10 h-10 sm:w-11 sm:h-11'}`}
                      />
                    ) : (
                      <div className={`rounded-full bg-slate-200 border border-slate-300 text-slate-500 flex items-center justify-center shrink-0 ${isHall ? 'ems-hall-avatar' : 'w-10 h-10 sm:w-11 sm:h-11'}`}>
                        <User size={isHall ? 22 : 20} className="text-slate-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`truncate text-slate-900 ${isHall ? 'ems-hall-name' : 'text-base sm:text-lg font-bold'}`}>
                          {candidate.name}
                        </h4>
                        {isWinner && (
                          <span className={`shrink-0 font-bold rounded-md ${theme.winnerBadge} border ${isHall ? 'ems-hall-badge' : 'text-[11px] px-2 py-0.5'}`}>
                            منتخب ({candidate.rank})
                          </span>
                        )}
                        {isTie && (
                          <span className={`shrink-0 font-bold rounded-md bg-slate-100 text-slate-800 border border-slate-300 ${isHall ? 'ems-hall-badge' : 'text-[11px] px-2 py-0.5'}`}>
                            تساوی کرسی
                          </span>
                        )}
                        {isShort && (
                          <span className={`shrink-0 font-bold rounded-md bg-slate-200 text-slate-800 border border-slate-300 ${isHall ? 'ems-hall-badge' : 'text-[11px] px-2 py-0.5'}`}>
                            کمتر از اکثریت مطلق
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`flex items-center shrink-0 ${isHall ? 'gap-3' : 'gap-4'}`}>
                      <div className="text-left">
                        <div className="flex items-baseline gap-1">
                          <span className={`tabular-nums text-slate-900 ${isHall ? 'ems-hall-votes' : 'text-2xl sm:text-3xl font-bold'}`}>
                            {candidate.votes.toLocaleString('fa-IR')}
                          </span>
                          <span className={`text-slate-600 ${isHall ? 'ems-hall-meta' : 'text-[11px]'}`}>رأی</span>
                        </div>
                      </div>

                      <div className={`text-left ${isHall ? 'min-w-20' : 'w-16'}`}>
                        <div className={`tabular-nums ${theme.tagColor} ${isHall ? 'ems-hall-pct' : 'font-bold text-base sm:text-lg'}`}>
                          {parseFloat(percentageOfBallots).toLocaleString('fa-IR')}٪
                        </div>
                        <div className={`font-medium text-slate-600 ${isHall ? 'ems-hall-stat-sub' : 'text-[9px]'}`}>از تعرفه‌ها</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {sortedCandidates.length === 0 && (
              <div className={`text-center font-medium text-slate-400 ${isHall ? 'ems-hall-meta py-4' : 'text-sm py-10'}`}>
                کاندیدایی برای این انتخابات تعریف نشده است
              </div>
            )}
          </div>
        </div>
      )}

      {isConfidenceMode && (
        <div className={`flex-1 flex flex-col justify-between min-h-0 ${isHall ? 'gap-2' : ''}`}>
          <div className={`rounded-2xl text-center border bg-slate-50 border-slate-200 shrink-0 ${isHall ? 'p-3 mb-2' : 'p-4 sm:p-5 mb-4'}`}>
            <div className={`font-bold mb-1 flex items-center justify-center gap-1.5 ${theme.tagColor} ${isHall ? 'ems-hall-meta' : 'text-xs'}`}>
              <ShieldCheck size={isHall ? 16 : 16} />
              <span>موضوع رأی اعتماد</span>
            </div>
            <h3 className={`mb-1 text-slate-900 ${isHall ? 'ems-hall-title' : 'text-xl sm:text-2xl font-bold'}`}>
              {election.confidence.candidateName || 'شخص معرفی شده'}
            </h3>
            <p className={`text-slate-600 ${isHall ? 'ems-hall-meta' : 'text-xs'}`}>
              حد نصاب قانونی: کسب اکثریت مطلق آرا (حداقل {requiredYes.toLocaleString('fa-IR')} رأی موافق)
            </p>
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 ${isHall ? 'ems-hall-stats' : 'mb-4'}`}>
            <StatCard isHall={isHall} title="کل مأخوذه" value={totalVotes} subtitle="تعرفه‌ها" icon={<Users size={isHall ? 18 : 16} className="text-slate-700" />} />
            <StatCard isHall={isHall} title="موافق (آری)" value={yesVotes} subtitle="آرای مثبت" icon={<ThumbsUp size={isHall ? 18 : 16} className="text-emerald-700" />} />
            <StatCard isHall={isHall} title="مخالف (نه)" value={noVotes} subtitle="آرای منفی" icon={<ThumbsDown size={isHall ? 18 : 16} className="text-rose-700" />} />
            <StatCard isHall={isHall} title="باطله / ممتنع" value={invalidVotes} subtitle="سفید یا مخدوش" icon={<XCircle size={isHall ? 18 : 16} className="text-slate-600" />} />
          </div>

          <div className={`border rounded-2xl bg-slate-50 border-slate-200 shrink-0 ${isHall ? 'p-3 mb-2' : 'p-4 sm:p-5 mb-4'}`}>
            <div className={`flex justify-between items-center mb-2.5 ${isHall ? 'ems-hall-meta' : 'text-sm sm:text-base'} font-bold`}>
              <div className="flex items-center gap-1.5 text-emerald-800">
                <ThumbsUp size={isHall ? 16 : 16} />
                <span>موافق: {Number(yesPercentage.toFixed(1)).toLocaleString('fa-IR')}٪ ({yesVotes.toLocaleString('fa-IR')} رأی)</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-700">
                <span>مخالف: {Number(noPercentage.toFixed(1)).toLocaleString('fa-IR')}٪ ({noVotes.toLocaleString('fa-IR')} رأی)</span>
                <ThumbsDown size={isHall ? 16 : 16} />
              </div>
            </div>

            <div className={`w-full rounded-xl overflow-hidden flex p-1 border border-slate-300 bg-slate-200 ${isHall ? 'h-9' : 'h-10'}`}>
              <div
                className="h-full bg-emerald-700 rounded-lg flex items-center justify-center font-bold text-white transition-all duration-500 ease-out"
                style={{ width: `${Math.max(yesVotes > 0 ? 5 : 0, yesPercentage)}%`, fontSize: isHall ? '0.85rem' : undefined }}
              >
                {yesVotes > 0 && `${yesVotes.toLocaleString('fa-IR')}`}
              </div>
              <div className="w-1 shrink-0 bg-slate-300" />
              <div
                className="h-full bg-rose-700 rounded-lg flex items-center justify-center font-bold text-white mr-auto transition-all duration-500 ease-out"
                style={{ width: `${Math.max(noVotes > 0 ? 5 : 0, noPercentage)}%`, fontSize: isHall ? '0.85rem' : undefined }}
              >
                {noVotes > 0 && `${noVotes.toLocaleString('fa-IR')}`}
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl border text-center flex items-center justify-center gap-3 ${
              outcome === 'approved' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-slate-100 border-slate-200 text-slate-800'
            } shrink-0 ${isHall ? 'p-3' : 'p-4'}`}
          >
            <div
              className={`rounded-xl flex items-center justify-center shrink-0 ${
                outcome === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : outcome === 'rejected'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-200 text-slate-600'
              } ${isHall ? 'w-10 h-10' : 'w-10 h-10'}`}
            >
              {outcome === 'approved' ? <CheckCircle size={isHall ? 22 : 24} /> : outcome === 'rejected' ? <AlertCircle size={isHall ? 22 : 24} /> : <ShieldCheck size={isHall ? 22 : 24} />}
            </div>
            <div className="text-right">
              <div className={`font-semibold text-slate-500 ${isHall ? 'ems-hall-stat-sub' : 'text-[10px]'}`}>وضعیت حد نصاب قانونی</div>
              <div className={`font-bold text-slate-900 ${isHall ? 'ems-hall-name' : 'text-sm sm:text-base'}`}>
                {outcome === 'approved'
                  ? 'رأی اعتماد مورد تأیید قرار گرفت (کسب اکثریت مطلق)'
                  : outcome === 'rejected'
                    ? 'رأی اعتماد احراز نگردید'
                    : `در حال شمارش (حداقل ${requiredYes.toLocaleString('fa-IR')} رأی موافق لازم است)`}
                {locked ? ' — شمارش قفل شده است' : ''}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
  isHall = false,
}: {
  title: string;
  value: number | string;
  icon: ReactNode;
  subtitle?: string;
  isHall?: boolean;
}) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl flex items-center ${isHall ? 'p-2 gap-2' : 'p-2.5 sm:p-3 gap-2.5'}`}>
      <div className={`rounded-lg shrink-0 border border-slate-200 bg-slate-50 ${isHall ? 'p-1.5' : 'p-2'}`}>{icon}</div>
      <div className="min-w-0">
        <div className={`font-bold leading-snug mb-1 text-slate-600 ${isHall ? 'ems-hall-stat-label' : 'text-[11px]'}`}>{title}</div>
        <div className={`tabular-nums leading-tight text-slate-900 ${isHall ? 'ems-hall-stat-value' : 'text-base sm:text-lg font-bold'}`}>
          {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
        </div>
        {subtitle && (
          <div className={`font-medium leading-snug mt-0.5 text-slate-500 ${isHall ? 'ems-hall-stat-sub' : 'text-[10px]'}`}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}
