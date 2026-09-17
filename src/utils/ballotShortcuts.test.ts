import { describe, expect, it } from 'vitest';
import { readBallotShortcut } from './ballotShortcuts';

function event(partial: Partial<{ key: string; code: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }>) {
  return {
    key: '',
    code: '',
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...partial,
  };
}

describe('readBallotShortcut', () => {
  it('maps counting keys', () => {
    expect(readBallotShortcut(event({ key: 'Enter' }))).toEqual({ type: 'submit' });
    expect(readBallotShortcut(event({ key: 'Escape' }))).toEqual({ type: 'clear' });
    expect(readBallotShortcut(event({ key: 'Backspace' }))).toEqual({ type: 'undo' });
    expect(readBallotShortcut(event({ key: '/' }))).toEqual({ type: 'invalid' });
    expect(readBallotShortcut(event({ key: '1', code: 'Digit1' }))).toEqual({ type: 'toggle', index: 0 });
    expect(readBallotShortcut(event({ key: '9', code: 'Digit9' }))).toEqual({ type: 'toggle', index: 8 });
  });

  it('ignores modified keys and unknown keys', () => {
    expect(readBallotShortcut(event({ key: 'Enter', ctrlKey: true }))).toBeNull();
    expect(readBallotShortcut(event({ key: 'a' }))).toBeNull();
  });
});
