import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * GitHub Pages serves project sites from `/<repository-name>/`, so the base is
 * derived from `GITHUB_REPOSITORY` on CI and falls back to `/` locally.
 * `VITE_BASE` overrides both (custom domain, user page, sub-folder hosting).
 */
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.VITE_BASE ?? (repository ? `/${repository}/` : '/');

const sdkSource = fileURLToPath(
  new URL('../../packages/formatir-sdk/src/index.ts', import.meta.url),
);

export default defineConfig(({ command }) => ({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    // Dev: edit the SDK and get HMR. Build: consume the published dist output.
    alias: command === 'serve' ? ({ formatir: sdkSource } as Record<string, string>) : {},
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: false,
  },
  server: { port: 5173, open: false },
}))
