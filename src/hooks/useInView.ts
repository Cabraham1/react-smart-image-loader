import { useEffect, useRef, useState } from 'react';

interface Options {
  /** Skip observation and report in-view immediately (e.g. priority images). */
  skip?: boolean;
  /** Start loading this far before the element enters the viewport. */
  rootMargin?: string;
}

/**
 * Reports whether an element has entered the viewport, using IntersectionObserver
 * as a robust fallback for layouts where native `loading="lazy"` is unreliable
 * (carousels, transformed containers, older browsers).
 *
 * Once in view it stops observing — loading only needs to trigger once.
 */
export function useInView<T extends Element>(
  options: Options = {}
): [React.RefObject<T>, boolean] {
  const { skip = false, rootMargin = '200px' } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(skip);

  useEffect(() => {
    if (skip || inView) return;
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver (old browser / SSR hydration edge) → load eagerly.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [skip, inView, rootMargin]);

  return [ref, inView];
}
