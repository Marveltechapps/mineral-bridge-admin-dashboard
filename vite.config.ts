/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5190, strictPort: true },
  preview: { port: 4173, strictPort: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    // Route-level tests mount lazy-loaded pages, so a single test legitimately
    // spans several dynamic imports. The default 5s is too tight for that under
    // load; see tests/unit/setup.ts for the matching Testing Library timeout.
    testTimeout: 30_000,
  },
});
