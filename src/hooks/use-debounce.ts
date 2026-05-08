export function useDebounce<T>(value: T, _delay?: number): T {
  if (_delay) {
    // delay is handled externally
  }
  return value;
}

export function useErrorCapture() {
  return { captureError: () => {} };
}
