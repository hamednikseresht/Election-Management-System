import { SingleElection } from '../types';
import { DisplayThemeConfig } from './SingleElectionDisplay';
import {
  getBallotLog,
  submitInvalidBallot,
  submitValidBallot,
  undoLastBallot,
} from '../utils/electionStats';
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

  const toggleCandidate = (id: string) => {
    if (locked) return;
    onSelectedIdsChange(
      selectedIds.includes(id) ? selectedIds.filter((cId) => cId !== id) : [...selectedIds, id],
    );
  };

  const submitBallot = () => {
    if (locked || selectedIds.length === 0) return;
    onUpdate((prev) => submitValidBallot(prev, selectedIds));
    onSelectedIdsChange([]);
  };

  const submitInvalid = () => {
    if (locked) return;
    onUpdate((prev) => submitInvalidBallot(prev));
    onSelectedIdsChange([]);
  };

  const undo = () => {
    if (locked || !last) return;
    onUpdate((prev) => undoLastBallot(prev));
  };

  return (
    <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Layers size={16} />
          </div>
          <div>
            <div className="text-xs font-black text-indigo-950">ثبت برگه رأی (تعرفه جدید):</div>
            <div className="text-[10px] text-indigo-700">
              نام‌های نوشته‌شده روی این برگه را انتخاب کنید و ثبت را بزنید. آخرین تعرفه قابل بازگشت است.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-indigo-800 bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200">
            انتخاب شده: {selectedIds.length} نفر
          </div>
          <div className="text-[11px] font-bold text-slate-600">
            ثبت‌شده: {log.length.toLocaleString('fa-IR')} برگه
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {election.candidates.map((c) => {
          const isSelected = selectedIds.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              disabled={locked}
              onClick={() => toggleCandidate(c.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                  : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                  isSelected ? 'bg-white text-indigo-700 font-black' : 'bg-slate-100 text-slate-400'
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

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-200">
        <button
          type="button"
          onClick={submitBallot}
          disabled={locked || selectedIds.length === 0}
          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Check size={16} />
          <span>ثبت این برگه رأی</span>
        </button>

        <button
          type="button"
          onClick={submitInvalid}
          disabled={locked}
          className="px-3 py-2 bg-rose-100 hover:bg-rose-200 disabled:opacity-40 text-rose-900 border border-rose-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-all shrink-0 cursor-pointer"
        >
          <XCircle size={14} />
          <span>برگه باطله / سفید</span>
        </button>

        <button
          type="button"
          onClick={undo}
          disabled={locked || !last}
          className="px-3 py-2 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
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
