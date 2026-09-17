export type BallotShortcut =
  | { type: 'submit' }
  | { type: 'clear' }
  | { type: 'undo' }
  | { type: 'invalid' }
  | { type: 'toggle'; index: number };

export function readBallotShortcut(event: {
  key: string;
  code: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}): BallotShortcut | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;

  if (event.key === 'Enter') return { type: 'submit' };
  if (event.key === 'Escape') return { type: 'clear' };
  if (event.key === 'Backspace' || event.key === 'u' || event.key === 'U') return { type: 'undo' };
  if (event.key === 'i' || event.key === 'I' || event.key === '/' || event.key === 'ب') {
    return { type: 'invalid' };
  }

  const digit = event.code.startsWith('Digit')
    ? Number(event.code.slice(5))
    : Number(event.key);
  if (digit >= 1 && digit <= 9) return { type: 'toggle', index: digit - 1 };

  return null;
}
