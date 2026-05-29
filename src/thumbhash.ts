/**
 * ThumbHash decoder entry point (`@cabraham/react-smart-loader/thumbhash`).
 *
 * ThumbHash (evanw/thumbhash, MIT) produces smaller, higher-fidelity
 * placeholders than BlurHash and encodes the average colour plus optional
 * alpha. The decode is a chunk of DCT math, so it lives in its own entry to
 * stay out of the base bundle.
 *
 * Decode routine ported from evanw/thumbhash (https://github.com/evanw/thumbhash),
 * MIT License, Copyright (c) 2023 Evan Wallace.
 *
 * @example
 * import { thumbHashToDataURL } from '@cabraham/react-smart-loader/thumbhash';
 * const blur = thumbHashToDataURL('1QcSHQRnh493V4dIh4eXh1h4kJUI'); // base64
 * <SmartImage src={hd} aspectRatio={4/3} blurSource={blur} />
 */

/** Convert a base64 ThumbHash string to bytes (works in browser and Node). */
function toBytes(hash: string | Uint8Array): Uint8Array {
  if (typeof hash !== 'string') return hash;
  const decode =
    typeof atob === 'function'
      ? atob
      : // Node fallback without pulling in @types/node.
        (s: string) =>
          (globalThis as { Buffer?: { from(d: string, e: string): Uint8Array } })
            .Buffer!.from(s, 'base64')
            .reduce((acc, b) => acc + String.fromCharCode(b), '');
  const bin = decode(hash);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Decode a ThumbHash (base64 string or bytes) to raw RGBA pixels. */
export function decodeThumbHash(hash: string | Uint8Array): {
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
} {
  const bytes = toBytes(hash);
  const { PI, min, max, cos, round } = Math;

  // Read the constants.
  const header24 = bytes[0]! | (bytes[1]! << 8) | (bytes[2]! << 16);
  const header16 = bytes[3]! | (bytes[4]! << 8);
  const lDc = (header24 & 63) / 63;
  const pDc = ((header24 >> 6) & 63) / 31.5 - 1;
  const qDc = ((header24 >> 12) & 63) / 31.5 - 1;
  const lScale = ((header24 >> 18) & 31) / 31;
  const hasAlpha = header24 >> 23;
  const pScale = ((header16 >> 3) & 63) / 63;
  const qScale = ((header16 >> 9) & 63) / 63;
  const isLandscape = header16 >> 15;
  const lx = max(3, isLandscape ? (hasAlpha ? 5 : 7) : 3);
  const ly = max(3, isLandscape ? 3 : hasAlpha ? 5 : 7);
  const aDc = hasAlpha ? (bytes[5]! & 15) / 15 : 1;
  const aScale = (bytes[5]! >> 4) / 15;

  // Read the varying factors (boost saturation by 1.25x to compensate for quantization).
  const acStart = hasAlpha ? 6 : 5;
  let acIndex = 0;
  const decodeChannel = (nx: number, ny: number, scale: number): number[] => {
    const ac: number[] = [];
    for (let cy = 0; cy < ny; cy++) {
      for (let cx = cy ? 0 : 1; cx * ny < nx * (ny - cy); cx++) {
        const byte = bytes[acStart + (acIndex >> 1)]!;
        ac.push((((byte >> ((acIndex++ & 1) << 2)) & 15) / 7.5 - 1) * scale);
      }
    }
    return ac;
  };
  const lAc = decodeChannel(lx, ly, lScale);
  const pAc = decodeChannel(3, 3, pScale * 1.25);
  const qAc = decodeChannel(3, 3, qScale * 1.25);
  const aAc = hasAlpha ? decodeChannel(5, 5, aScale) : [];

  // Decode using the DCT into RGB.
  const ratio = lx / ly;
  const width = round(ratio > 1 ? 32 : 32 * ratio);
  const height = round(ratio > 1 ? 32 / ratio : 32);
  const rgba = new Uint8ClampedArray(width * height * 4);
  const fx: number[] = [];
  const fy: number[] = [];

  for (let y = 0, i = 0; y < height; y++) {
    for (let x = 0; x < width; x++, i += 4) {
      let l = lDc;
      let p = pDc;
      let q = qDc;
      let a = aDc;

      // Precompute the coefficients.
      for (let cx = 0, n = max(lx, hasAlpha ? 5 : 3); cx < n; cx++) {
        fx[cx] = cos((PI / width) * (x + 0.5) * cx);
      }
      for (let cy = 0, n = max(ly, hasAlpha ? 5 : 3); cy < n; cy++) {
        fy[cy] = cos((PI / height) * (y + 0.5) * cy);
      }

      // Decode L.
      for (let cy = 0, j = 0; cy < ly; cy++) {
        for (
          let cx = cy ? 0 : 1, fy2 = fy[cy]! * 2;
          cx * ly < lx * (ly - cy);
          cx++, j++
        ) {
          l += lAc[j]! * fx[cx]! * fy2;
        }
      }

      // Decode P and Q.
      for (let cy = 0, j = 0; cy < 3; cy++) {
        for (let cx = cy ? 0 : 1, fy2 = fy[cy]! * 2; cx < 3 - cy; cx++, j++) {
          const f = fx[cx]! * fy2;
          p += pAc[j]! * f;
          q += qAc[j]! * f;
        }
      }

      // Decode the alpha.
      if (hasAlpha) {
        for (let cy = 0, j = 0; cy < 5; cy++) {
          for (let cx = cy ? 0 : 1, fy2 = fy[cy]! * 2; cx < 5 - cy; cx++, j++) {
            a += aAc[j]! * fx[cx]! * fy2;
          }
        }
      }

      // Convert to RGB.
      const b = l - (2 / 3) * p;
      const r = (3 * l - b + q) / 2;
      const g = r - q;
      rgba[i] = max(0, 255 * min(1, r));
      rgba[i + 1] = max(0, 255 * min(1, g));
      rgba[i + 2] = max(0, 255 * min(1, b));
      rgba[i + 3] = max(0, 255 * min(1, a));
    }
  }

  return { width, height, rgba };
}

/** Decode a ThumbHash to a PNG data URL via canvas (for `blurSource`). */
export function thumbHashToDataURL(hash: string | Uint8Array): string {
  if (typeof document === 'undefined') return '';
  const { width, height, rgba } = decodeThumbHash(hash);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(rgba);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}
