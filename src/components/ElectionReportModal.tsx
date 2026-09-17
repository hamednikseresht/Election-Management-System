import { useState } from 'react';
import { SingleElection } from '../types';
import { getCompetitiveStats, getConfidenceStats } from '../utils/electionStats';
import { 
  Printer, Download, X, FileText, Calendar, Clock
} from 'lucide-react';

interface ElectionReportModalProps {
  election: SingleElection;
  isOpen: boolean;
  onClose: () => void;
}

export function ElectionReportModal({
  election,
  isOpen,
  onClose
}: ElectionReportModalProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const now = election.concludedAt ? new Date(election.concludedAt) : new Date();
  const persianDate = new Intl.DateTimeFormat('fa-IR', { 
    dateStyle: 'full' 
  }).format(now);
  const persianTime = new Intl.DateTimeFormat('fa-IR', { 
    timeStyle: 'medium' 
  }).format(now);
  const reportNumber = `ELC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const competitive = getCompetitiveStats(election);
  const confidenceStats = getConfidenceStats(election);
  const countedBallots = competitive.countedBallots;
  const totalVotes = competitive.totalVotes;
  const invalidVotes = competitive.invalidVotes;
  const isTotalBallotsKnown = competitive.isTotalBallotsKnown;
  const ballotBase = countedBallots > 0 ? countedBallots : 1;
  const sortedCandidates = competitive.ranked;
  const winnersCount = election.winnersCount || 1;
  const totalValidVotes = competitive.totalCandidateMarks;

  const isConfidence = election.type === 'confidence';
  const yesVotes = confidenceStats.yesVotes;
  const noVotes = confidenceStats.noVotes;
  const yesPercentage = confidenceStats.yesPercentage.toFixed(1);
  const noPercentage = confidenceStats.noPercentage.toFixed(1);
  const isApproved = confidenceStats.outcome === 'approved';

  // Print handler - triggers browser print dialog styled for A4 official paper
  const handlePrint = () => {
    window.print();
  };

  // Download official JSON report
  const handleDownloadJSON = () => {
    const reportData = {
      عنوان_صورتجلسه: 'صورتجلسه رسمی و گزارش اعلام نتایج نهایی انتخابات',
      شماره_صورتجلسه: reportNumber,
      عنوان_انتخابات: election.title || 'انتخابات رسمی',
      نوع_انتخابات: isConfidence ? 'رأی اعتماد' : 'چند کاندیدا',
      تاریخ_برگزاری: persianDate,
      ساعت_ثبت_نهایی: persianTime,
      تاریخ_میلادی: now.toISOString(),
      آمار_کلی_تعرفه_ها: {
        سقف_تعرفه_های_ماخوذه: isTotalBallotsKnown && totalVotes > 0 ? totalVotes : 'نامشخص (شمارش پویا)',
        کل_برگه_های_قرائت_شده: countedBallots,
        برگه_های_باطله_و_سفید: invalidVotes,
        مجموع_آرای_صحیح_ماخوذه: isConfidence ? confidenceStats.validVotes : totalValidVotes,
        تعداد_کرسی_های_منتخب: isConfidence ? 1 : winnersCount
      },
      نتایج_کاندیداها: isConfidence
        ? [
            {
              نام_پیشنهاد: election.confidence?.candidateName || 'کاندیدای رأی اعتماد',
              آرای_موافق: yesVotes,
              درصد_موافق: `${yesPercentage}٪`,
              آرای_مخالف: noVotes,
              درصد_مخالف: `${noPercentage}٪`,
              نتیجه_نهایی: isApproved ? 'کسب رأی اعتماد' : 'عدم کسب رأی اعتماد'
            }
          ]
        : sortedCandidates.map((c) => {
            const pct = ballotBase > 0 ? c.percentageOfBallots.toFixed(1) : '0.0';
            return {
              رتبه: c.rank,
              نام_کاندیدا: c.name,
              تعداد_آرا: c.votes,
              درصد_از_کل_تعرفه_ها: `${pct}٪`,
              وضعیت: c.status === 'winner' ? 'عضو منتخب اصلی' : (c.status === 'tie' ? 'تساوی کرسی' : (c.status === 'alternate' ? 'عضو علی‌البدل' : 'عدم انتخاب'))
            };
          }),
      امضاکنندگان_رسمی: [
        { سمت: 'رئیس مجمع عمومی' },
        { سمت: 'ناظر اول مجمع' },
        { سمت: 'ناظر دوم مجمع' },
        { سمت: 'منشی مجمع' }
      ]
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    const safeTitle = (election.title || 'انتخابات').replace(/[\s/\\?%*:|"<>]/g, '_');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `صورتجلسه_${safeTitle}_${now.getTime()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* Container Dialog */}
      <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full my-auto flex flex-col max-h-[92vh] overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        
        {/* Top Actions Bar (Hidden on print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                گزارش رسمی و صورتجلسه پایان انتخابات
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                مشاهده نتایج نهایی، دریافت فایل JSON و صدور خروجی PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="download-report-json-button"
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs cursor-pointer"
              title="ذخیره کامل گزارش و صورتجلسه به صورت فایل JSON"
            >
              <Download size={14} />
              <span>{downloadSuccess ? 'ذخیره شد ✓' : 'ذخیره JSON'}</span>
            </button>

            <button
              type="button"
              id="print-report-pdf-button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-xs cursor-pointer"
              title="چاپ صورتجلسه و ذخیره به عنوان فایل PDF"
            >
              <Printer size={14} />
              <span>چاپ / خروجی PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
              title="بستن پنجره"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div 
          id="election-official-minutes-document"
          className="p-6 sm:p-10 overflow-y-auto flex-1 font-sans text-slate-900 leading-relaxed print:p-0 print:overflow-visible"
        >
          {/* Header of Official Minutes */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6 text-center">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2 print:text-[11px]">
              <div>
                <span>شماره صورتجلسه: </span>
                <span className="font-mono font-bold text-slate-900">{reportNumber}</span>
              </div>
              <div className="text-center font-black text-sm text-slate-800 tracking-wider">
                «بسمه تعالی»
              </div>
              <div>
                <span>تاریخ: </span>
                <span className="font-bold text-slate-900">{persianDate}</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
              صورتجلسه رسمی اعلام نتایج انتخابات
            </h1>
            <h2 className="text-lg sm:text-xl font-extrabold text-indigo-950 mt-1">
              {election.title || 'عنوان انتخابات'}
            </h2>
            <div className="text-xs text-slate-600 mt-1 flex items-center justify-center gap-3">
              <span className="flex items-center gap-1">
                <Clock size={13} />
                ساعت خاتمه و استخراج آرا: {persianTime}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                وضعیت: پایان قطعی رأی‌گیری و تأیید شمارش
              </span>
            </div>
          </div>

          {/* Narrative Preamble */}
          <div className="text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 leading-relaxed print:bg-transparent print:border-none print:p-0 print:mb-4">
            جلسه مجمع عمومی با حضور اعضای محترم رسمیت یافته و پس از پایان مهلت قانونی رأی‌گیری و نظارت مستمر بر روند أخذ و قرائت آرا، شمارش تعرفه‌ها با دقت کامل انجام پذیرفت و آمار قطعی به شرح جدول ذیل مستند گردید:
          </div>

          {/* Section 1: Statistical Summary */}
          <div className="mb-6">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              بخش ۱: خلاصه آمار برگه‌های تعرفه و آرا
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-slate-300 rounded-2xl p-3 bg-white print:rounded-none">
              <div className="text-center p-2 border-l border-slate-200 last:border-l-0">
                <div className="text-[11px] text-slate-600 mb-1">کل تعرفه‌های مأخوذه</div>
                <div className="text-base sm:text-lg font-black text-slate-900">
                  {isTotalBallotsKnown && totalVotes > 0 ? totalVotes.toLocaleString('fa-IR') : 'نامشخص'}
                </div>
              </div>
              <div className="text-center p-2 border-l border-slate-200 last:border-l-0">
                <div className="text-[11px] text-slate-600 mb-1">برگه‌های قرائت‌شده</div>
                <div className="text-base sm:text-lg font-black text-indigo-700">
                  {countedBallots.toLocaleString('fa-IR')}
                </div>
              </div>
              <div className="text-center p-2 border-l border-slate-200 last:border-l-0">
                <div className="text-[11px] text-slate-600 mb-1">برگه‌های باطله و سفید</div>
                <div className="text-base sm:text-lg font-black text-rose-700">
                  {invalidVotes.toLocaleString('fa-IR')}
                </div>
              </div>
              <div className="text-center p-2">
                <div className="text-[11px] text-slate-600 mb-1">کرسی‌های منتخب رسمی</div>
                <div className="text-base sm:text-lg font-black text-emerald-700">
                  {isConfidence ? '۱ نفر (اعتماد)' : `${winnersCount.toLocaleString('fa-IR')} نفر`}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Candidate Results Table */}
          <div className="mb-8">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              بخش ۲: جدول رتبه‌بندی قطعی کاندیداها و وضعیت انتخاب
            </h3>

            {!isConfidence ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-300 print:rounded-none">
                <table className="w-full text-right text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-black">
                      <th className="p-2.5 text-center w-12">رتبه</th>
                      <th className="p-2.5 text-center w-14">تصویر</th>
                      <th className="p-2.5">نام و نام خانوادگی کاندیدا</th>
                      <th className="p-2.5 text-center w-24">تعداد آرا</th>
                      <th className="p-2.5 text-center w-24">درصد آرا</th>
                      <th className="p-2.5 text-center w-32">وضعیت نهایی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCandidates.map((candidate) => {
                      const isWinner = candidate.status === 'winner';
                      const isAlternate = candidate.status === 'alternate';
                      const isTie = candidate.status === 'tie';
                      const percentage = candidate.percentageOfBallots.toFixed(1);

                      return (
                        <tr 
                          key={candidate.id}
                          className={`border-b border-slate-200 transition-colors ${
                            isWinner ? 'bg-indigo-50/50 font-bold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-2.5 text-center font-black">
                            {candidate.rank.toLocaleString('fa-IR')}
                          </td>
                          <td className="p-2 text-center">
                            {candidate.photoUrl ? (
                              <img 
                                src={candidate.photoUrl} 
                                alt={candidate.name} 
                                className="w-8 h-8 rounded-full object-cover mx-auto border border-slate-300"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 mx-auto flex items-center justify-center font-bold text-[10px]">
                                {candidate.rank.toLocaleString('fa-IR')}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-900 font-semibold">
                            {candidate.name}
                          </td>
                          <td className="p-2.5 text-center font-black text-slate-900 tabular-nums">
                            {candidate.votes.toLocaleString('fa-IR')}
                          </td>
                          <td className="p-2.5 text-center font-bold text-indigo-900 tabular-nums">
                            {parseFloat(percentage).toLocaleString('fa-IR')}٪
                          </td>
                          <td className="p-2.5 text-center">
                            {isWinner ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                منتخب اصلی (نفر {candidate.rank})
                              </span>
                            ) : isTie ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                تساوی کرسی
                              </span>
                            ) : isAlternate ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                علی‌البدل
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-medium">
                                عدم کسب نصاب
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Confidence vote mode report */
              <div className="border border-slate-300 rounded-2xl p-4 bg-slate-50 print:bg-transparent">
                <div className="text-base font-bold text-slate-900 mb-3">
                  موضوع رأی اعتماد: <span className="text-indigo-800">{election.confidence?.candidateName || 'کاندیدا'}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="text-xs text-emerald-800 font-bold mb-1">آرای موافق (آری)</div>
                    <div className="text-2xl font-black text-emerald-700">{yesVotes.toLocaleString('fa-IR')}</div>
                    <div className="text-xs text-emerald-600 font-semibold mt-1">{parseFloat(yesPercentage).toLocaleString('fa-IR')}٪</div>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <div className="text-xs text-rose-800 font-bold mb-1">آرای مخالف (نه)</div>
                    <div className="text-2xl font-black text-rose-700">{noVotes.toLocaleString('fa-IR')}</div>
                    <div className="text-xs text-rose-600 font-semibold mt-1">{parseFloat(noPercentage).toLocaleString('fa-IR')}٪</div>
                  </div>
                </div>
                <div className="mt-4 p-2 text-center text-sm font-black rounded-lg border bg-white">
                  نتیجه نهایی: {isApproved ? '✓ کاندیدا موفق به کسب اکثریت آرا و اخذ رأی اعتماد گردید.' : '✕ کاندیدا موفق به کسب نصاب رأی اعتماد نگردید.'}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Official Signatures Box */}
          <div className="border-t-2 border-slate-300 pt-6 mt-8 print:mt-12">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 text-center mb-8">
              صحت و درستی کلیه مراحل رأی‌گیری و استخراج آرا مورد تأیید و گواهی هیئت رئیسه و ناظرین مجمع می‌باشد:
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-slate-900">رئیس مجمع</span>
                <span className="text-[11px] text-slate-500 mt-1">نام و امضا:</span>
                <div className="h-16 w-full border-b border-dashed border-slate-400 mt-2"></div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-slate-900">ناظر اول مجمع</span>
                <span className="text-[11px] text-slate-500 mt-1">نام و امضا:</span>
                <div className="h-16 w-full border-b border-dashed border-slate-400 mt-2"></div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-slate-900">ناظر دوم مجمع</span>
                <span className="text-[11px] text-slate-500 mt-1">نام و امضا:</span>
                <div className="h-16 w-full border-b border-dashed border-slate-400 mt-2"></div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-slate-900">منشی جلسه</span>
                <span className="text-[11px] text-slate-500 mt-1">نام و امضا:</span>
                <div className="h-16 w-full border-b border-dashed border-slate-400 mt-2"></div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
