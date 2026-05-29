import { describe, it, expect } from 'vitest';
import { decodeBlurHash } from '../src/blurhash';

const HASH = 'LGF5?M9F00~q_MOffQWB00%MwbRj';

describe('decodeBlurHash', () => {
  it('decodes to the requested RGBA dimensions', () => {
    const px = decodeBlurHash(HASH, 16, 16);
    expect(px).toBeInstanceOf(Uint8ClampedArray);
    expect(px.length).toBe(16 * 16 * 4);
  });

  it('produces opaque pixels', () => {
    const px = decodeBlurHash(HASH, 8, 8);
    for (let i = 3; i < px.length; i += 4) expect(px[i]).toBe(255);
  });

  it('rejects malformed hashes', () => {
    expect(() => decodeBlurHash('!!', 8, 8)).toThrow();
  });
});
