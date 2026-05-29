import { describe, it, expect } from 'vitest';
import { decodeThumbHash } from '../src/thumbhash';

// Sample hash from evanw/thumbhash (portrait image).
const HASH = '1QcSHQRnh493V4dIh4eXh1h4kJUI';

describe('decodeThumbHash', () => {
  it('decodes a base64 hash to RGBA with consistent dimensions', () => {
    const { width, height, rgba } = decodeThumbHash(HASH);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    expect(rgba.length).toBe(width * height * 4);
  });

  it('accepts raw bytes equivalently', () => {
    const bin = atob(HASH);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const a = decodeThumbHash(HASH);
    const b = decodeThumbHash(bytes);
    expect(b.width).toBe(a.width);
    expect(Array.from(b.rgba.slice(0, 8))).toEqual(Array.from(a.rgba.slice(0, 8)));
  });
});
