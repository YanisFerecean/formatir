import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: { __FORMATIR_VERSION__: JSON.stringify('0.0.0-test') },
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
