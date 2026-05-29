import { describe, it, expect, afterEach, vi } from 'vitest';
import { isConstrainedConnection } from '../src/network';

function setConnection(value: unknown) {
  Object.defineProperty(navigator, 'connection', {
    value,
    configurable: true,
  });
}

describe('isConstrainedConnection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setConnection(undefined);
  });

  it('is false when the API is unavailable', () => {
    setConnection(undefined);
    expect(isConstrainedConnection()).toBe(false);
  });

  it('is true when Save-Data is on', () => {
    setConnection({ saveData: true, effectiveType: '4g' });
    expect(isConstrainedConnection()).toBe(true);
  });

  it('is true on 2G/3G', () => {
    setConnection({ saveData: false, effectiveType: '2g' });
    expect(isConstrainedConnection()).toBe(true);
    setConnection({ saveData: false, effectiveType: '3g' });
    expect(isConstrainedConnection()).toBe(true);
  });

  it('is false on 4g without Save-Data', () => {
    setConnection({ saveData: false, effectiveType: '4g' });
    expect(isConstrainedConnection()).toBe(false);
  });
});
