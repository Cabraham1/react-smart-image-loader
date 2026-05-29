export { SmartImage } from './SmartImage';
export type { SmartImageProps, PlaceholderKind } from './types';

// Power-user / advanced building blocks — tree-shaken away when unused.
export { useInView } from './hooks/useInView';
export { useSmartImage, type LoadStatus } from './hooks/useSmartImage';
export { usePredictivePreload } from './hooks/usePredictivePreload';
export { preloadImage, preloadAll } from './preload';
export { isConstrainedConnection } from './network';
export { isLoaded, markLoaded, clearCache } from './cache';
