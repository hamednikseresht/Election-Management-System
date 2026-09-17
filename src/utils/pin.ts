export const PIN_HASH_KEY = 'operator_pin_hash_v1';
export const PIN_SESSION_KEY = 'operator_pin_unlocked_v1';
const PIN_SALT = 'ems-operator-pin-v1';

export function isValidPinFormat(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function fallbackHash(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
    hash >>>= 0;
  }
  return `djb2:${hash.toString(16).padStart(8, '0')}`;
}

export async function hashPin(pin: string): Promise<string> {
  const payload = `${PIN_SALT}:${pin}`;
  if (globalThis.crypto?.subtle) {
    const encoded = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return `sha256:${bytesToHex(new Uint8Array(digest))}`;
  }
  return fallbackHash(payload);
}

export function getStoredPinHash(): string | null {
  try {
    return localStorage.getItem(PIN_HASH_KEY);
  } catch {
    return null;
  }
}

export function setStoredPinHash(hash: string): void {
  localStorage.setItem(PIN_HASH_KEY, hash);
}

export function clearStoredPinHash(): void {
  localStorage.removeItem(PIN_HASH_KEY);
}

export function isPinSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(PIN_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function setPinSessionUnlocked(unlocked: boolean): void {
  try {
    if (unlocked) {
      sessionStorage.setItem(PIN_SESSION_KEY, '1');
    } else {
      sessionStorage.removeItem(PIN_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  const hashed = await hashPin(pin);
  return hashed === storedHash;
}
