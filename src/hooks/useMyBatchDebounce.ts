import { useCallback, useEffect, useRef } from 'react';

/**
 * Wait $delay milliseconds after the first call, then invoke callback with the last value received during the delay window. Then reset.
 * Will always use the latest callback provided.
 * Usage (similar to useDebounceCallback): 
 * const myCall = useMyBatchDebounce(cb, 10000); myCall(value);
 */
export function useMyBatchDebounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number
) {
  const cbRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Args | null>(null);

  useEffect(() => { cbRef.current = callback; }, [callback]);

  // Emit the last value and reset timer
  const flush = useCallback(() => {
    if (timerRef.current == null) return;
    const args = lastArgsRef.current as Args;
    timerRef.current = null;
    lastArgsRef.current = null;
    cbRef.current(...args);
  }, []);

  // Start timer when receiving the first value
  const push = useCallback((...args: Args) => {
    lastArgsRef.current = args;
    if (timerRef.current == null) {
      timerRef.current = setTimeout(flush, delay);
    }
  }, [delay, flush]);

  // clean up on component unmount (don't force output)
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    lastArgsRef.current = null;
  }, []);

  return push;
}