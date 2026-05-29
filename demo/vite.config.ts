import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Alias the package to its source so the demo runs against live code with no
// build step — edit src/* and the demo hot-reloads.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@cabraham/react-smart-loader/blurhash': src('../src/blurhash.ts'),
      '@cabraham/react-smart-loader/thumbhash': src('../src/thumbhash.ts'),
      '@cabraham/react-smart-loader': src('../src/index.ts'),
    },
  },
});
