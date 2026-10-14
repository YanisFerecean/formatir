import { defineConfig } from 'tsup';
import pkg from './package.json';

const shared = {
  target: 'es2019' as const,
  minify: true,
  treeshake: true,
  define: { __FORMATIR_VERSION__: JSON.stringify(pkg.version) },
};

export default defineConfig([
  {
    ...shared,
    entry: {
      index: 'src/index.ts',
      extras: 'src/extras/index.ts',
      react: 'src/react/index.ts',
      vue: 'src/vue/index.ts',
    },
    format: ['esm', 'cjs'],
    // Bindings share the core's module instance instead of bundling a copy.
    external: ['formatir'],
    dts: true,
    clean: true,
    sourcemap: true,
    // Every entry is self-contained, so the size budget measures what ships.
    splitting: false,
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' }),
  },
  {
    ...shared,
    // Drop-in <script> build: exposes the module namespace as `window.Formatir`,
    // so `Formatir.init(...)` works without a bundler.
    entry: { index: 'src/index.ts' },
    format: ['iife'],
    globalName: 'Formatir',
    outExtension: () => ({ js: '.global.js' }),
  },
  {
    ...shared,
    entry: { extras: 'src/extras/index.ts' },
    format: ['iife'],
    globalName: 'FormatirExtras',
    outExtension: () => ({ js: '.global.js' }),
  },
]);
