# vivid-img

Smart, network-aware React image component in **< 2KB gzipped** with **zero dependencies**.

Lazy loading, blur / shimmer placeholders, exponential-backoff retry, zero-CLS
cross-fade transitions, and a global memory cache — all behind a single
`<SmartImage>` component that extends the native `<img>` API.

## Install

```bash
npm install vivid-img
```

`react` and `react-dom` (>= 18) are peer dependencies. React 19's resource
loading (`ReactDOM.preload`) is used automatically when available.

## Usage

```tsx
import { SmartImage } from 'vivid-img';

<SmartImage
  src="https://cdn.example.com/hd-product.jpg"
  aspectRatio={16 / 9}
  placeholder="blur"
  blurSource="data:image/png;base64,iVBOR..." // base64, micro-URL, or decoded hash
  priority={false}
  fallbackSrc="/images/fallback-placeholder.png"
  alt="Product photo"
/>
```

Because `SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement>`, every
native attribute (`alt`, `className`, `style`, `aria-*`, `onClick`, …) just works.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `src` | `string` | — | High-res source. |
| `aspectRatio` | `number` | — | e.g. `16 / 9`. Reserves space → zero CLS. |
| `placeholder` | `'blur' \| 'shimmer' \| 'none'` | `'blur'` | Shown until decode. |
| `blurSource` | `string` | — | base64 / micro-URL / decoded hash. |
| `priority` | `boolean` | `false` | Eager load + high `fetchPriority` (+ React 19 preload). |
| `preloadNext` | `string[]` | — | Warm neighbours after load (carousels). |
| `fallbackSrc` | `string` | — | Used after retries are exhausted. |
| `maxRetries` | `number` | `3` | Backoff: 1s, 2s, 4s. |
| `networkAware` | `boolean` | `true` | Degrade on Save-Data / 2G-3G. |
| `onLoaded` / `onErrorFinal` | `() => void` | — | Lifecycle callbacks. |

## Placeholders

The base component accepts any string in `blurSource`. To decode a compact hash
into a placeholder, import the matching **separate entry point** — this keeps the
decoder out of the base bundle unless you use it:

```ts
import { blurHashToDataURL } from 'vivid-img/blurhash';

const blur = blurHashToDataURL('LGF5?M9F00~q_MOffQWB00%MwbRj', 32, 32);
// → pass to <SmartImage blurSource={blur} />
```

### ThumbHash

`vivid-img/thumbhash` exposes the final API surface, but the decode body is not
yet implemented (see `src/thumbhash.ts`). It throws until a decode strategy is
chosen — use `vivid-img/blurhash` or a plain base64/micro-URL in the meantime.

## Predictive preloading

Beyond the `preloadNext` prop (warmed on hover), `usePredictivePreload` watches
scroll velocity and warms upcoming images before they enter the viewport:

```tsx
import { usePredictivePreload } from 'vivid-img';

const upcoming = items.map((i) => i.imageUrl);
usePredictivePreload(upcoming, { count: 2, velocityThreshold: 0.4 });
```

## Demo

A live demo lives in [`demo/`](demo/) and runs against the package source (no
build step — edit `src/*` and it hot-reloads):

```bash
cd demo
npm install
npm run dev   # http://localhost:5173
```

## Development

```bash
npm install
npm run build      # tsup → dist (ESM + CJS + .d.ts)
npm test           # vitest
npm run size       # size-limit budget check
npm run typecheck  # tsc --noEmit
```

## Bundle size

| Entry | Gzipped | Ships when |
| --- | --- | --- |
| `vivid-img` | ~1.7 KB | always |
| `vivid-img/blurhash` | ~1.0 KB | imported |
| `vivid-img/thumbhash` | ~0.4 KB | imported |

ESM + CJS, full TypeScript types, `"sideEffects": false` for tree-shaking.

## License

MIT © Abraham Christopher
