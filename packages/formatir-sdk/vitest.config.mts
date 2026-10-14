import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  // Bindings import the core as `formatir`; point it (and subpaths) at the source.
  resolve: {
    alias: [
      { find: /^formatir$/, replacement: `${src}/index.ts` },
      { find: /^formatir\/(.+)$/, replacement: `${src}/$1/index.ts` },
    ],
  },
  define: { __FORMATIR_VERSION__: JSON.stringify('0.0.0-test') },
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
