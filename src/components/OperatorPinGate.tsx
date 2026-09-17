import { createContext, useContext, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { KeyRound, Lock, ShieldCheck, Unlock } from 'lucide-react';
import {
  clearStoredPinHash,
  getStoredPinHash,
  hashPin,
  isPinSessionUnlocked,
  isValidPinFormat,
  setPinSessionUnlocked,
  setStoredPinHash,
  verifyPin,
} from '../utils/pin';

type PinDialog = 'setup' | 'change' | 'remove' | null;

interface PinContextValue {
  hasPin: boolean;
  lockNow: () => void;
  openSetup: () => void;
  openChange: () => void;
  openRemove: () => void;
}

const PinContext = createContext<PinContextValue | null>(null);

export function useOperatorPin(): PinContextValue {
  const ctx = useContext(PinContext);
  if (!ctx) {
    throw new Error('useOperatorPin must be used inside OperatorPinGate');
  }
  return ctx;
}

export function OperatorPinButton() {
  const { hasPin, lockNow, openSetup, openChange, openRemove } = useOperatorPin();

  if (!hasPin) {
    return (
      <button
        type="button"
        onClick={openSetup}
        className="ems-btn ems-btn-ghost !px-2"
        title="تعیین PIN برای قفل پنل اپراتور"
      >
        <KeyRound size={15} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={lockNow}
        className="ems-btn ems-btn-ghost !px-2 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
        title="قفل کردن پنل اپراتور"
      >
        <Lock size={15} />
      </button>
      <button
        type="button"
        onClick={openChange}
        className="ems-btn ems-btn-ghost !px-2"
        title="تغییر PIN"
      >
        <KeyRound size={15} />
      </button>
      <button
        type="button"
        onClick={openRemove}
        className="ems-btn ems-btn-ghost !px-2"
        title="حذف PIN"
      >
        <Unlock size={15} />
      </button>
    </div>
  );
}

export function OperatorPinGate({ children }: { children: ReactNode }) {
  const [hasPin, setHasPin] = useState(() => Boolean(getStoredPinHash()));
  const [unlocked, setUnlocked] = useState(() => !getStoredPinHash() || isPinSessionUnlocked());
  const [dialog, setDialog] = useState<PinDialog>(null);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const resetForm = () => {
    setPin('');
    setPinConfirm('');
    setCurrentPin('');
    setError(null);
    setBusy(false);
  };

  const closeDialog = () => {
    setDialog(null);
    resetForm();
  };

  const lockNow = () => {
    setPinSessionUnlocked(false);
    setUnlocked(false);
    closeDialog();
  };

  const unlockWithPin = async (event: FormEvent) => {
    event.preventDefault();
    const stored = getStoredPinHash();
    if (!stored) {
      setUnlocked(true);
      return;
    }
    if (!isValidPinFormat(pin)) {
      setError('PIN باید ۴ تا ۸ رقم باشد.');
      return;
    }
    setBusy(true);
    const ok = await verifyPin(pin, stored);
    setBusy(false);
    if (!ok) {
      setError('PIN نادرست است.');
      return;
    }
    setPinSessionUnlocked(true);
    setUnlocked(true);
    resetForm();
  };

  const saveNewPin = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValidPinFormat(pin)) {
      setError('PIN باید ۴ تا ۸ رقم باشد.');
      return;
    }
    if (pin !== pinConfirm) {
      setError('تکرار PIN یکسان نیست.');
      return;
    }
    if (dialog === 'change') {
      const stored = getStoredPinHash();
      if (!stored) {
        setError('PIN قبلی پیدا نشد.');
        return;
      }
      setBusy(true);
      const ok = await verifyPin(currentPin, stored);
      setBusy(false);
      if (!ok) {
        setError('PIN فعلی نادرست است.');
        return;
      }
    }
    setBusy(true);
    const hashed = await hashPin(pin);
    setStoredPinHash(hashed);
    setPinSessionUnlocked(true);
    setHasPin(true);
    setUnlocked(true);
    setBusy(false);
    closeDialog();
  };

  const removePin = async (event: FormEvent) => {
    event.preventDefault();
    const stored = getStoredPinHash();
    if (!stored) {
      closeDialog();
      return;
    }
    if (!isValidPinFormat(currentPin)) {
      setError('PIN باید ۴ تا ۸ رقم باشد.');
      return;
    }
    setBusy(true);
    const ok = await verifyPin(currentPin, stored);
    setBusy(false);
    if (!ok) {
      setError('PIN نادرست است.');
      return;
    }
    clearStoredPinHash();
    setPinSessionUnlocked(true);
    setHasPin(false);
    setUnlocked(true);
    closeDialog();
  };

  const value = useMemo<PinContextValue>(
    () => ({
      hasPin,
      lockNow,
      openSetup: () => {
        resetForm();
        setDialog('setup');
      },
      openChange: () => {
        resetForm();
        setDialog('change');
      },
      openRemove: () => {
        resetForm();
        setDialog('remove');
      },
    }),
    [hasPin],
  );

  return (
    <PinContext.Provider value={value}>
      {hasPin && !unlocked ? (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-100 p-4">
          <form
            onSubmit={unlockWithPin}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">پنل اپراتور قفل است</h2>
                <p className="text-xs text-slate-500">برای ادامه PIN را وارد کنید. نمایشگر سالن قفل ندارد.</p>
              </div>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-600">PIN اپراتور</span>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 8));
                  setError(null);
                }}
                className="ems-input tracking-[0.3em] text-center"
              />
            </label>
            {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
            <button type="submit" disabled={busy} className="ems-btn ems-btn-primary w-full !min-h-10">
              باز کردن قفل
            </button>
          </form>
        </div>
      ) : (
        children
      )}

      {dialog && unlocked && (
        <div className="fixed inset-0 z-[80] bg-slate-900/40 flex items-center justify-center p-4">
          <form
            onSubmit={dialog === 'remove' ? removePin : saveNewPin}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-lg p-6 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-sky-700" />
              <h3 className="text-sm font-bold text-slate-900">
                {dialog === 'setup' && 'تعیین PIN اپراتور'}
                {dialog === 'change' && 'تغییر PIN'}
                {dialog === 'remove' && 'حذف PIN'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-5">
              PIN فقط همین رایانه را قفل می‌کند و جایگزین پشتیبان JSON نیست. نمایشگر پروژکتور بدون PIN باز می‌ماند.
            </p>

            {(dialog === 'change' || dialog === 'remove') && (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-600">PIN فعلی</span>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={currentPin}
                  onChange={(e) => {
                    setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 8));
                    setError(null);
                  }}
                  className="ems-input text-center tracking-[0.3em]"
                />
              </label>
            )}

            {dialog !== 'remove' && (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-600">PIN جدید (۴ تا ۸ رقم)</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, '').slice(0, 8));
                      setError(null);
                    }}
                    className="ems-input text-center tracking-[0.3em]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-600">تکرار PIN</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={pinConfirm}
                    onChange={(e) => {
                      setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 8));
                      setError(null);
                    }}
                    className="ems-input text-center tracking-[0.3em]"
                  />
                </label>
              </>
            )}

            {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

            <div className="flex items-center gap-2 pt-1">
              <button type="submit" disabled={busy} className="ems-btn ems-btn-primary flex-1">
                {dialog === 'remove' ? 'حذف PIN' : 'ذخیره'}
              </button>
              <button type="button" onClick={closeDialog} className="ems-btn ems-btn-ghost">
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}
    </PinContext.Provider>
  );
}
