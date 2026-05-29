import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SmartImage } from '../src/SmartImage';
import { clearCache } from '../src/cache';

describe('SmartImage', () => {
  beforeEach(() => clearCache());

  it('reserves layout via aspect-ratio (zero CLS)', () => {
    const { container } = render(
      <SmartImage src="https://x/a.jpg" aspectRatio={16 / 9} alt="a" />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe(String(16 / 9));
  });

  it('loads and shows the high-res image once decoded', async () => {
    render(<SmartImage src="https://x/ok.jpg" aspectRatio={1} alt="ok" />);
    const img = await screen.findByAltText('ok');
    await waitFor(() => expect(img).toHaveStyle({ opacity: '1' }));
    expect(img).toHaveAttribute('src', 'https://x/ok.jpg');
  });

  it('falls back after the source fails', async () => {
    render(
      <SmartImage
        src="https://x/fail.jpg"
        fallbackSrc="https://x/backup.jpg"
        aspectRatio={1}
        maxRetries={0}
        alt="img"
      />
    );
    const img = await screen.findByAltText('img');
    await waitFor(() =>
      expect(img).toHaveAttribute('src', 'https://x/backup.jpg')
    );
  });

  it('eager-loads and sets high fetchPriority when priority', async () => {
    render(<SmartImage src="https://x/hero.jpg" aspectRatio={1} priority alt="hero" />);
    const img = await screen.findByAltText('hero');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });
});
