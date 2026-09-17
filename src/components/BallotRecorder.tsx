import { useEffect, useRef, type KeyboardEvent } from 'react';
import { SingleElection } from '../types';
import { DisplayThemeConfig } from './SingleElectionDisplay';
import {
  getBallotLog,
  submitInvalidBallot,
  submitValidBallot,
  undoLastBallot,
  canRegisterBallot,
  getMaxMarksPerBallot,
} from '../utils/electionStats';
import { readBallotShortcut } from '../utils/ballotShortcuts';
import { Check, Layers, Undo2, XCircle } from 'lucide-react';

interface BallotRecorderProps {
  election: SingleElection;
  theme: DisplayThemeConfig;
  locked: boolean;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onUpdate: (updater: (prev: SingleElection) => SingleElection) => void;
}

export function BallotRecorder({
  election,
  theme,
  locked,
  selectedIds,
  onSelectedIdsChange,
  onUpdate,
}: BallotRecorderProps) {
  const log = getBallotLog(election);
  const last = log[log.length - 1];
  const atCeiling = !canRegisterBallot(election) && !locked;
  const maxMarks = getMaxMarksPerBallot(election);
  const atMarkLimit = selectedIds.length >= maxMarks;

  useEffect(() => {
    if (selectedIds.length > maxMarks) {
      onSelectedIdsChange(selectedIds.slice(0, maxMarks));
    }
  }, [maxMarks, selectedIds, onSelectedIdsChange]);

  const toggleCandidate = (id: string) => {
    if (locked) return;
    if (selectedIds.includes(id)) {
      onSelectedIdsChange(selectedIds.filter((cId) => cId !== id));
      return;
    }
    if (selectedIds.length >= maxMarks) return;
    onSelectedIdsChange([...selectedIds, id]);
  };

  const submitBallot = () => {
    if (locked || atCeiling || selectedIds.length === 0 || selectedIds.length > maxMarks) return;
    onUpdate((prev) => submitValidBallot(prev, selectedIds));
    onSelectedIdsChange([]);
  };

  const submitInvalid = () => {
    if (locked || atCeiling) return;
    onUpdate((prev) => submitInvalidBallot(prev));
    onSelectedIdsChange([]);
  };

  const undo = () => {
    if (locked || !last) return;
    onUpdate((prev) => undoLastBallot(prev));
  };

  const rootRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (locked) return;
    const action = readBallotShortcut(e);
    if (!action) return;
    e.preventDefault();

    if (action.type === 'submit') {
      if (atCeiling || selectedIds.length === 0 || selectedIds.length > maxMarks) return;
      onUpdate((prev) => submitValidBallot(prev, selectedIds));
      onSelectedIdsChange([]);
      return;
    }
    if (action.type === 'clear') {
      onSelectedIdsChange([]);
      return;
    }
    if (action.type === 'undo') {
      if (!last) return;
      onUpdate((prev) => undoLastBallot(prev));
      return;
    }
    if (action.type === 'invalid') {
      if (atCeiling) return;
      onUpdate((prev) => submitInvalidBallot(prev));
      onSelectedIdsChange([]);
      return;
    }
    const candidate = election.candidates[action.index];
    if (!candidate) return;
    if (selectedIds.includes(candidate.id)) {
      onSelectedIdsChange(selectedIds.filter((id) => id !== candidate.id));
      return;
    }
    if (selectedIds.length >= maxMarks) return;
    onSelectedIdsChange([...selectedIds, candidate.id]);
  };

  return (
    <div
      ref={rootRef}
      tabIndex={locked ? -1 : 0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => {
        if (locked) return;
        const active = document.activeElement as HTMLElement | null;
        const tag = active?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active?.isContentEditable) {
          return;
        }
        rootRef.current?.focus({ preventScroll: true });
      }}
      className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 outline-none shadow-sm focus-visible:ring-2 focus-visible:ring-sky-700/30"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
            <Layers size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">ثبت برگه رأی (تعرفه جدید):</div>
            <div className="text-[10px] text-slate-600">
              حداکثر {maxMarks.toLocaleString('fa-IR')} نام روی هر تعرفه (برابر تعداد نفرات منتخب). سپس ثبت را بزنید.
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              میانبر: ۱–۹ انتخاب، Enter ثبت، / باطله، Backspace بازگشت، Escape پاک
            </div>
            {atCeiling && (
              <div className="text-[10px] font-bold text-amber-800 mt-0.5">
                سقف کل تعرفه‌ها پر شده است. برگهٔ جدیدی نمی‌توان ثبت کرد.
              </div>
            )}
            {atMarkLimit && !atCeiling && (
              <div className="text-[10px] font-bold text-sky-800 mt-0.5">
                سقف انتخاب این تعرفه پر شد ({maxMarks.toLocaleString('fa-IR')} نفر). برای تغییر، یکی را بردارید.
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
              atMarkLimit
                ? 'text-sky-900 bg-sky-50 border-sky-200'
                : 'text-slate-800 bg-slate-100 border-slate-200'
            }`}
          >
            انتخاب شده: {selectedIds.length.toLocaleString('fa-IR')} از {maxMarks.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] font-bold text-slate-600">
            ثبت‌شده: {log.length.toLocaleString('fa-IR')} برگه
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {election.candidates.map((c) => {
          const isSelected = selectedIds.includes(c.id);
          const blocked = !isSelected && atMarkLimit;
          return (
            <button
              key={c.id}
              type="button"
              disabled={locked || blocked}
              onClick={() => toggleCandidate(c.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              title={blocked ? `حداکثر ${maxMarks} نام در هر تعرفه` : undefined}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                locked || blocked ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'
              } ${
                isSelected
                  ? 'bg-sky-700 text-white ring-1 ring-sky-800'
                  : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                  isSelected ? 'bg-white text-sky-800 font-bold' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isSelected ? <Check size={12} strokeWidth={3} /> : null}
              </div>
              <span>{c.name}</span>
            </button>
          );
        })}

        {election.candidates.length === 0 && (
          <div className="text-xs text-slate-500 py-2">ابتدا نام کاندیداها را از فرم بالا اضافه کنید.</div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200">
        <button
          type="button"
          onClick={submitBallot}
          disabled={locked || atCeiling || selectedIds.length === 0 || selectedIds.length > maxMarks}
          className="ems-btn ems-btn-success flex-1 !min-h-9"
        >
          <Check size={16} />
          <span>ثبت این برگه رأی</span>
        </button>

        <button
          type="button"
          onClick={submitInvalid}
          disabled={locked || atCeiling}
          className="ems-btn ems-btn-ghost !border-rose-300 !bg-rose-50 !text-rose-900 hover:!bg-rose-100"
        >
          <XCircle size={14} />
          <span>برگه باطله / سفید</span>
        </button>

        <button
          type="button"
          onClick={undo}
          disabled={locked || !last}
          className="ems-btn ems-btn-ghost"
          title={last ? 'بازگشت آخرین تعرفه ثبت‌شده' : 'تعرفه‌ای برای بازگشت نیست'}
        >
          <Undo2 size={14} className={theme.tagColor} />
          <span>بازگشت آخرین تعرفه</span>
        </button>

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectedIdsChange([])}
            disabled={locked}
            className="px-2.5 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
          >
            پاک کردن انتخاب‌ها
          </button>
        )}
      </div>
    </div>
  );
}
