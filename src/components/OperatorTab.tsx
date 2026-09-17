import { useState, type Dispatch, type SetStateAction } from 'react';
import { MultiElectionData, SingleElection, DisplayMode, ElectionScope } from '../types';
import { SingleElectionOperator } from './SingleElectionOperator';
import { electionTheme1, electionTheme2 } from './SingleElectionDisplay';
import { 
  Vote, ShieldCheck, MonitorPlay, LayoutGrid, 
  Columns, Check
} from 'lucide-react';

interface OperatorTabProps {
  data: MultiElectionData;
  setData: Dispatch<SetStateAction<MultiElectionData>>;
}

export function OperatorTab({ data, setData }: OperatorTabProps) {
  const [operatorView, setOperatorView] = useState<'both' | 'election1' | 'election2'>('both');

  const isSingleScope = !data.electionScope || data.electionScope === 'single';

  const handleScopeChange = (scope: ElectionScope) => {
    setData(prev => ({
      ...prev,
      electionScope: scope,
      displayMode: scope === 'single' ? 'single-1' : (prev.displayMode === 'single-2' ? 'single-2' : 'dual'),
    }));
  };

  const updateElection1 = (updater: (prev: SingleElection) => SingleElection) => {
    setData(prev => ({
      ...prev,
      election1: updater(prev.election1)
    }));
  };

  const updateElection2 = (updater: (prev: SingleElection) => SingleElection) => {
    setData(prev => ({
      ...prev,
      election2: updater(prev.election2)
    }));
  };

  const setDisplayMode = (mode: DisplayMode) => {
    setData(prev => ({
      ...prev,
      displayMode: mode
    }));
  };

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-6 font-sans bg-slate-100 text-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col gap-5">
        
        {/* Step 1: Election Scope Selection (1 election vs 2 simultaneous elections) */}
        <div className="rounded-3xl p-5 shadow-sm border border-slate-200 bg-white text-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs">
                ۱
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  ساختار برگزاری انتخابات
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  ابتدا مشخص کنید انتخابات به صورت تکی است یا دو انتخابات همزمان برگزار می‌شود:
                </p>
              </div>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
              isSingleScope 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {isSingleScope ? 'حالت فعال: یک انتخابات' : 'حالت فعال: دو انتخابات همزمان'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {/* Single Election Option */}
            <button
              type="button"
              id="scope-single-button"
              onClick={() => handleScopeChange('single')}
              className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border text-right transition-all cursor-pointer ${
                isSingleScope
                  ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${
                isSingleScope ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                <Vote size={22} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-black text-slate-900 flex items-center justify-between">
                  <span>یک انتخابات (تک انتخابات)</span>
                  {isSingleScope && <Check size={18} className="text-indigo-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  فقط یک انتخابات را پیکربندی و شمارش کنید. محیط کاربری کاملاً خلوت و متمرکز خواهد بود.
                </p>
              </div>
            </button>

            {/* Dual Election Option */}
            <button
              type="button"
              id="scope-dual-button"
              onClick={() => handleScopeChange('dual')}
              className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border text-right transition-all cursor-pointer ${
                !isSingleScope
                  ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${
                !isSingleScope ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                <Columns size={22} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-black text-slate-900 flex items-center justify-between">
                  <span>دو انتخابات همزمان</span>
                  {!isSingleScope && <Check size={18} className="text-emerald-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  مدیریت دو انتخابات مستقل (انتخابات اول و دوم) همراه با کنترل خروجی نمایشگر (همزمان یا تفکیک‌شده).
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ----------------- CASE 1: DUAL ELECTIONS ACTIVE ----------------- */}
        {!isSingleScope && (
          <>
            {/* Top Control Strip: Display Output & Workspace Selector */}
            <div className="rounded-3xl p-4 shadow-sm border border-slate-200 bg-white text-slate-800 flex flex-wrap items-center justify-between gap-4">
              
              {/* Display Output Mode Controller (Sent directly to Projector/Display) */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <MonitorPlay size={16} className="text-indigo-600" />
                  <span>خروجی مانیتور سالن:</span>
                </div>

                <div className="flex p-1 rounded-xl border border-slate-200 bg-slate-100 text-xs">
                  <button
                    type="button"
                    id="display-mode-dual"
                    onClick={() => setDisplayMode('dual')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      data.displayMode === 'dual'
                        ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="نمایش همزمان هر دو انتخابات در صفحه نمایشگر نتایج"
                  >
                    <Columns size={14} />
                    <span>همزمان (دوگانه)</span>
                  </button>

                  <button
                    type="button"
                    id="display-mode-single-1"
                    onClick={() => setDisplayMode('single-1')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      data.displayMode === 'single-1'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="فقط نمایش انتخابات اول در صفحه نمایشگر"
                  >
                    <Vote size={14} className={data.displayMode === 'single-1' ? 'text-white' : 'text-indigo-600'} />
                    <span>فقط انتخابات اول</span>
                  </button>

                  <button
                    type="button"
                    id="display-mode-single-2"
                    onClick={() => setDisplayMode('single-2')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      data.displayMode === 'single-2'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="فقط نمایش انتخابات دوم در صفحه نمایشگر"
                  >
                    <ShieldCheck size={14} className={data.displayMode === 'single-2' ? 'text-white' : 'text-emerald-600'} />
                    <span>فقط انتخابات دوم</span>
                  </button>
                </div>
              </div>

              {/* Operator Working View */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-bold text-slate-500">محیط کار اپراتور:</span>
                
                <div className="flex p-1 rounded-xl border border-slate-200 bg-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => setOperatorView('both')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      operatorView === 'both'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid size={14} />
                    <span>هر دو انتخابات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOperatorView('election1')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      operatorView === 'election1'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>انتخابات اول</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOperatorView('election2')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      operatorView === 'election2'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>انتخابات دوم</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Workspace Panels for Dual Elections */}
            {operatorView === 'both' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <SingleElectionOperator
                  election={data.election1}
                  onUpdate={updateElection1}
                  theme={electionTheme1}
                  isDualMode={true}
                />
                <SingleElectionOperator
                  election={data.election2}
                  onUpdate={updateElection2}
                  theme={electionTheme2}
                  isDualMode={true}
                />
              </div>
            )}

            {operatorView === 'election1' && (
              <div className="max-w-5xl mx-auto w-full">
                <SingleElectionOperator
                  election={data.election1}
                  onUpdate={updateElection1}
                  theme={electionTheme1}
                  isDualMode={true}
                />
              </div>
            )}

            {operatorView === 'election2' && (
              <div className="max-w-5xl mx-auto w-full">
                <SingleElectionOperator
                  election={data.election2}
                  onUpdate={updateElection2}
                  theme={electionTheme2}
                  isDualMode={true}
                />
              </div>
            )}
          </>
        )}

        {/* ----------------- CASE 2: SINGLE ELECTION ACTIVE ----------------- */}
        {isSingleScope && (
          <div className="max-w-5xl mx-auto w-full">
            <SingleElectionOperator
              election={data.election1}
              onUpdate={updateElection1}
              theme={electionTheme1}
              isDualMode={false}
            />
          </div>
        )}

      </div>
    </div>
  );
}
