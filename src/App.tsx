import { useEffect, useState, useRef, useCallback, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import { MultiElectionData } from './types';
import { OperatorTab } from './components/OperatorTab';
import { DisplayTab } from './components/DisplayTab';
import { OperatorPinButton, OperatorPinGate } from './components/OperatorPinGate';
import { defaultMultiElectionData, normalizeElectionData } from './utils/normalize';
import { createId } from './utils/ids';
import { isTrustedMessage, postToWindow } from './utils/syncOrigin';
import {
  getDataRevision,
  isPersistStorageEventKey,
  loadPersistedState,
  loadPersistedStateSync,
  savePersistedState,
  touchDataRevision,
} from './utils/persist';
import { 
  Vote, MonitorPlay, Maximize2, Minimize2, 
  ExternalLink, Download, Upload,
  RefreshCw, Check
} from 'lucide-react';

export { defaultMultiElectionData, normalizeElectionData };

const SYNC_CHANNEL_NAME = 'multi_election_sync_channel';

const TAB_CLIENT_ID = typeof window !== 'undefined' ? createId('tab') : 'server';

type SyncMessage = {
  type: 'SYNC_DATA' | 'REQUEST_DATA';
  payload?: MultiElectionData;
  senderId: string;
  timestamp: number;
  revision?: number;
};

export default function App() {
  const isDisplayUrl = typeof window !== 'undefined' && window.location.search.includes('view=display');
  const [activeTab, setActiveTab] = useState<'operator' | 'display'>(isDisplayUrl ? 'display' : 'operator');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const popupWindowRef = useRef<Window | null>(null);

  // How many upcoming data-effect runs should skip broadcast (remote applies)
  const remoteSkipCountRef = useRef(0);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const [data, setData] = useState<MultiElectionData>(() => {
    const saved = loadPersistedStateSync();
    return saved != null ? normalizeElectionData(saved) : defaultMultiElectionData;
  });

  const dataRef = useRef(data);
  dataRef.current = data;

  /** Local edits always bump updatedAt so stale peers / IDB cannot win. */
  const commitLocalData: Dispatch<SetStateAction<MultiElectionData>> = useCallback((update) => {
    setData((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      return touchDataRevision(normalizeElectionData(next), prev);
    });
  }, []);

  const applyRemotePayload = useCallback((payload: unknown) => {
    const normalized = normalizeElectionData(payload);
    const remoteRev = getDataRevision(normalized);
    const localRev = getDataRevision(dataRef.current);
    if (remoteRev < localRev) return;
    if (JSON.stringify(normalized) === JSON.stringify(dataRef.current)) return;
    remoteSkipCountRef.current += 1;
    setData(normalized);
  }, []);

  const postSyncMessage = useCallback((message: SyncMessage) => {
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(message);
      } catch {
        // ignore
      }
    }
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      try {
        postToWindow(popupWindowRef.current, message);
      } catch {
        // ignore
      }
    }
  }, []);

  const broadcastSync = useCallback((payloadData?: MultiElectionData) => {
    const toSend = payloadData || dataRef.current;
    void savePersistedState(toSend);
    postSyncMessage({
      type: 'SYNC_DATA',
      payload: toSend,
      senderId: TAB_CLIENT_ID,
      timestamp: Date.now(),
      revision: getDataRevision(toSend),
    });
  }, [postSyncMessage]);

  const requestPeerData = useCallback(() => {
    const reqMessage: SyncMessage = {
      type: 'REQUEST_DATA',
      senderId: TAB_CLIENT_ID,
      timestamp: Date.now(),
    };
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(reqMessage);
      } catch {
        // ignore
      }
    }
    if (window.opener && !window.opener.closed) {
      try {
        postToWindow(window.opener, reqMessage);
      } catch {
        // ignore
      }
    }
  }, []);

  // Persist + broadcast local changes only
  useEffect(() => {
    if (remoteSkipCountRef.current > 0) {
      remoteSkipCountRef.current -= 1;
      return;
    }
    broadcastSync(data);
  }, [data, broadcastSync]);

  // Hydrate from IndexedDB without clobbering newer in-memory edits
  useEffect(() => {
    let cancelled = false;
    loadPersistedState().then(async (raw) => {
      if (cancelled || raw == null) return;
      const normalized = normalizeElectionData(raw);
      const storedRev = getDataRevision(normalized);
      const localRev = getDataRevision(dataRef.current);

      if (storedRev < localRev) {
        await savePersistedState(dataRef.current);
        broadcastSync(dataRef.current);
        return;
      }

      if (JSON.stringify(normalized) !== JSON.stringify(dataRef.current)) {
        applyRemotePayload(normalized);
        await savePersistedState(normalized);
      } else if (storedRev === 0) {
        const stamped = touchDataRevision(dataRef.current);
        remoteSkipCountRef.current += 1;
        setData(stamped);
        await savePersistedState(stamped);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [applyRemotePayload, broadcastSync]);

  const refreshFromSource = () => {
    void loadPersistedState().then((raw) => {
      if (raw != null) applyRemotePayload(raw);
    });
    requestPeerData();
    // Push our latest too so projector catches up even if it never asked
    broadcastSync(dataRef.current);

    setSyncFeedback('اطلاعات با موفقیت همگام‌سازی شد');
    setTimeout(() => setSyncFeedback(null), 2500);
  };

  // BroadcastChannel + storage + postMessage
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        broadcastChannelRef.current = channel;

        channel.onmessage = (event) => {
          if (event.data?.senderId === TAB_CLIENT_ID) return;

          if (event.data?.type === 'SYNC_DATA' && event.data?.payload) {
            applyRemotePayload(event.data.payload);
          } else if (event.data?.type === 'REQUEST_DATA') {
            channel?.postMessage({
              type: 'SYNC_DATA',
              payload: dataRef.current,
              senderId: TAB_CLIENT_ID,
              timestamp: Date.now(),
              revision: getDataRevision(dataRef.current),
            } satisfies SyncMessage);
          }
        };
      } catch {
        // ignore
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (!isPersistStorageEventKey(e.key)) return;
      void loadPersistedState().then((raw) => {
        if (raw != null) applyRemotePayload(raw);
      });
    };
    window.addEventListener('storage', handleStorageChange);

    const handleMessage = (e: MessageEvent) => {
      if (!isTrustedMessage(e)) return;
      if (e.data?.senderId === TAB_CLIENT_ID) return;

      if (e.data?.type === 'SYNC_DATA' && e.data?.payload) {
        applyRemotePayload(e.data.payload);
      } else if (e.data?.type === 'REQUEST_DATA') {
        if (e.source && 'postMessage' in e.source) {
          postToWindow(e.source as Window, {
            type: 'SYNC_DATA',
            payload: dataRef.current,
            senderId: TAB_CLIENT_ID,
            timestamp: Date.now(),
            revision: getDataRevision(dataRef.current),
          } satisfies SyncMessage);
        }
      }
    };
    window.addEventListener('message', handleMessage);

    const pullOnVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void loadPersistedState().then((raw) => {
        if (raw != null) applyRemotePayload(raw);
      });
      if (isDisplayUrl) requestPeerData();
      else broadcastSync(dataRef.current);
    };
    document.addEventListener('visibilitychange', pullOnVisible);
    window.addEventListener('focus', pullOnVisible);

    if (isDisplayUrl) {
      requestPeerData();
      // Retry shortly after open — opener may still be wiring the popup ref
      const t1 = window.setTimeout(requestPeerData, 250);
      const t2 = window.setTimeout(requestPeerData, 800);
      const t3 = window.setTimeout(requestPeerData, 1600);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
        channel?.close();
        broadcastChannelRef.current = null;
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('message', handleMessage);
        document.removeEventListener('visibilitychange', pullOnVisible);
        window.removeEventListener('focus', pullOnVisible);
      };
    }

    return () => {
      channel?.close();
      broadcastChannelRef.current = null;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('visibilitychange', pullOnVisible);
      window.removeEventListener('focus', pullOnVisible);
    };
  }, [applyRemotePayload, broadcastSync, isDisplayUrl, requestPeerData]);

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
    void savePersistedState(dataRef.current);

    const url = new URL(window.location.href);
    url.searchParams.set('view', 'display');
    url.searchParams.set('t', Date.now().toString());

    const popup = window.open(
      url.toString(), 
      'ElectionDisplayWindow', 
      'width=1366,height=768,menubar=no,toolbar=no,location=no,status=no'
    );
    popupWindowRef.current = popup;

    const sendPulse = () => {
      if (popup && !popup.closed) {
        try {
          postToWindow(popup, { 
            type: 'SYNC_DATA', 
            payload: dataRef.current,
            senderId: TAB_CLIENT_ID,
            timestamp: Date.now(),
            revision: getDataRevision(dataRef.current),
          } satisfies SyncMessage);
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
          if (!window.confirm('بازیابی این فایل، داده‌های فعلی هر دو انتخابات را جایگزین می‌کند. ادامه می‌دهید؟')) {
            return;
          }
          commitLocalData(normalizeElectionData(parsed));
        }
      } catch {
        alert('فایل انتخاب شده معتبر نمی‌باشد.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (isDisplayUrl) {
    return (
      <div className="h-screen w-screen flex flex-col font-sans overflow-hidden select-none bg-[var(--color-canvas)] text-[var(--color-ink)]">
        {syncFeedback && (
          <div className="bg-slate-800 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-1.5 z-[60]">
            <Check size={14} />
            <span>{syncFeedback}</span>
          </div>
        )}
        <main className="flex-1 overflow-hidden relative">
          <DisplayTab 
            data={data} 
            isProjector
          />
        </main>
      </div>
    );
  }

  return (
    <OperatorPinGate>
    <div className="h-screen flex flex-col font-sans overflow-hidden select-none bg-[var(--color-canvas)] text-[var(--color-ink)]">
      {syncFeedback && (
        <div className="bg-slate-800 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-1.5 z-[60]">
          <Check size={14} />
          <span>{syncFeedback}</span>
        </div>
      )}

      <header className="px-4 py-3 shrink-0 z-50 border-b border-[var(--color-line)] bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3">
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-brand)] flex items-center justify-center text-white shrink-0">
              <Vote size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-[var(--color-ink)] leading-tight truncate">
                سامانه مدیریت انتخابات
              </h1>
              <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                شمارش تعرفه · نمایش سالن · صورتجلسه
              </p>
            </div>
          </div>

          <div className="ems-segment" role="tablist" aria-label="نمای اصلی">
            <button
              type="button"
              id="operator-tab-button"
              role="tab"
              aria-selected={activeTab === 'operator'}
              data-active={activeTab === 'operator'}
              onClick={() => setActiveTab('operator')}
              className={activeTab === 'operator' ? 'is-active' : ''}
            >
              <span className="inline-flex items-center gap-1.5">
                <Vote size={14} />
                پنل اپراتور
              </span>
            </button>
            <button
              type="button"
              id="display-tab-button"
              role="tab"
              aria-selected={activeTab === 'display'}
              data-active={activeTab === 'display'}
              onClick={() => setActiveTab('display')}
              className={activeTab === 'display' ? 'is-active' : ''}
            >
              <span className="inline-flex items-center gap-1.5">
                <MonitorPlay size={14} />
                پیش‌نمایش سالن
              </span>
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <button
              type="button"
              id="main-sync-button"
              onClick={refreshFromSource}
              className="ems-btn ems-btn-ghost"
              title="همگام‌سازی فوری و ارسال آخرین اطلاعات به مانیتور دوم"
            >
              <RefreshCw size={13} />
              <span className="hidden md:inline">همگام‌سازی</span>
            </button>

            <button
              type="button"
              id="open-second-monitor"
              onClick={openDisplayWindow}
              className="ems-btn ems-btn-primary"
              title="باز کردن صفحه نمایشگر در پنجره جداگانه"
            >
              <ExternalLink size={14} />
              <span>مانیتور دوم</span>
            </button>

            <button
              type="button"
              onClick={exportDataBackup}
              className="ems-btn ems-btn-ghost !px-2"
              title="پشتیبان‌گیری JSON"
            >
              <Download size={15} />
            </button>

            <label 
              className="ems-btn ems-btn-ghost !px-2"
              title="بازیابی فایل پشتیبان"
            >
              <Upload size={15} />
              <input 
                type="file" 
                accept=".json" 
                onChange={importDataBackup} 
                className="hidden" 
              />
            </label>

            <OperatorPinButton />

            <button
              type="button"
              onClick={toggleFullscreen}
              className="ems-btn ems-btn-ghost !px-2"
              title={isFullscreen ? 'خروج از تمام‌صفحه (F11)' : 'تمام‌صفحه (F11)'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>

        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'operator' ? (
          <OperatorTab 
            data={data} 
            setData={commitLocalData} 
          />
        ) : (
          <DisplayTab 
            data={data} 
            onRefreshData={refreshFromSource}
          />
        )}
      </main>
    </div>
    </OperatorPinGate>
  );
}
