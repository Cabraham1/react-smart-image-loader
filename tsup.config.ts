import { defineConfig } from 'tsup';
import { readFile, writeFile } from 'node:fs/promises';

const CLIENT_DIRECTIVE = '"use client";\n';

export default defineConfig({
  // Separate entry points keep the base component tiny: the BlurHash /
  // ThumbHash canvas decoders only ship if a consumer explicitly imports them.
  entry: {
    index: 'src/index.ts',
    blurhash: 'src/blurhash.ts',
    thumbhash: 'src/thumbhash.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  treeshake: true,
  minify: true,
  sourcemap: true,
  clean: true,
  // 3 small independent entries → shared-chunk savings are negligible.
  splitting: false,
  // React is provided by the host app — never bundle it.
  external: ['react', 'react-dom'],
  // Emit .js (ESM) and .cjs (CJS) to match the package.json "exports" map.
  outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js' }),
  // esbuild strips module-level directives while bundling, so re-prepend
  // "use client" to the component entry only (Next.js App Router boundary).
  // The pure decoder entries stay server-safe with no directive.
  async onSuccess() {
    for (const file of ['dist/index.js', 'dist/index.cjs']) {
      const code = await readFile(file, 'utf8');
      if (!code.startsWith(CLIENT_DIRECTIVE)) {
        await writeFile(file, CLIENT_DIRECTIVE + code);
      }
    }
  },
});
