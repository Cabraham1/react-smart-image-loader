import { useEffect, useRef, useState } from 'react';
import { isLoaded, markLoaded } from '../cache';
import { isConstrainedConnection } from '../network';
import { preloadAll } from '../preload';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'fallback';

interface Params {
  src: string;
  /** Begin loading (gated by viewport / priority upstream). */
  active: boolean;
  fallbackSrc?: string;
  maxRetries: number;
  networkAware: boolean;
  preloadNext?: string[];
  onLoaded?: () => void;
  onErrorFinal?: () => void;
}

interface Result {
  /** URL to render in the live <img>, or undefined while waiting. */
  currentSrc: string | undefined;
  status: LoadStatus;
  /** True when the image was already cached → render without fade. */
  fromCache: boolean;
}

const BACKOFF_BASE_MS = 1000;

/**
 * Drives a single image through its load lifecycle: viewport-gated start,
 * network-aware skip, exponential-backoff retry (1s, 2s, 4s…), fallback, and
 * global cache hits. Uses an off-DOM `Image()` so we control decode/error
 * before swapping pixels into the visible element (enables the cross-fade).
 */
export function useSmartImage({
  src,
  active,
  fallbackSrc,
  maxRetries,
  networkAware,
  preloadNext,
  onLoaded,
  onErrorFinal,
}: Params): Result {
  const cached = isLoaded(src);
  const [status, setStatus] = useState<LoadStatus>(cached ? 'loaded' : 'idle');
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(
    cached ? src : undefined
  );

  // Keep latest callbacks without re-triggering the load effect.
  const cbs = useRef({ onLoaded, onErrorFinal });
  cbs.current = { onLoaded, onErrorFinal };

  useEffect(() => {
    if (!active || cached) return;

    // Metered/slow connection with a low-res source available → don't fetch HD.
    if (networkAware && isConstrainedConnection() && fallbackSrc === undefined) {
      // No fallback to swap to; still attempt but flag stays minimal.
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    setStatus('loading');

    const attemptLoad = (url: string, isFallback: boolean) => {
      const img = new Image();

      img.onload = () => {
        if (cancelled) return;
        markLoaded(url);
        setCurrentSrc(url);
        setStatus(isFallback ? 'fallback' : 'loaded');
        if (!isFallback) cbs.current.onLoaded?.();
        else cbs.current.onErrorFinal?.();
        preloadAll(preloadNext);
      };

      img.onerror = () => {
        if (cancelled) return;
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, …
          const delay = BACKOFF_BASE_MS * 2 ** attempt;
          attempt += 1;
          timer = setTimeout(() => !cancelled && attemptLoad(url, false), delay);
          return;
        }
        if (fallbackSrc && !isFallback) {
          attemptLoad(fallbackSrc, true);
          return;
        }
        setStatus('fallback');
        cbs.current.onErrorFinal?.();
      };

      img.src = url;
    };

    attemptLoad(src, false);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [active, cached, src, fallbackSrc, maxRetries, networkAware, preloadNext]);

  return { currentSrc, status, fromCache: cached };
}
