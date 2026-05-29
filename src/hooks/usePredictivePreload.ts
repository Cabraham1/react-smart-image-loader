import { useEffect, useRef } from 'react';
import { preloadImage } from '../preload';

interface Options {
  /**
   * Element whose scroll drives the heuristic. Defaults to the window. Pass a
   * ref for a scrollable carousel/list container.
   */
  target?: React.RefObject<HTMLElement> | null;
  /** Minimum |velocity| in px/ms before we start preloading. Default `0.4`. */
  velocityThreshold?: number;
  /** How many URLs from the front of `urls` to warm per trigger. Default `2`. */
  count?: number;
  /** Disable the heuristic (e.g. on constrained connections). */
  disabled?: boolean;
}

/**
 * Smart preloading matrix: watches scroll velocity and, once the user is
 * scrolling faster than `velocityThreshold`, preloads the next `count` images
 * so they're already in cache by the time they enter the viewport.
 *
 * Each URL is preloaded at most once. Pairs well with hover triggers
 * (`preloadImage` / `preloadAll`) for pointer-driven UIs like carousels.
 */
export function usePredictivePreload(
  urls: string[],
  { target, velocityThreshold = 0.4, count = 2, disabled = false }: Options = {}
): void {
  const warmed = useRef(new Set<string>());

  useEffect(() => {
    if (disabled || urls.length === 0 || typeof window === 'undefined') return;

    const el: HTMLElement | Window = target?.current ?? window;
    const getScroll = () =>
      el === window ? window.scrollY : (el as HTMLElement).scrollTop;

    let lastY = getScroll();
    let lastT = performance.now();
    let frame = 0;

    const onScroll = () => {
      if (frame) return; // Coalesce to one read per animation frame.
      frame = requestAnimationFrame(() => {
        frame = 0;
        const now = performance.now();
        const y = getScroll();
        const dt = now - lastT;
        const velocity = dt > 0 ? Math.abs(y - lastY) / dt : 0;
        lastY = y;
        lastT = now;

        if (velocity < velocityThreshold) return;
        let warmedNow = 0;
        for (const url of urls) {
          if (warmedNow >= count) break;
          if (warmed.current.has(url)) continue;
          warmed.current.add(url);
          preloadImage(url);
          warmedNow++;
        }
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [urls, target, velocityThreshold, count, disabled]);
}
