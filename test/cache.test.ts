import { describe, it, expect, beforeEach } from 'vitest';
import { isLoaded, markLoaded, clearCache } from '../src/cache';

describe('cache', () => {
  beforeEach(() => clearCache());

  it('reports unknown URLs as not loaded', () => {
    expect(isLoaded('https://x/a.jpg')).toBe(false);
  });

  it('remembers marked URLs', () => {
    markLoaded('https://x/a.jpg');
    expect(isLoaded('https://x/a.jpg')).toBe(true);
    expect(isLoaded('https://x/b.jpg')).toBe(false);
  });

  it('clears', () => {
    markLoaded('https://x/a.jpg');
    clearCache();
    expect(isLoaded('https://x/a.jpg')).toBe(false);
  });
});
