import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// jsdom has no IntersectionObserver — mock one that reports "in view" on observe.
class MockIntersectionObserver {
  constructor(private cb: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.cb(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = '';
  thresholds = [];
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// jsdom's Image never fires load/error events — drive them from the assigned src.
// URLs containing "fail" reject; everything else resolves on the next microtask.
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = '';
  set src(value: string) {
    this._src = value;
    queueMicrotask(() => {
      if (/fail/.test(value)) this.onerror?.();
      else this.onload?.();
    });
  }
  get src() {
    return this._src;
  }
}
vi.stubGlobal('Image', MockImage);
