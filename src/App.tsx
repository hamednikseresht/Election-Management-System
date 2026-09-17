import { useEffect, useState, useRef, type ChangeEvent } from 'react';
import { MultiElectionData, SingleElection, DisplayMode, ElectionType, Candidate } from './types';
import { OperatorTab } from './components/OperatorTab';
import { DisplayTab } from './components/DisplayTab';
import { 
  Vote, MonitorPlay, Maximize2, Minimize2, 
  ExternalLink, Download, Upload,
  RefreshCw, Check
} from 'lucide-react';

const STORAGE_KEY = 'multi_election_app_data_v2';
const LEGACY_STORAGE_KEY = 'election_app_data_v1';
const SYNC_CHANNEL_NAME = 'multi_election_sync_channel';

export const defaultSingleElection1: SingleElection = {
  id: 'election1',
  title: 'انتخابات انجمن اخترشناسی شیراز 1405',
  type: 'candidates',
  totalVotes: 100,
  isTotalBallotsKnown: true,
  countedBallots: 45,
  invalidVotes: 2,
  winnersCount: 3,
  candidates: [
    { id: '1-1', name: 'دکتر علیرضا محمدی', votes: 34 },
    { id: '1-2', name: 'مهندس سارا احمدی', votes: 28 },
    { id: '1-3', name: 'دکتر رضا کریمی', votes: 19 },
    { id: '1-4', name: 'محمد حسینی', votes: 12 },
  ],
  confidence: {
    candidateName: 'دکتر علیرضا محمدی',
    yesVotes: 64,
    noVotes: 22,
  },
  active: true,
};

export const defaultSingleElection2: SingleElection = {
  id: 'election2',
  title: 'انتخابات دوم',
  type: 'candidates',
  totalVotes: 100,
  isTotalBallotsKnown: true,
  countedBallots: 55,
  invalidVotes: 1,
  winnersCount: 1,
  candidates: [
    { id: '2-1', name: 'مهندس فرشید ناصری', votes: 45 },
    { id: '2-2', name: 'خانم الهام رستمی', votes: 38 },
    { id: '2-3', name: 'حسین جلالی', votes: 16 },
  ],
  confidence: {
    candidateName: 'مهندس فرشید ناصری',
    yesVotes: 71,
    noVotes: 18,
  },
  active: true,
};

export const defaultMultiElectionData: MultiElectionData = {
  version: 2,
  electionScope: 'single',
  displayMode: 'single-1',
  election1: defaultSingleElection1,
  election2: defaultSingleElection2,
};

function normalizeSingleElection(raw: any, defaultElection: SingleElection): SingleElection {
  if (!raw || typeof raw !== 'object') return defaultElection;

  const rawType: ElectionType = raw.type === 'confidence' ? 'confidence' : 'candidates';
  const rawCandidates: Candidate[] = Array.isArray(raw.candidates) 
    ? raw.candidates.map((c: any, index: number) => ({
        id: String(c?.id || `c-${index}-${Date.now()}`),
        name: typeof c?.name === 'string' ? c.name : '',
        votes: typeof c?.votes === 'number' && !isNaN(c.votes) ? Math.max(0, c.votes) : 0,
        photoUrl: typeof c?.photoUrl === 'string' ? c.photoUrl : undefined,
      }))
    : defaultElection.candidates;

  const rawConfidence = raw.confidence && typeof raw.confidence === 'object' ? raw.confidence : {};

  return {
    id: defaultElection.id,
    // Preserve empty string if user cleared the title
    title: typeof raw.title === 'string' ? raw.title : defaultElection.title,
    type: rawType,
    totalVotes: typeof raw.totalVotes === 'number' && !isNaN(raw.totalVotes) ? Math.max(0, raw.totalVotes) : 0,
    isTotalBallotsKnown: typeof raw.isTotalBallotsKnown === 'boolean' ? raw.isTotalBallotsKnown : true,
    countedBallots: typeof raw.countedBallots === 'number' && !isNaN(raw.countedBallots) ? Math.max(0, raw.countedBallots) : 0,
    invalidVotes: typeof raw.invalidVotes === 'number' && !isNaN(raw.invalidVotes) ? Math.max(0, raw.invalidVotes) : 0,
    winnersCount: typeof raw.winnersCount === 'number' && !isNaN(raw.winnersCount) ? Math.max(1, raw.winnersCount) : defaultElection.winnersCount,
    candidates: rawCandidates,
    confidence: {
      candidateName: typeof rawConfidence.candidateName === 'string' ? rawConfidence.candidateName : defaultElection.confidence.candidateName,
      yesVotes: typeof rawConfidence.yesVotes === 'number' && !isNaN(rawConfidence.yesVotes) ? Math.max(0, rawConfidence.yesVotes) : 0,
      noVotes: typeof rawConfidence.noVotes === 'number' && !isNaN(rawConfidence.noVotes) ? Math.max(0, rawConfidence.noVotes) : 0,
    },
    active: typeof raw.active === 'boolean' ? raw.active : true,
    concludedAt: typeof raw.concludedAt === 'string' ? raw.concludedAt : undefined,
  };
}

