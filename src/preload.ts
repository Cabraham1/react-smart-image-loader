import * as ReactDOM from 'react-dom';

/**
 * Warm an image in the browser cache without rendering it.
 *
 * Prefers React 19's `ReactDOM.preload` resource API when present (it
 * deduplicates and integrates with the renderer), and falls back to a plain
 * `new Image()` fetch on React 18 and older.
 */
export function preloadImage(src: string): void {
  if (!src || typeof window === 'undefined') return;

  const dom = ReactDOM as Partial<{
    preload: (href: string, options: { as: string }) => void;
  }>;

  if (typeof dom.preload === 'function') {
    dom.preload(src, { as: 'image' });
    return;
  }

  const img = new Image();
  img.src = src;
}

/** Preload a list of URLs (e.g. the next 1–2 carousel images). */
export function preloadAll(srcs: string[] | undefined): void {
  if (!srcs) return;
  for (const s of srcs) preloadImage(s);
}
