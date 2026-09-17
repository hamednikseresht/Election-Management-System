import { useState } from 'react';
import { MultiElectionData } from '../types';
import { SingleElectionDisplay, electionTheme1, electionTheme2 } from './SingleElectionDisplay';
import { RefreshCw, Check, AlertTriangle } from 'lucide-react';

interface DisplayTabProps {
  data: MultiElectionData;
  onRefreshData?: () => void;
  isProjector?: boolean;
}

export function DisplayTab({ 
  data, 
  onRefreshData,
  isProjector = false,
}: DisplayTabProps) {
  const isDual = data.displayMode === 'dual';
  const isSingle1 = data.displayMode === 'single-1';
  const isSingle2 = data.displayMode === 'single-2';
  const variant = isProjector ? 'hall' : 'preview';

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshNotice, setShowRefreshNotice] = useState(false);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (onRefreshData) {
      onRefreshData();
    }
    setShowRefreshNotice(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
    setTimeout(() => {
      setShowRefreshNotice(false);
    }, 2500);
  };

  return (
    <div className={`h-full overflow-y-auto p-4 sm:p-6 flex flex-col font-sans transition-colors ${
      isProjector ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      
      {!isProjector && (
        <div className="max-w-7xl mx-auto w-full mb-3 print:hidden flex items-center justify-end">
          <button
            type="button"
            id="display-refresh-button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 active:scale-95 transition-all shadow-xs cursor-pointer"
            title="همگام‌سازی فوری و دریافت آخرین تغییرات و آرای ثبت‌شده از پنل اپراتور"
          >
            <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isRefreshing ? 'در حال همگام‌سازی...' : 'همگام‌سازی اطلاعات'}</span>
            {showRefreshNotice && (
              <span className="flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-black border border-emerald-300">
                <Check size={13} />
                بروز شد
              </span>
            )}
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-start">
        {(!data.electionScope || data.electionScope === 'single') && (
          <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-start">
            <SingleElectionDisplay 
              election={data.election1} 
              theme={electionTheme1} 
              isHalfScreen={false} 
              isDualMode={false}
              variant={variant}
            />
          </div>
        )}

        {data.electionScope === 'dual' && (
          <>
            {isDual && (
              <div className="w-full flex-1">
                {!data.election1.active && !data.election2.active && (
                  <div className={`rounded-3xl p-12 text-center my-auto border shadow-md ${
                    isProjector ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <AlertTriangle size={48} className="mx-auto text-amber-500 mb-3" />
                    <h3 className={`text-xl font-bold mb-2 ${isProjector ? 'text-white' : 'text-slate-900'}`}>
                      هر دو انتخابات در وضعیت غیرفعال قرار دارند
                    </h3>
                    <p className={`text-sm ${isProjector ? 'text-slate-300' : 'text-slate-600'}`}>
                      برای نمایش نتایج در این صفحه، وارد پنل اپراتور شوید و وضعیت انتخابات مورد نظر را به «فعال» تغییر دهید.
                    </p>
                  </div>
                )}

                {(data.election1.active || data.election2.active) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <SingleElectionDisplay 
                      election={data.election1} 
                      theme={electionTheme1} 
                      isHalfScreen={true} 
                      isDualMode={true}
                      variant={variant}
                    />
                    <SingleElectionDisplay 
                      election={data.election2} 
                      theme={electionTheme2} 
                      isHalfScreen={true} 
                      isDualMode={true}
                      variant={variant}
                    />
                  </div>
                )}
              </div>
            )}

            {isSingle1 && (
              <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-start">
                <SingleElectionDisplay 
                  election={data.election1} 
                  theme={electionTheme1} 
                  isHalfScreen={false} 
                  isDualMode={true}
                  variant={variant}
                />
              </div>
            )}

            {isSingle2 && (
              <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-start">
                <SingleElectionDisplay 
                  election={data.election2} 
                  theme={electionTheme2} 
                  isHalfScreen={false} 
                  isDualMode={true}
                  variant={variant}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
