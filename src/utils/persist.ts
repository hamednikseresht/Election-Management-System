import { MultiElectionData } from '../types';

export const STORAGE_KEY = 'multi_election_app_data_v2';
export const LEGACY_STORAGE_KEY = 'election_app_data_v1';
export const REV_KEY = 'multi_election_app_rev';

const DB_NAME = 'election-management-system';
const DB_VERSION = 1;
const STORE = 'kv';

export function isPersistStorageEventKey(key: string | null): boolean {
  return key === STORAGE_KEY || key === REV_KEY || key === LEGACY_STORAGE_KEY;
}

export function getDataRevision(data: MultiElectionData | null | undefined): number {
  return typeof data?.updatedAt === 'number' && data.updatedAt > 0 ? data.updatedAt : 0;
}

/** Stamp a newer revision so peers and IDB know this payload is authoritative. */
export function touchDataRevision(data: MultiElectionData, previous?: MultiElectionData): MultiElectionData {
  const prev = getDataRevision(previous ?? data);
  const next = Math.max(Date.now(), prev + 1);
  return { ...data, updatedAt: next };
}

function canUseIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

async function idbGet(key: string): Promise<unknown | undefined> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB get failed'));
    });
  } finally {
    db.close();
  }
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB put failed'));
      tx.objectStore(STORE).put(value, key);
    });
  } finally {
    db.close();
  }
}

export function loadPersistedStateSync(): unknown | null {
  try {
    const savedV2 = localStorage.getItem(STORAGE_KEY);
    if (savedV2) return JSON.parse(savedV2);
    const savedV1 = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (savedV1) return JSON.parse(savedV1);
  } catch {
    // ignore corrupted localStorage
  }
  return null;
}

export async function loadPersistedState(): Promise<unknown | null> {
  let fromIdb: unknown | null = null;
  if (canUseIndexedDb()) {
    try {
      const value = await idbGet(STORAGE_KEY);
      if (value != null) fromIdb = value;
    } catch {
      // fall through
    }
  }
  const fromLs = loadPersistedStateSync();
  if (fromIdb == null) return fromLs;
  if (fromLs == null) return fromIdb;

  // Prefer whichever copy has the newer revision (guards against quota / race).
  const idbRev =
    typeof fromIdb === 'object' && fromIdb && 'updatedAt' in fromIdb
      ? Number((fromIdb as { updatedAt?: number }).updatedAt) || 0
      : 0;
  const lsRev =
    typeof fromLs === 'object' && fromLs && 'updatedAt' in fromLs
      ? Number((fromLs as { updatedAt?: number }).updatedAt) || 0
      : 0;
  return idbRev >= lsRev ? fromIdb : fromLs;
}

function writeRevisionHint(rev: number): void {
  try {
    localStorage.setItem(REV_KEY, String(rev || Date.now()));
  } catch {
    // ignore
  }
}

let saveSeq = 0;
let saveChain: Promise<void> = Promise.resolve();

/**
 * Persist latest state. Concurrent calls are serialized; only the newest
 * revision is written so an older in-flight save cannot overwrite a newer one.
 */
export function savePersistedState(data: MultiElectionData): Promise<void> {
  const seq = ++saveSeq;
  const snapshot = data;
  const rev = getDataRevision(snapshot);

  saveChain = saveChain
    .then(async () => {
      if (seq !== saveSeq) return;

      if (canUseIndexedDb()) {
        try {
          await idbSet(STORAGE_KEY, snapshot);
        } catch {
          // still try localStorage
        }
      }

      if (seq !== saveSeq) return;

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // Quota exceeded — IDB may still hold the payload.
      }

      // Always bump REV so other tabs wake even when body write failed.
      writeRevisionHint(rev || Date.now());
    })
    .catch(() => {
      // keep chain alive
    });

  return saveChain;
}
