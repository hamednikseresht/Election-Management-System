import { useState, type FormEvent, type ChangeEvent } from 'react';
import { SingleElection, Candidate, ElectionType } from '../types';
import { DisplayThemeConfig } from './SingleElectionDisplay';
import { fileToBase64Optimized } from '../utils/imageHelper';
import { ElectionReportModal } from './ElectionReportModal';
import { 
  Plus, Trash2, Users, CheckCircle, XCircle, 
  RotateCcw, ThumbsUp, ThumbsDown, ShieldCheck, 
  Minus, Power, Award, AlertCircle, 
  Check, Layers, RefreshCw, HelpCircle,
  Edit2, Camera, FileText
} from 'lucide-react';

interface SingleElectionOperatorProps {
  election: SingleElection;
  onUpdate: (updater: (prev: SingleElection) => SingleElection) => void;
  theme: DisplayThemeConfig;
  isDualMode?: boolean;
}

export function SingleElectionOperator({ 
  election, 
  onUpdate, 
  theme,
  isDualMode = false 
}: SingleElectionOperatorProps) {
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidatePhoto, setNewCandidatePhoto] = useState<string | null>(null);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearCandidatesConfirm, setShowClearCandidatesConfirm] = useState(false);
  const [showFullResetConfirm, setShowFullResetConfirm] = useState(false);
  const [ballotSelectedIds, setBallotSelectedIds] = useState<string[]>([]);
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [editingCandidateVotes, setEditingCandidateVotes] = useState<string>('');
  const [editingCandidateNameId, setEditingCandidateNameId] = useState<string | null>(null);
  const [editingCandidateNameValue, setEditingCandidateNameValue] = useState<string>('');

  const isConfidence = election.type === 'confidence';
  const isTotalBallotsKnown = election.isTotalBallotsKnown ?? true;

  // Total candidate marks
  const totalCandidateVotes = election.candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
  const maxCandidateVotes = election.candidates.reduce((max, c) => Math.max(max, c.votes || 0), 0);
  
  // Logical minimum ballots needed
  const minRequiredBallots = maxCandidateVotes + (election.invalidVotes || 0);
  const countedBallots = typeof election.countedBallots === 'number' 
    ? Math.max(election.countedBallots, minRequiredBallots) 
    : minRequiredBallots;

  // For confidence mode:
  const confidenceTotal = (election.confidence?.yesVotes || 0) + (election.confidence?.noVotes || 0) + (election.invalidVotes || 0);

  const effectiveCounted = isConfidence ? confidenceTotal : countedBallots;

  const countedPercentage = (isTotalBallotsKnown && election.totalVotes > 0)
    ? Math.min(100, Math.round((effectiveCounted / election.totalVotes) * 100))
    : 0;

  const remainingBallots = (isTotalBallotsKnown && election.totalVotes > 0)
    ? Math.max(0, election.totalVotes - effectiveCounted)
    : 0;

  // Handlers
  const handleToggleActive = () => {
    onUpdate(prev => ({ ...prev, active: !prev.active }));
  };

  const handleTypeChange = (newType: ElectionType) => {
    onUpdate(prev => {
      let candidateName = prev.confidence?.candidateName;
      if (newType === 'confidence') {
        if (!candidateName || candidateName.trim() === '') {
          candidateName = prev.candidates[0]?.name || 'شخص مورد نظر';
        }
      }
      return {
        ...prev,
        type: newType,
        confidence: {
          yesVotes: prev.confidence?.yesVotes || 0,
          noVotes: prev.confidence?.noVotes || 0,
          candidateName: candidateName || 'شخص مورد نظر',
        }
      };
    });
  };

  const toggleTotalBallotsKnown = (known: boolean) => {
    onUpdate(prev => ({
      ...prev,
      isTotalBallotsKnown: known,
      totalVotes: known && prev.totalVotes <= 0 ? Math.max(100, effectiveCounted) : prev.totalVotes
    }));
  };

  const handleEndVoting = () => {
    onUpdate(prev => ({
      ...prev,
      concludedAt: new Date().toISOString()
    }));
    setShowReportModal(true);
  };

  const handleNewCandidatePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64Optimized(file);
      setNewCandidatePhoto(base64);
    } catch (err: any) {
      alert(err.message || 'خطا در بارگذاری تصویر');
    }
  };

  const handleCandidatePhotoUpload = async (id: string, file: File) => {
    try {
      const base64 = await fileToBase64Optimized(file);
      onUpdate(prev => ({
        ...prev,
        candidates: prev.candidates.map(c => c.id === id ? { ...c, photoUrl: base64 } : c)
      }));
    } catch (err: any) {
      alert(err.message || 'خطا در بارگذاری تصویر');
    }
  };

  const handleRemoveCandidatePhoto = (id: string) => {
    onUpdate(prev => ({
      ...prev,
      candidates: prev.candidates.map(c => c.id === id ? { ...c, photoUrl: undefined } : c)
    }));
  };

  const addCandidate = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newCandidateName.trim();
    if (!trimmed) {
      setCandidateError('لطفاً نام کاندیدا را وارد کنید.');
      return;
    }

    // Check for duplicate name
    const isDuplicate = election.candidates.some(
      c => c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setCandidateError(`کاندیدایی با نام «${trimmed}» قبلاً ثبت شده است. نام‌ها نباید تکراری باشند.`);
      return;
    }

    setCandidateError(null);
    const newCandidate: Candidate = {
      id: Math.random().toString(36).substring(7),
      name: trimmed,
      votes: 0,
      photoUrl: newCandidatePhoto || undefined,
    };
    onUpdate(prev => ({ ...prev, candidates: [...prev.candidates, newCandidate] }));
    setNewCandidateName('');
    setNewCandidatePhoto(null);
  };

  const removeCandidate = (id: string) => {
    onUpdate(prev => ({ ...prev, candidates: prev.candidates.filter(c => c.id !== id) }));
    setBallotSelectedIds(prev => prev.filter(cId => cId !== id));
  };

  // Direct increment / decrement candidate
  const incrementCandidateVote = (id: string) => {
    onUpdate(prev => {
      const newCandidates = prev.candidates.map(c => c.id === id ? { ...c, votes: c.votes + 1 } : c);
      const newMax = newCandidates.reduce((max, c) => Math.max(max, c.votes), 0);
      const currentBallots = typeof prev.countedBallots === 'number' ? prev.countedBallots : 0;
      return {
        ...prev,
        candidates: newCandidates,
        // Ensure countedBallots is at least the highest individual vote + invalidVotes
        countedBallots: Math.max(currentBallots, newMax + prev.invalidVotes)
      };
    });
  };

  const decrementCandidateVote = (id: string) => {
    onUpdate(prev => ({
      ...prev,
      candidates: prev.candidates.map(c => c.id === id ? { ...c, votes: Math.max(0, c.votes - 1) } : c)
    }));
  };

  const startEditingCandidate = (candidate: Candidate) => {
    setEditingCandidateId(candidate.id);
    setEditingCandidateVotes(candidate.votes.toString());
  };

  const saveEditingCandidate = (id: string) => {
    const parsed = parseInt(editingCandidateVotes, 10);
    const votes = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    onUpdate(prev => {
      const newCandidates = prev.candidates.map(c => c.id === id ? { ...c, votes } : c);
      const newMax = newCandidates.reduce((max, c) => Math.max(max, c.votes), 0);
      const currentBallots = typeof prev.countedBallots === 'number' ? prev.countedBallots : 0;
      return {
        ...prev,
        candidates: newCandidates,
        countedBallots: Math.max(currentBallots, newMax + prev.invalidVotes)
      };
    });
    setEditingCandidateId(null);
  };

  // Fast Ballot Registration (یک تعرفه حاوی نام یک یا چند کاندیدا)
  const toggleBallotCandidate = (id: string) => {
    setBallotSelectedIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const submitCurrentBallot = () => {
    if (ballotSelectedIds.length === 0) return;

    onUpdate(prev => {
      const newCandidates = prev.candidates.map(c => {
        if (ballotSelectedIds.includes(c.id)) {
          return { ...c, votes: c.votes + 1 };
        }
        return c;
      });

      const currentBallots = typeof prev.countedBallots === 'number' 
        ? prev.countedBallots 
        : minRequiredBallots;

      const newMax = newCandidates.reduce((max, c) => Math.max(max, c.votes), 0);

      return {
        ...prev,
        candidates: newCandidates,
        // Add 1 counted ballot paper, but guarantee at least highest individual vote + invalid
        countedBallots: Math.max(currentBallots + 1, newMax + prev.invalidVotes)
      };
    });

    // Clear ballot selections for next ballot paper
    setBallotSelectedIds([]);
  };

  const submitInvalidBallot = () => {
    onUpdate(prev => {
      const currentBallots = typeof prev.countedBallots === 'number' ? prev.countedBallots : minRequiredBallots;
      return {
        ...prev,
        invalidVotes: prev.invalidVotes + 1,
        countedBallots: currentBallots + 1
      };
    });
  };

  // Sync / calibrate ballots manually
  const syncBallotsToVotes = () => {
    onUpdate(prev => ({
      ...prev,
      countedBallots: maxCandidateVotes + prev.invalidVotes
    }));
  };

  // Ballots & Invalid votes
  const incrementInvalidVote = () => {
    onUpdate(prev => {
      const currentBallots = typeof prev.countedBallots === 'number' ? prev.countedBallots : 0;
      return { 
        ...prev, 
        invalidVotes: prev.invalidVotes + 1,
        countedBallots: Math.max(currentBallots, maxCandidateVotes + prev.invalidVotes + 1)
      };
    });
  };

  const decrementInvalidVote = () => {
    onUpdate(prev => ({ 
      ...prev, 
      invalidVotes: Math.max(0, prev.invalidVotes - 1) 
    }));
  };

  // Confidence votes
  const incrementConfidenceYes = () => {
    onUpdate(prev => ({
      ...prev,
      confidence: { ...prev.confidence, yesVotes: prev.confidence.yesVotes + 1 }
    }));
  };

  const decrementConfidenceYes = () => {
    onUpdate(prev => ({
      ...prev,
      confidence: { ...prev.confidence, yesVotes: Math.max(0, prev.confidence.yesVotes - 1) }
    }));
  };

  const incrementConfidenceNo = () => {
    onUpdate(prev => ({
      ...prev,
      confidence: { ...prev.confidence, noVotes: prev.confidence.noVotes + 1 }
    }));
  };

  const decrementConfidenceNo = () => {
    onUpdate(prev => ({
      ...prev,
      confidence: { ...prev.confidence, noVotes: Math.max(0, prev.confidence.noVotes - 1) }
    }));
  };

  const resetAllVotes = () => {
    onUpdate(prev => ({
      ...prev,
      invalidVotes: 0,
      countedBallots: 0,
      candidates: prev.candidates.map(c => ({ ...c, votes: 0 })),
      confidence: { ...prev.confidence, yesVotes: 0, noVotes: 0 },
    }));
    setBallotSelectedIds([]);
    setShowResetConfirm(false);
  };

  const clearAllCandidates = () => {
    onUpdate(prev => ({
      ...prev,
      candidates: [],
      countedBallots: prev.invalidVotes,
    }));
    setBallotSelectedIds([]);
    setShowClearCandidatesConfirm(false);
  };

  const fullResetElection = () => {
    onUpdate(prev => ({
      ...prev,
      title: '',
      totalVotes: 0,
      countedBallots: 0,
      invalidVotes: 0,
      candidates: [],
      confidence: { candidateName: '', yesVotes: 0, noVotes: 0 },
    }));
    setBallotSelectedIds([]);
    setShowFullResetConfirm(false);
  };

  const startEditingCandidateName = (candidate: Candidate) => {
    setEditingCandidateNameId(candidate.id);
    setEditingCandidateNameValue(candidate.name);
  };

  const saveEditingCandidateName = (id: string) => {
    const trimmed = editingCandidateNameValue.trim();
    if (!trimmed) {
      setEditingCandidateNameId(null);
      return;
    }

    const isDuplicate = election.candidates.some(
      c => c.id !== id && c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      alert(`نام «${trimmed}» قبلاً برای کاندیدای دیگری ثبت شده است. نام‌ها نباید تکراری باشند.`);
      return;
    }

    onUpdate(prev => ({
      ...prev,
      candidates: prev.candidates.map(c => c.id === id ? { ...c, name: trimmed } : c)
    }));
    setEditingCandidateNameId(null);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-md p-4 sm:p-6 flex flex-col gap-5">
      
      {/* Header with Title & Active/Inactive Toggle & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`px-2.5 py-1 rounded-lg ${theme.badgeBg} border ${theme.badgeBorder} ${theme.badgeText} text-xs font-black flex items-center gap-1.5`}>
            {theme.id === 'election1' ? <Award size={15} /> : <ShieldCheck size={15} />}
            <span>{isDualMode ? (theme.id === 'election1' ? 'انتخابات اول' : 'انتخابات دوم') : 'انتخابات'}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleActive}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                election.active 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
              }`}
            >
              <Power size={13} />
              <span>{election.active ? 'فعال (در حال نمایش)' : 'غیرفعال (مخفی)'}</span>
            </button>
          </div>

          {/* End Voting & Official Minutes Button */}
          <button
            type="button"
            id={`end-voting-btn-${election.id}`}
            onClick={handleEndVoting}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all shadow-xs cursor-pointer"
            title="پایان فرآیند رأی‌گیری و صدور صورتجلسه رسمی و گزارش کامل"
          >
            <FileText size={13} className="text-indigo-600" />
            <span>پایان رأی‌گیری و صورتجلسه</span>
          </button>

          {/* Prominent Reset/Restart Button for this election */}
          {showResetConfirm ? (
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 p-1 px-2.5 rounded-xl text-xs">
              <span className="text-rose-900 font-bold">ریست کامل؟</span>
              <button
                type="button"
                onClick={resetAllVotes}
                className="px-2.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-lg transition-colors cursor-pointer"
              >
                تأیید صفر شدن
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-2 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
              >
                انصراف
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer"
              title="صفر کردن تمام آرا و برگه‌های این انتخابات و شروع دوباره"
            >
              <RotateCcw size={12} className="text-rose-600" />
              <span>شروع مجدد (ریست)</span>
            </button>
          )}
        </div>

        {/* Election Type Toggle */}
        <div className="flex p-1 rounded-xl border border-slate-200 bg-slate-100 text-xs">
          <button
            type="button"
            onClick={() => handleTypeChange('candidates')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              election.type === 'candidates'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            چند کاندیدا (رقابتی)
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('confidence')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              election.type === 'confidence'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            رأی اعتماد (آری / نه)
          </button>
        </div>
      </div>

      {/* Inactive Warning Alert */}
      {!election.active && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>این انتخابات در وضعیت <strong>غیرفعال</strong> است و در صفحه نمایشگر نتایج مخفی می‌باشد.</span>
          </div>
          <button
            type="button"
            onClick={handleToggleActive}
            className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
          >
            فعال‌سازی
          </button>
        </div>
      )}

      {/* Title & Winners Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            عنوان رسمی انتخابات:
          </label>
          <input
            type="text"
            value={election.title}
            onChange={(e) => onUpdate(prev => ({ ...prev, title: e.target.value }))}
            placeholder="عنوان انتخابات را بنویسید (مثلاً: انتخابات مجمع عمومی)"
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            نوع شمارش تعرفه (برگه رأی):
          </label>
          <div className="flex p-1 rounded-xl border border-slate-200 bg-slate-100">
            <button
              type="button"
              onClick={() => toggleTotalBallotsKnown(true)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isTotalBallotsKnown ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              سقف مشخص
            </button>
            <button
              type="button"
              onClick={() => toggleTotalBallotsKnown(false)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isTotalBallotsKnown ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              شمارش پویا
            </button>
          </div>
        </div>
      </div>

      {/* Ballots & Voters Management Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                مدیریت تعرفه‌های رأی‌گیری (برگه‌های مأخوذه):
              </div>
              <div className="text-[11px] text-slate-500">
                مبنای محاسبه درصد آرا، تعداد برگه‌های رأی است نه مجموع نام‌های نوشته‌شده.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTotalBallotsKnown ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600">کل تعرفه‌های توزیع‌شده:</span>
                <input
                  type="number"
                  min={0}
                  value={election.totalVotes === 0 ? '' : election.totalVotes}
                  placeholder="0"
                  onChange={(e) => {
                    const rawVal = e.target.value.trim();
                    const val = rawVal === '' ? 0 : parseInt(rawVal, 10);
                    onUpdate(prev => ({ ...prev, totalVotes: isNaN(val) ? 0 : Math.max(0, val) }));
                  }}
                  className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-slate-500">برگه</span>
              </div>
            ) : (
              <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200">
                تعداد کل برگه‌ها نامشخص (محاسبه درصد بر اساس برگه‌های خوانده‌شده)
              </span>
            )}
          </div>
        </div>

        {/* Read Ballots Counter */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700">تعداد تعرفه‌های قرائت‌شده:</span>
            <input
              type="number"
              min={0}
              value={effectiveCounted === 0 ? '' : effectiveCounted}
              placeholder="0"
              onChange={(e) => {
                const rawVal = e.target.value.trim();
                const val = rawVal === '' ? 0 : parseInt(rawVal, 10);
                onUpdate(prev => ({ ...prev, countedBallots: isNaN(val) ? 0 : Math.max(0, val) }));
              }}
              className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-center text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-xs text-slate-500">برگه</span>
            {effectiveCounted < minRequiredBallots && (
              <button
                type="button"
                onClick={syncBallotsToVotes}
                className="text-[11px] text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                title="تراز کردن خودکار تعداد برگه‌ها با بیشترین رأی کاندیدا"
              >
                <RefreshCw size={11} />
                <span>حداقل لازم: {minRequiredBallots} (تراز با آرا)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdate(prev => ({ 
                  ...prev, 
                  countedBallots: Math.max(0, (typeof prev.countedBallots === 'number' ? prev.countedBallots : effectiveCounted) - 1) 
                }))}
                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold text-xs border border-slate-300 cursor-pointer"
                title="کاهش یک برگه"
              >
                <Minus size={13} />
              </button>
              <button
                type="button"
                onClick={() => onUpdate(prev => ({ 
                  ...prev, 
                  countedBallots: (typeof prev.countedBallots === 'number' ? prev.countedBallots : effectiveCounted) + 1 
                }))}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs border border-slate-300 cursor-pointer"
                title="افزایش یک برگه قرائت‌شده"
              >
                +۱ برگه
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {isTotalBallotsKnown && election.totalVotes > 0 ? (
                <>
                  <span className="text-slate-500 font-medium">باقی‌مانده: {remainingBallots} برگه</span>
                  <span className="font-black text-indigo-700">{countedPercentage}٪</span>
                </>
              ) : (
                <span className="text-amber-700 text-[11px] font-medium">شمارش آزاد (بدون سقف اولیه)</span>
              )}
            </div>
          </div>

          {isTotalBallotsKnown && election.totalVotes > 0 && (
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${countedPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Hint banner explaining multiple candidates per ballot */}
        <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 flex items-start gap-2 shadow-xs">
          <HelpCircle size={15} className="text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>نکته انتخابات هیئت مدیره:</strong> رأی‌دهندگان روی یک تعرفه ممکن است نام ۱ یا چند کاندیدا را بنویسند.
            مجموع آرای داده‌شده به کاندیداها ({totalCandidateVotes} رأی) از تعداد برگه‌های تعرفه ({effectiveCounted} برگه) تفکیک شده و درصد هر کاندیدا بر مبنای تعرفه‌ها محاسبه می‌گردد.
          </div>
        </div>

      </div>

      {/* Invalid Votes Counter */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <XCircle size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-rose-950">برگه‌های رأی باطله یا سفید</div>
            <div className="text-[10px] text-rose-700">تعرفه‌های مخدوش یا بدون نام</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={decrementInvalidVote}
            disabled={election.invalidVotes <= 0}
            className="w-8 h-8 bg-white border border-rose-300 hover:bg-rose-100 disabled:opacity-30 rounded-lg flex items-center justify-center text-rose-800 font-bold text-sm cursor-pointer"
          >
            <Minus size={14} />
          </button>
          <span className="text-xl font-black text-rose-900 w-10 text-center tabular-nums">
            {election.invalidVotes}
          </span>
          <button
            type="button"
            onClick={incrementInvalidVote}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
          >
            +۱ باطله
          </button>
        </div>
      </div>

      {/* -------------------- OPERATOR: CANDIDATES MODE -------------------- */}
      {election.type === 'candidates' && (
        <div className="flex flex-col gap-5">
          
          {/* Top Row: Winners Count & Add Candidate */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-700 font-bold">تعداد نفرات منتخب:</label>
              <input
                type="number"
                min={1}
                value={election.winnersCount === 0 ? '' : election.winnersCount}
                placeholder="1"
                onChange={(e) => {
                  const rawVal = e.target.value.trim();
                  const val = rawVal === '' ? 1 : parseInt(rawVal, 10);
                  onUpdate(prev => ({ ...prev, winnersCount: isNaN(val) ? 1 : Math.max(1, val) }));
                }}
                className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center text-xs font-black text-slate-900"
              />
              <span className="text-[11px] text-slate-500">نفر منتخب نهایی</span>
            </div>

            {/* Quick Candidate Add Form with Photo Upload and Duplicate Prevention */}
            <form onSubmit={addCandidate} className="flex flex-col gap-1.5 flex-1 max-w-md">
              <div className="flex items-center gap-1.5">
                {/* Photo Picker */}
                <label 
                  className={`relative w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer shrink-0 transition-colors ${
                    newCandidatePhoto ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-500'
                  }`}
                  title="افزودن عکس پروفایل برای کاندیدا"
                >
                  {newCandidatePhoto ? (
                    <img 
                      src={newCandidatePhoto} 
                      alt="پیش‌نمایش" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Camera size={15} />
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleNewCandidatePhotoSelect} 
                    className="hidden" 
                  />
                </label>

                {newCandidatePhoto && (
                  <button
                    type="button"
                    onClick={() => setNewCandidatePhoto(null)}
                    className="text-rose-500 hover:text-rose-700 text-xs px-1"
                    title="حذف عکس انتخابی"
                  >
                    ✕
                  </button>
                )}

                <input
                  type="text"
                  placeholder="نام کاندیدای جدید (بدون تکرار)..."
                  value={newCandidateName}
                  onChange={(e) => {
                    setNewCandidateName(e.target.value);
                    if (candidateError) setCandidateError(null);
                  }}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />

                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>افزودن</span>
                </button>
              </div>

              {/* Duplicate Name Validation Error Alert */}
              {candidateError && (
                <div className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1 flex items-center gap-1.5 animate-fadeIn">
                  <AlertCircle size={13} className="shrink-0 text-rose-600" />
                  <span>{candidateError}</span>
                </div>
              )}
            </form>
          </div>

          {/* ------------------ FAST BALLOT RECORDER (ثبت برگه رأی / تعرفه) ------------------ */}
          <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Layers size={16} />
                </div>
                <div>
                  <div className="text-xs font-black text-indigo-950">ثبت برگه رأی (تعرفه جدید):</div>
                  <div className="text-[10px] text-indigo-700">
                    نام‌های نوشته شده روی این برگه را انتخاب کرده و دکمه ثبت را بزنید:
                  </div>
                </div>
              </div>

              <div className="text-xs font-bold text-indigo-800 bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200">
                انتخاب شده: {ballotSelectedIds.length} نفر
              </div>
            </div>

            {/* Candidate Selector Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {election.candidates.map((c) => {
                const isSelected = ballotSelectedIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleBallotCandidate(c.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                        : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                      isSelected ? 'bg-white text-indigo-700 font-black' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isSelected ? <Check size={12} strokeWidth={3} /> : null}
                    </div>
                    <span>{c.name}</span>
                  </button>
                );
              })}

              {election.candidates.length === 0 && (
                <div className="text-xs text-slate-500 py-2">
                  ابتدا نام کاندیداها را از فرم بالا اضافه کنید.
                </div>
              )}
            </div>

            {/* Action Buttons for Current Ballot */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-200">
              <button
                type="button"
                onClick={submitCurrentBallot}
                disabled={ballotSelectedIds.length === 0}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 active:scale-98 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Check size={16} />
                <span>ثبت این برگه رأی (+۱ به برگه‌ها و کاندیداهای منتخب)</span>
              </button>

              <button
                type="button"
                onClick={submitInvalidBallot}
                className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                title="ثبت به عنوان برگه باطله یا سفید (+۱ به باطله و برگه‌ها)"
              >
                <XCircle size={14} />
                <span>برگه باطله / سفید</span>
              </button>

              {ballotSelectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setBallotSelectedIds([])}
                  className="px-2.5 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                >
                  پاک کردن انتخاب‌ها
                </button>
              )}
            </div>
          </div>

          {/* ------------------ CANDIDATE DIRECT LIST & FAST COUNTER ------------------ */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <span>لیست کاندیداها ({election.candidates.length} نفر):</span>
                {election.candidates.length > 0 && (
                  showClearCandidatesConfirm ? (
                    <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-lg">
                      <span className="text-rose-900 text-[11px] font-bold">حذف همه؟</span>
                      <button
                        type="button"
                        onClick={clearAllCandidates}
                        className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer"
                      >
                        بله
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClearCandidatesConfirm(false)}
                        className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                      >
                        خیر
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowClearCandidatesConfirm(true)}
                      className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-0.5 cursor-pointer"
                      title="حذف کل کاندیداها برای ثبت لیست جدید"
                    >
                      <Trash2 size={11} />
                      <span>حذف همه کاندیداها</span>
                    </button>
                  )
                )}
              </div>
              <button
                type="button"
                onClick={syncBallotsToVotes}
                className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 cursor-pointer"
                title="تراز کردن تعداد برگه‌ها با بیشترین رأی کاندیدا + باطله"
              >
                <RefreshCw size={12} />
                <span>همگام‌سازی برگه‌ها با آرا</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
              {election.candidates.map((c, idx) => {
                const percentageOfBallots = effectiveCounted > 0
                  ? ((c.votes / effectiveCounted) * 100).toFixed(1)
                  : '0.0';

                return (
                  <div 
                    key={c.id} 
                    className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2 hover:border-slate-300 shadow-xs transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>

                      {/* Candidate Photo / Avatar with upload option */}
                      <div className="relative group/avatar shrink-0">
                        <label 
                          className="cursor-pointer block relative"
                          title="کلیک برای بارگذاری یا تغییر عکس"
                        >
                          {c.photoUrl ? (
                            <img 
                              src={c.photoUrl} 
                              alt={c.name} 
                              className="w-8 h-8 rounded-full object-cover border border-slate-300 group-hover/avatar:ring-2 group-hover/avatar:ring-indigo-400 transition-all" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center group-hover/avatar:bg-indigo-50 group-hover/avatar:text-indigo-600 transition-colors">
                              <Camera size={14} />
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCandidatePhotoUpload(c.id, file);
                            }} 
                            className="hidden" 
                          />
                        </label>
                        {c.photoUrl && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCandidatePhoto(c.id)}
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[9px] opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer shadow-xs"
                            title="حذف عکس کاندیدا"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="truncate flex-1">
                        {editingCandidateNameId === c.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingCandidateNameValue}
                              onChange={(e) => setEditingCandidateNameValue(e.target.value)}
                              className="w-full bg-white border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-slate-900 font-bold"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditingCandidateName(c.id);
                                if (e.key === 'Escape') setEditingCandidateNameId(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => saveEditingCandidateName(c.id)}
                              className="px-1.5 py-0.5 bg-emerald-600 text-white text-[10px] rounded font-bold cursor-pointer shrink-0"
                            >
                              ذخیره
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCandidateNameId(null)}
                              className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded font-bold cursor-pointer shrink-0"
                            >
                              لغو
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 group">
                            <div className="text-sm font-bold text-slate-900 truncate">{c.name}</div>
                            <button
                              type="button"
                              onClick={() => startEditingCandidateName(c)}
                              className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity"
                              title="ویرایش نام کاندیدا"
                            >
                              <Edit2 size={11} />
                            </button>
                          </div>
                        )}
                        
                        {/* Vote count & percentage */}
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          {editingCandidateId === c.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                value={editingCandidateVotes}
                                onChange={(e) => setEditingCandidateVotes(e.target.value)}
                                className="w-16 bg-white border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-slate-900 text-center font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => saveEditingCandidate(c.id)}
                                className="px-1.5 py-0.5 bg-emerald-600 text-white text-[10px] rounded font-bold cursor-pointer"
                              >
                                ثبت
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditingCandidate(c)}
                              className="text-slate-900 font-bold hover:underline cursor-pointer"
                              title="کلیک برای ویرایش مستقیم رأی"
                            >
                              {c.votes} رأی
                            </button>
                          )}
                          <span className="text-slate-300">|</span>
                          <span className={theme.tagColor}>{percentageOfBallots}٪ تعرفه‌ها</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => decrementCandidateVote(c.id)}
                        disabled={c.votes <= 0}
                        className="w-7 h-7 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg flex items-center justify-center text-slate-700 font-bold border border-slate-200 cursor-pointer"
                        title="کاهش یک رأی"
                      >
                        <Minus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => incrementCandidateVote(c.id)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs rounded-lg shadow-xs transition-all cursor-pointer"
                        title="افزایش یک رأی برای این کاندیدا"
                      >
                        +۱ رأی
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCandidate(c.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="حذف کاندیدا"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- OPERATOR: CONFIDENCE VOTE MODE -------------------- */}
      {election.type === 'confidence' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              نام شخص یا موضوع مورد نظر برای رأی اعتماد:
            </label>
            <input
              type="text"
              value={election.confidence.candidateName}
              onChange={(e) => onUpdate(prev => ({
                ...prev,
                confidence: { ...prev.confidence, candidateName: e.target.value }
              }))}
              placeholder="مثال: دکتر علیرضا محمدی (پیشنهاد ریاست هیئت مدیره)"
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Big Yes / No Fast Voting Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* YES BUTTON */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <ThumbsUp size={18} />
                  <span>آرای موافق (آری)</span>
                </div>
                <div className="text-2xl font-black text-emerald-900 tabular-nums">
                  {election.confidence.yesVotes}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={decrementConfidenceYes}
                  disabled={election.confidence.yesVotes <= 0}
                  className="w-9 h-9 bg-white border border-emerald-300 hover:bg-emerald-100 disabled:opacity-30 rounded-xl flex items-center justify-center text-emerald-900 font-bold cursor-pointer"
                >
                  <Minus size={15} />
                </button>
                <button
                  type="button"
                  onClick={incrementConfidenceYes}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ThumbsUp size={16} />
                  <span>موافق (آری) ۱+</span>
                </button>
              </div>
            </div>

            {/* NO BUTTON */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <ThumbsDown size={18} />
                  <span>آرای مخالف (نه)</span>
                </div>
                <div className="text-2xl font-black text-rose-900 tabular-nums">
                  {election.confidence.noVotes}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={decrementConfidenceNo}
                  disabled={election.confidence.noVotes <= 0}
                  className="w-9 h-9 bg-white border border-rose-300 hover:bg-rose-100 disabled:opacity-30 rounded-xl flex items-center justify-center text-rose-900 font-bold cursor-pointer"
                >
                  <Minus size={15} />
                </button>
                <button
                  type="button"
                  onClick={incrementConfidenceNo}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black text-sm rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ThumbsDown size={16} />
                  <span>مخالف (نه) ۱+</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Actions for this Election */}
      <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
        {/* Zero Votes Button */}
        <div>
          {showResetConfirm ? (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 p-1.5 px-3 rounded-xl">
              <span className="text-xs text-rose-700 font-bold">آیا مطمئن هستید؟ تمام آرا و برگه‌ها صفر می‌شوند (کاندیداها باقی می‌مانند).</span>
              <button
                type="button"
                onClick={resetAllVotes}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                بله، صفر کن
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                انصراف
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-rose-600 transition-colors py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer font-semibold"
            >
              <RotateCcw size={13} />
              <span>صفر کردن آمار آرا و تعرفه‌ها</span>
            </button>
          )}
        </div>

        {/* Full Reset / Clear Everything */}
        <div>
          {showFullResetConfirm ? (
            <div className="flex items-center gap-2 bg-rose-100 border border-rose-400 p-1.5 px-3 rounded-xl">
              <span className="text-xs text-rose-900 font-bold">پاکسازی کامل کل عنوان، کاندیداها و آرا؟</span>
              <button
                type="button"
                onClick={fullResetElection}
                className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                بله، کاملاً پاک شود
              </button>
              <button
                type="button"
                onClick={() => setShowFullResetConfirm(false)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                انصراف
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowFullResetConfirm(true)}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 transition-colors py-1 px-2.5 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 cursor-pointer font-semibold"
              title="پاکسازی کامل عنوان، لیست کاندیداها و آرا برای شروع از اول"
            >
              <Trash2 size={13} />
              <span>پاکسازی کامل این انتخابات (شروع از نو)</span>
            </button>
          )}
        </div>
      </div>

      {/* Election Report and Official Minutes Modal */}
      <ElectionReportModal
        election={election}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

    </div>
  );
}