export function normalizeElectionData(raw: any): MultiElectionData {
  if (!raw || typeof raw !== 'object') return defaultMultiElectionData;

  // If already v2 MultiElectionData
  if (raw.version === 2 || (raw.election1 && raw.election2)) {
    const rawScope = raw.electionScope === 'dual' ? 'dual' : 'single';
    const displayMode: DisplayMode = ['dual', 'single-1', 'single-2'].includes(raw.displayMode)
      ? raw.displayMode
      : (rawScope === 'single' ? 'single-1' : 'dual');

    return {
      version: 2,
      electionScope: rawScope,
      displayMode,
      election1: normalizeSingleElection(raw.election1, defaultSingleElection1),
      election2: normalizeSingleElection(raw.election2, defaultSingleElection2),
    };
  }

  // If legacy v1 Single Election format
  return {
    version: 2,
    electionScope: 'single',
    displayMode: 'single-1',
    election1: normalizeSingleElection(raw, defaultSingleElection1),
    election2: defaultSingleElection2,
  };
}

// Generate stable client ID for this tab session to filter out echoes
const TAB_CLIENT_ID = typeof window !== 'undefined' 
  ? 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36)
  : 'server';

export default function App() {
  const isDisplayUrl = typeof window !== 'undefined' && window.location.search.includes('view=display');
  const [activeTab, setActiveTab] = useState<'operator' | 'display'>(isDisplayUrl ? 'display' : 'operator');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const popupWindowRef = useRef<Window | null>(null);

  // Flags to prevent ping-pong broadcast loops
  const isRemoteSyncRef = useRef<boolean>(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Notice state for manual refresh feedback
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Initialize data with normalization
  const [data, setData] = useState<MultiElectionData>(() => {
    try {
      const savedV2 = localStorage.getItem(STORAGE_KEY);
      if (savedV2) {
        return normalizeElectionData(JSON.parse(savedV2));
      }
      const savedV1 = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (savedV1) {
        return normalizeElectionData(JSON.parse(savedV1));
      }
    } catch {
      // ignore
    }
    return defaultMultiElectionData;
  });

  const dataRef = useRef(data);
  dataRef.current = data;

  // Broadcast sync payload cleanly without echoing back to self
  const broadcastSync = (payloadData?: MultiElectionData) => {
    const toSend = payloadData || dataRef.current;
    // 1. Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSend));
    } catch {
      // ignore
    }

    const message = {
      type: 'SYNC_DATA',
      payload: toSend,
      senderId: TAB_CLIENT_ID,
      timestamp: Date.now()
    };

    // 2. BroadcastChannel
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(message);
      } catch {
        // ignore
      }
    }

    // 3. Popup window
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      try {
        popupWindowRef.current.postMessage(message, '*');
      } catch {
        // ignore
      }
    }
  };

  // Broadcast whenever data changes LOCALLY (not triggered by incoming remote sync)
  useEffect(() => {
    if (isRemoteSyncRef.current) {
      // This state update was received from another window, do not bounce it back!
      isRemoteSyncRef.current = false;
      return;
    }
    broadcastSync(data);
  }, [data]);

  // Handle manual pull/refresh
  const refreshFromSource = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized = normalizeElectionData(parsed);
        isRemoteSyncRef.current = true;
        setData(normalized);
      }
    } catch {
      // ignore
    }

    // Request fresh data from any peer
    const reqMessage = { type: 'REQUEST_DATA', senderId: TAB_CLIENT_ID, timestamp: Date.now() };
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(reqMessage);
      } catch {}
    }

    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(reqMessage, '*');
      } catch {}
    }

    setSyncFeedback('اطلاعات با موفقیت همگام‌سازی شد');
    setTimeout(() => setSyncFeedback(null), 2500);
  };

  // Setup single persistent BroadcastChannel and event listeners
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        broadcastChannelRef.current = channel;

        channel.onmessage = (event) => {
          // Ignore messages from self!
          if (event.data?.senderId === TAB_CLIENT_ID) return;

          if (event.data?.type === 'SYNC_DATA' && event.data?.payload) {
            const incomingStr = JSON.stringify(event.data.payload);
            const currentStr = JSON.stringify(dataRef.current);
            if (incomingStr !== currentStr) {
              isRemoteSyncRef.current = true;
              setData(normalizeElectionData(event.data.payload));
            }
          } else if (event.data?.type === 'REQUEST_DATA') {
            // Another tab requested current state - send without marking remote
            if (channel) {
              channel.postMessage({
                type: 'SYNC_DATA',
                payload: dataRef.current,
                senderId: TAB_CLIENT_ID,
                timestamp: Date.now()
              });
            }
          }
        };
      } catch {
        // ignore
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const currentStr = JSON.stringify(dataRef.current);
          if (e.newValue !== currentStr) {
            isRemoteSyncRef.current = true;
            setData(normalizeElectionData(JSON.parse(e.newValue)));
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.senderId === TAB_CLIENT_ID) return;

      if (e.data?.type === 'SYNC_DATA' && e.data?.payload) {
        const incomingStr = JSON.stringify(e.data.payload);
        const currentStr = JSON.stringify(dataRef.current);
        if (incomingStr !== currentStr) {
          isRemoteSyncRef.current = true;
          setData(normalizeElectionData(e.data.payload));
        }
      } else if (e.data?.type === 'REQUEST_DATA') {
        if (e.source && 'postMessage' in e.source) {
          (e.source as Window).postMessage({
            type: 'SYNC_DATA',
            payload: dataRef.current,
            senderId: TAB_CLIENT_ID,
            timestamp: Date.now()
          }, '*');
        }
      }
    };
    window.addEventListener('message', handleMessage);

    // Initial announce from secondary display to request latest state
    if (isDisplayUrl) {
      if (channel) {
        channel.postMessage({ type: 'REQUEST_DATA', senderId: TAB_CLIENT_ID, timestamp: Date.now() });
      }
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({ type: 'REQUEST_DATA', senderId: TAB_CLIENT_ID, timestamp: Date.now() }, '*');
        } catch {}
      }
    }

    return () => {
      channel?.close();
      broadcastChannelRef.current = null;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const openDisplayWindow = () => {
    // Save state immediately before opening
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataRef.current));
    } catch {}

    const url = new URL(window.location.href);
    url.searchParams.set('view', 'display');
    url.searchParams.set('t', Date.now().toString());

    const popup = window.open(
      url.toString(), 
      'ElectionDisplayWindow', 
      'width=1366,height=768,menubar=no,toolbar=no,location=no,status=no'
    );
    popupWindowRef.current = popup;

    // Send multiple sync pulses as popup initializes
    const sendPulse = () => {
      if (popup && !popup.closed) {
        try {
          popup.postMessage({ 
            type: 'SYNC_DATA', 
            payload: dataRef.current,
            senderId: TAB_CLIENT_ID,
            timestamp: Date.now()
          }, '*');
        } catch {}
      }
    };

    setTimeout(sendPulse, 100);
    setTimeout(sendPulse, 400);
    setTimeout(sendPulse, 900);
    setTimeout(sendPulse, 1800);

    setSyncFeedback('مانیتور دوم باز شد و اطلاعات ارسال گردید');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const exportDataBackup = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `election-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importDataBackup = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          setData(normalizeElectionData(parsed));
        }
      } catch {
        alert('فایل انتخاب شده معتبر نمی‌باشد.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const setDisplayMode = (mode: DisplayMode) => {
    setData(prev => ({
      ...prev,
      displayMode: mode
    }));
  };

  // If this window is the Second Monitor / Projector URL (?view=display):
  // Show ONLY DisplayTab with the single sync button, NO operator controls!
  if (isDisplayUrl) {
    return (
      <div className="h-screen w-screen flex flex-col font-sans overflow-hidden select-none bg-slate-100 text-slate-900">
        {syncFeedback && (
          <div className="bg-emerald-600 text-white text-xs font-bold py-1 px-4 text-center flex items-center justify-center gap-1.5 shadow-md z-[60] animate-in fade-in duration-200">
            <Check size={14} />
            <span>{syncFeedback}</span>
          </div>
        )}
        <main className="flex-1 overflow-hidden relative">
          <DisplayTab 
            data={data} 
            onRefreshData={refreshFromSource}
          />
        </main>
      </div>
    );
  }

  // Operator Main Window
  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden select-none bg-slate-100 text-slate-900 transition-colors duration-200">
      {/* Sync Notification Banner */}
      {syncFeedback && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-1 px-4 text-center flex items-center justify-center gap-1.5 shadow-md z-[60] animate-in fade-in duration-200">
          <Check size={14} />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Main Top Header */}
      <header className="px-3 py-2 shrink-0 z-50 border-b border-slate-200 bg-white text-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-md text-white">
              <Vote size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black leading-none text-slate-900">
                سامانه جامع مدیریت انتخابات
              </h1>
              <span className="text-[11px] text-slate-500">
                مدیریت شمارش آرا و نمایشگر سالن
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Operator vs Display Preview) */}
          <div className="flex gap-1.5 p-1 rounded-xl border border-slate-200 bg-slate-100">
            <button
              id="operator-tab-button"
              onClick={() => setActiveTab('operator')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'operator' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Vote size={15} />
              <span>پنل اپراتور</span>
            </button>
            <button
              id="display-tab-button"
              onClick={() => setActiveTab('display')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'display' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MonitorPlay size={15} />
              <span>پیش‌نمایش سالن</span>
            </button>
          </div>

          {/* Secondary Monitor Launcher & Tools */}
          <div className="flex items-center flex-wrap gap-1.5">
            {/* Sync / Refresh Button */}
            <button
              type="button"
              id="main-sync-button"
              onClick={refreshFromSource}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer"
              title="همگام‌سازی فوری و ارسال آخرین اطلاعات به مانیتور دوم"
            >
              <RefreshCw size={13} />
              <span className="hidden md:inline">همگام‌سازی مانیتور</span>
            </button>

            {/* Secondary Monitor Popup */}
            <button
              type="button"
              id="open-second-monitor"
              onClick={openDisplayWindow}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg border border-sky-700 bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-xs cursor-pointer"
              title="باز کردن صفحه نمایشگر در پنجره جداگانه (برای ویدئو پروژکتور یا مانیتور دوم سالن)"
            >
              <ExternalLink size={14} />
              <span>مانیتور دوم / پروژکتور</span>
            </button>

            <button
              onClick={exportDataBackup}
              className="p-1.5 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="پشتیبان‌گیری از داده‌های هر دو انتخابات (Export JSON)"
            >
              <Download size={15} />
            </button>

            <label 
              className="p-1.5 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="بازیابی فایل پشتیبان (Import JSON)"
            >
              <Upload size={15} />
              <input 
                type="file" 
                accept=".json" 
                onChange={importDataBackup} 
                className="hidden" 
              />
            </label>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title={isFullscreen ? 'خروج از تمام‌صفحه (F11)' : 'تمام‌صفحه (F11)'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>

        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'operator' ? (
          <OperatorTab 
            data={data} 
            setData={setData} 
            onBroadcastSync={broadcastSync}
          />
        ) : (
          <DisplayTab 
            data={data} 
            onRefreshData={refreshFromSource}
          />
        )}
      </main>
    </div>
  );
}
