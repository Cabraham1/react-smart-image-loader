/**
 * Zero-dependency BlurHash decoder → data URL, for the `blurSource` prop.
 *
 * Ships only when imported from `react-smart-loader/blurhash`, keeping it out of the
 * base bundle. Algorithm per the BlurHash spec (woltapp/blurhash).
 *
 * @example
 * import { blurHashToDataURL } from 'react-smart-loader/blurhash';
 * const blur = blurHashToDataURL('LGF5?M9F00~q_MOffQWB00%MwbRj', 32, 32);
 * <SmartImage src={hd} aspectRatio={16/9} blurSource={blur} />
 */

const DIGIT =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~';

function decode83(str: string): number {
  let value = 0;
  for (const c of str) {
    const i = DIGIT.indexOf(c);
    if (i === -1) throw new Error(`react-smart-loader: invalid BlurHash character "${c}"`);
    value = value * 83 + i;
  }
  return value;
}

function sRGBToLinear(value: number): number {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function linearTosRGB(value: number): number {
  const v = Math.max(0, Math.min(1, value));
  return Math.round(
    (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055) * 255
  );
}

function signPow(value: number, exp: number): number {
  return Math.sign(value) * Math.abs(value) ** exp;
}

function decodeDC(value: number): [number, number, number] {
  return [sRGBToLinear(value >> 16), sRGBToLinear((value >> 8) & 255), sRGBToLinear(value & 255)];
}

function decodeAC(value: number, maxValue: number): [number, number, number] {
  const r = Math.floor(value / (19 * 19));
  const g = Math.floor(value / 19) % 19;
  const b = value % 19;
  return [
    signPow((r - 9) / 9, 2) * maxValue,
    signPow((g - 9) / 9, 2) * maxValue,
    signPow((b - 9) / 9, 2) * maxValue,
  ];
}

/** Decode a BlurHash to raw RGBA pixels (Uint8ClampedArray, length w*h*4). */
export function decodeBlurHash(
  hash: string,
  width: number,
  height: number,
  punch = 1
): Uint8ClampedArray {
  if (hash.length < 6) throw new Error('react-smart-loader: BlurHash too short');

  const sizeFlag = decode83(hash[0]!);
  const numY = Math.floor(sizeFlag / 9) + 1;
  const numX = (sizeFlag % 9) + 1;
  const quantMax = decode83(hash[1]!);
  const maxValue = (quantMax + 1) / 166;

  const expected = 4 + 2 * numX * numY;
  if (hash.length !== expected) {
    throw new Error(`react-smart-loader: BlurHash length mismatch (expected ${expected})`);
  }

  const colors: [number, number, number][] = new Array(numX * numY);
  colors[0] = decodeDC(decode83(hash.slice(2, 6)));
  for (let i = 1; i < numX * numY; i++) {
    colors[i] = decodeAC(decode83(hash.slice(4 + i * 2, 6 + i * 2)), maxValue * punch);
  }

  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let j = 0; j < numY; j++) {
        for (let i = 0; i < numX; i++) {
          const basis =
            Math.cos((Math.PI * x * i) / width) * Math.cos((Math.PI * y * j) / height);
          const color = colors[i + j * numX]!;
          r += color[0] * basis;
          g += color[1] * basis;
          b += color[2] * basis;
        }
      }
      const idx = 4 * (x + y * width);
      pixels[idx] = linearTosRGB(r);
      pixels[idx + 1] = linearTosRGB(g);
      pixels[idx + 2] = linearTosRGB(b);
      pixels[idx + 3] = 255;
    }
  }
  return pixels;
}

/**
 * Decode a BlurHash to a PNG data URL via canvas, ready to drop into
 * `blurSource`. Keep `width`/`height` small (≈32px) — the result is blurred.
 * Returns an empty string in non-DOM (SSR) environments.
 */
export function blurHashToDataURL(
  hash: string,
  width = 32,
  height = 32,
  punch = 1
): string {
  if (typeof document === 'undefined') return '';
  const pixels = decodeBlurHash(hash, width, height, punch);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}
