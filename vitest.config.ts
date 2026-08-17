import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // json-summary feeds scripts/coverage-summary.mjs, which renders the
      // totals into the CI job summary.
      reporter: ['text', 'json', 'json-summary', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        'scripts/**',
        'tests/**',
        'src/test/**',
        '**/*.test.{ts,tsx}',
        '**/*.config.{ts,js,mjs}',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
