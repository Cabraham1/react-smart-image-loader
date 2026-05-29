import { useMemo, useRef, useState } from 'react';
import { SmartImage, usePredictivePreload } from 'vivid-img';
import { blurHashToDataURL } from 'vivid-img/blurhash';
import { thumbHashToDataURL } from 'vivid-img/thumbhash';

const img = (seed: number | string, w = 600, h = 400) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

// Bust the browser cache between sessions so placeholders are visible.
const v = Date.now();
const fresh = (seed: number | string) => `${img(seed)}?v=${v}`;

export function App() {
  const blur = useMemo(
    () => blurHashToDataURL('LGF5?M9F00~q_MOffQWB00%MwbRj', 32, 32),
    []
  );
  const thumb = useMemo(
    () => thumbHashToDataURL('1QcSHQRnh493V4dIh4eXh1h4kJUI'),
    []
  );

  return (
    <div className="wrap">
      <header>
        <h1>vivid-img</h1>
        <p>Smart, network-aware React image loading — live demo.</p>
        <div className="badges">
          <span className="badge">&lt; 2KB gzipped</span>
          <span className="badge">zero deps</span>
          <span className="badge">lazy + IO fallback</span>
          <span className="badge">retry / fallback</span>
          <span className="badge">zero CLS</span>
        </div>
      </header>

      <Placeholders blur={blur} thumb={thumb} />
      <PriorityVsLazy />
      <RetryFallback />
      <CacheDemo />
      <PredictivePreload />
    </div>
  );
}

function Placeholders({ blur, thumb }: { blur: string; thumb: string }) {
  return (
    <section>
      <h2>1 · Placeholders</h2>
      <p className="desc">
        Blur (decoded BlurHash), blur (decoded ThumbHash), and an animated
        shimmer — each cross-fades to the real image with no layout shift.
      </p>
      <div className="row">
        <div>
          <div className="card">
            <SmartImage
              src={fresh('blur-1')}
              aspectRatio={3 / 2}
              placeholder="blur"
              blurSource={blur}
              alt="BlurHash placeholder"
            />
          </div>
          <p className="label">placeholder="blur" · BlurHash</p>
        </div>
        <div>
          <div className="card">
            <SmartImage
              src={fresh('thumb-1')}
              aspectRatio={3 / 2}
              placeholder="blur"
              blurSource={thumb}
              alt="ThumbHash placeholder"
            />
          </div>
          <p className="label">placeholder="blur" · ThumbHash</p>
        </div>
        <div>
          <div className="card">
            <SmartImage
              src={fresh('shimmer-1')}
              aspectRatio={3 / 2}
              placeholder="shimmer"
              alt="Shimmer placeholder"
            />
          </div>
          <p className="label">placeholder="shimmer"</p>
        </div>
      </div>
    </section>
  );
}

function PriorityVsLazy() {
  return (
    <section>
      <h2>2 · Priority vs. lazy</h2>
      <p className="desc">
        The hero is <code>priority</code> (eager + high fetchPriority). The grid
        below is lazy — open DevTools → Network and scroll to watch them load on
        demand.
      </p>
      <div className="card" style={{ marginBottom: 16 }}>
        <SmartImage
          src={fresh('hero')}
          aspectRatio={21 / 9}
          priority
          placeholder="shimmer"
          alt="Priority hero"
        />
      </div>
      <div className="grid">
        {Array.from({ length: 9 }, (_, i) => (
          <div className="card" key={i}>
            <SmartImage
              src={fresh(`lazy-${i}`)}
              aspectRatio={3 / 2}
              placeholder="shimmer"
              alt={`Lazy image ${i + 1}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function RetryFallback() {
  return (
    <section>
      <h2>3 · Retry &amp; fallback</h2>
      <p className="desc">
        This <code>src</code> is intentionally broken. It retries with
        exponential backoff (1s, 2s, 4s) then swaps to <code>fallbackSrc</code>.
      </p>
      <div className="row">
        <div style={{ maxWidth: 360 }}>
          <div className="card">
            <SmartImage
              src="https://example.invalid/does-not-exist.jpg"
              fallbackSrc={fresh('fallback')}
              aspectRatio={3 / 2}
              maxRetries={2}
              placeholder="shimmer"
              alt="Broken image with fallback"
              onErrorFinal={() => console.log('vivid-img: fell back')}
            />
          </div>
          <p className="label">broken src → fallbackSrc after retries</p>
        </div>
      </div>
    </section>
  );
}

function CacheDemo() {
  const [shown, setShown] = useState(true);
  return (
    <section>
      <h2>4 · Memory cache</h2>
      <p className="desc">
        Toggle the image off and on. The first load cross-fades; once cached it
        reappears instantly with no fade (global in-memory cache).
      </p>
      <button onClick={() => setShown((s) => !s)}>
        {shown ? 'Unmount' : 'Mount'} image
      </button>
      <div style={{ maxWidth: 360, marginTop: 12 }}>
        {shown ? (
          <div className="card">
            <SmartImage
              src={fresh('cache')}
              aspectRatio={3 / 2}
              placeholder="shimmer"
              alt="Cached image"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PredictivePreload() {
  const containerRef = useRef<HTMLDivElement>(null);
  const upcoming = useMemo(
    () => Array.from({ length: 6 }, (_, i) => fresh(`preload-${i}`)),
    []
  );
  // Warm the next images once the user scrolls fast enough.
  usePredictivePreload(upcoming, { count: 3 });

  return (
    <section ref={containerRef}>
      <h2>5 · Predictive preload</h2>
      <p className="desc">
        Scroll quickly toward the bottom: <code>usePredictivePreload</code>
        detects the velocity and warms the next images before they appear. Hover
        a card to trigger its <code>preloadNext</code> manually.
      </p>
      <div className="row">
        {upcoming.slice(0, 2).map((src, i) => (
          <div key={i} style={{ maxWidth: 280 }}>
            <div className="card">
              <SmartImage
                src={src}
                aspectRatio={3 / 2}
                placeholder="shimmer"
                preloadNext={upcoming.slice(i + 1, i + 3)}
                alt={`Carousel item ${i + 1}`}
              />
            </div>
            <p className="label">hover to preloadNext</p>
          </div>
        ))}
      </div>
      <div className="tall">
        <span className="hint">↑ scroll back up — the rest are already warm</span>
      </div>
      <div className="grid">
        {upcoming.slice(2).map((src, i) => (
          <div className="card" key={i}>
            <SmartImage src={src} aspectRatio={3 / 2} placeholder="shimmer" alt={`Preloaded ${i + 1}`} />
          </div>
        ))}
      </div>
    </section>
  );
}
