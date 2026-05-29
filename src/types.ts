import type { ImgHTMLAttributes } from 'react';

export type PlaceholderKind = 'blur' | 'shimmer' | 'none';

/**
 * Props for {@link SmartImage}. Extends the native <img> attributes so you keep
 * `alt`, `className`, `style`, `aria-*`, `onClick`, etc. without losing types.
 *
 * Note: `loading`, `fetchPriority`, and `decoding` are managed internally based
 * on `priority`; pass them only if you intend to override the defaults.
 */
export interface SmartImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'placeholder'> {
  /** High-resolution source URL. */
  src: string;

  /**
   * Width / height ratio (e.g. `16 / 9`). Reserves layout space up front to
   * guarantee zero Cumulative Layout Shift while the image loads.
   */
  aspectRatio: number;

  /** Placeholder strategy shown until the high-res image decodes. */
  placeholder?: PlaceholderKind;

  /**
   * Source for the `blur` placeholder. Accepts a base64 data URL, a micro
   * thumbnail URL, or a BlurHash/ThumbHash string (decode via the
   * `@cabraham/react-smart-loader/blurhash` or `@cabraham/react-smart-loader/thumbhash` entry points).
   */
  blurSource?: string;

  /**
   * When true, bypasses lazy loading entirely: eager `loading`, high
   * `fetchPriority`, and (on React 19) a `<link rel="preload">` hint. Use for
   * above-the-fold / LCP images.
   */
  priority?: boolean;

  /** URLs to warm in the background once this image has loaded (e.g. carousel neighbours). */
  preloadNext?: string[];

  /** Fallback URL used after all retries are exhausted. */
  fallbackSrc?: string;

  /** Retry attempts before falling back. Default `3` (1s, 2s, 4s backoff). */
  maxRetries?: number;

  /**
   * Drop to `blurSource` / skip the high-res fetch when the connection is
   * metered (Save-Data) or slow (2G/3G). Default `true`.
   */
  networkAware?: boolean;

  /** Fires once the high-res image has decoded and faded in. */
  onLoaded?: () => void;

  /** Fires after retries are exhausted and the fallback (if any) is shown. */
  onErrorFinal?: () => void;
}
