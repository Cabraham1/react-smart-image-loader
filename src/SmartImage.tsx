import { useCallback, useMemo, useRef, type CSSProperties } from 'react';
import type { SmartImageProps } from './types';
import { useInView } from './hooks/useInView';
import { useSmartImage } from './hooks/useSmartImage';
import { preloadAll } from './preload';

const FADE_MS = 350;

/** CSS keyframes for the shimmer placeholder, injected once on first render. */
const SHIMMER_BG =
  'linear-gradient(100deg, rgba(0,0,0,0.06) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.06) 70%)';

export function SmartImage(props: SmartImageProps) {
  const {
    src,
    aspectRatio,
    placeholder = 'blur',
    blurSource,
    priority = false,
    preloadNext,
    fallbackSrc,
    maxRetries = 3,
    networkAware = true,
    onLoaded,
    onErrorFinal,
    className,
    style,
    alt = '',
    ...imgRest
  } = props;

  // Priority images skip the observer entirely and load eagerly.
  const [ref, inView] = useInView<HTMLDivElement>({ skip: priority });

  const { currentSrc, status, fromCache } = useSmartImage({
    src,
    active: inView,
    fallbackSrc,
    maxRetries,
    networkAware,
    preloadNext,
    onLoaded,
    onErrorFinal,
  });

  const isReady = status === 'loaded' || status === 'fallback';

  // Manual hover trigger: warm the next images on pointer-enter, at most once.
  const hovered = useRef(false);
  const onMouseEnter = useCallback(() => {
    if (hovered.current || !preloadNext?.length) return;
    hovered.current = true;
    preloadAll(preloadNext);
  }, [preloadNext]);

  const wrapperStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    aspectRatio: String(aspectRatio),
    width: '100%',
    ...style,
  };

  // Placeholder layer (blur image / shimmer / solid) sits behind the real image.
  const placeholderStyle: CSSProperties = useMemo(() => {
    const base: CSSProperties = {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    };
    if (placeholder === 'blur' && blurSource) {
      return {
        ...base,
        backgroundImage: `url("${blurSource}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(20px)',
        transform: 'scale(1.1)',
      };
    }
    if (placeholder === 'shimmer') {
      return {
        ...base,
        backgroundColor: 'rgba(0,0,0,0.06)',
        backgroundImage: SHIMMER_BG,
        backgroundSize: '200% 100%',
        animation: 'react-smart-loader-shimmer 1.4s ease-in-out infinite',
      };
    }
    return base;
  }, [placeholder, blurSource]);

  // Cached images appear instantly (no fade); fresh loads cross-fade in.
  const imgStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: isReady ? 1 : 0,
    transform: isReady ? 'scale(1)' : 'scale(1.02)',
    transition: fromCache
      ? 'none'
      : `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
    willChange: 'opacity, transform',
  };

  const showPlaceholder = placeholder !== 'none' && !fromCache && !isReady;

  // Use the lowercase HTML attribute name so it works on both React 18 (which
  // warns on camelCase `fetchPriority`) and React 19, and only for priority
  // images — otherwise leave the browser default.
  const priorityAttrs = priority
    ? ({ fetchpriority: 'high' } as Record<string, string>)
    : undefined;

  return (
    <div ref={ref} className={className} style={wrapperStyle} onMouseEnter={onMouseEnter}>
      {showPlaceholder ? <div aria-hidden="true" style={placeholderStyle} /> : null}
      {currentSrc ? (
        <img
          {...imgRest}
          {...priorityAttrs}
          src={currentSrc}
          alt={alt}
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          style={imgStyle}
        />
      ) : null}
      {placeholder === 'shimmer' ? (
        <style>{`@keyframes react-smart-loader-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      ) : null}
    </div>
  );
}
