import { defineConfig } from 'tsup';
import pkg from './package.json';

const shared = {
  entry: { index: 'src/index.ts' },
  target: 'es2019' as const,
  minify: true,
  treeshake: true,
  define: { __FORMATIR_VERSION__: JSON.stringify(pkg.version) },
};

export default defineConfig([
  {
    ...shared,
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' }),
  },
  {
    ...shared,
    // Drop-in <script> build: exposes the module namespace as `window.Formatir`,
    // so `Formatir.init(...)` works without a bundler.
    format: ['iife'],
    globalName: 'Formatir',
    outExtension: () => ({ js: '.global.js' }),
  },
]);
