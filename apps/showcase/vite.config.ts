import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { llmsTxtPlugin } from './llms.ts';

/**
 * GitHub Pages serves project sites from `/<repository-name>/`, so the base is
 * derived from `GITHUB_REPOSITORY` on CI and falls back to `/` locally.
 * `VITE_BASE` overrides both (custom domain, user page, sub-folder hosting).
 */
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.VITE_BASE ?? (repository ? `/${repository}/` : '/');

const sdkSource = fileURLToPath(new URL('../../packages/formatir-sdk/src', import.meta.url));

const sdkVersion: string = JSON.parse(
  readFileSync(new URL('../../packages/formatir-sdk/package.json', import.meta.url), 'utf8'),
).version;

export default defineConfig(({ command }) => ({
  base,
  // The dev alias serves the SDK source, where tsup has not injected the version.
  define: { __FORMATIR_VERSION__: JSON.stringify(sdkVersion) },
  plugins: [react(), tailwindcss(), llmsTxtPlugin()],
  resolve: {
    // Dev: edit the SDK and get HMR. Build: consume the published dist output.
    // `formatir/<entry>` maps to `src/<entry>/index.ts`.
    alias:
      command === 'serve'
        ? [
            { find: /^formatir$/, replacement: `${sdkSource}/index.ts` },
            { find: /^formatir\/(.+)$/, replacement: `${sdkSource}/$1/index.ts` },
          ]
        : [],
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: false,
  },
  server: { port: 5173, open: false },
}))
