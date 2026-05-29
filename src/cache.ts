/**
 * Global in-memory cache of URLs that have successfully decoded at least once
 * this session. Used to skip the fade-in animation on revisit so cached images
 * appear instantly. Intentionally a plain Map — no eviction, tiny footprint.
 */
const loaded = new Set<string>();

/** Mark a URL as decoded. */
export function markLoaded(src: string): void {
  loaded.add(src);
}

/** Whether a URL has already decoded this session. */
export function isLoaded(src: string): boolean {
  return loaded.has(src);
}

/** Clear the cache (mainly for tests). */
export function clearCache(): void {
  loaded.clear();
}
