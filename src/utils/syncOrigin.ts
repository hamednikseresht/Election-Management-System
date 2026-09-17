export function getAppOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

export function isTrustedMessage(event: MessageEvent): boolean {
  return event.origin === getAppOrigin();
}

export function postToWindow(target: Window, data: unknown): void {
  target.postMessage(data, getAppOrigin());
}
