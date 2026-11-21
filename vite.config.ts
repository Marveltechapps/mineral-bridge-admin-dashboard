import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

/**
 * Windows resolves "localhost" to IPv6 (::1) first. Another process can own
 * [::1]:5001 and answer 404 while this API is on 127.0.0.1. Keep loopback on IPv4.
 */
function devApiTarget(mode: string): string {
  const raw = process.env.VITE_API_URL || loadEnv(mode, process.cwd(), '').VITE_API_URL || 'http://127.0.0.1:5001';
  try {
    const url = new URL(raw);
    if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
    return url.origin;
  } catch {
    return 'http://127.0.0.1:5001';
  }
}

export default defineConfig(({ mode }) => {
  const api = devApiTarget(mode);
  return {
    plugins: [react()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: api, changeOrigin: true },
        '/v2': { target: api, changeOrigin: true },
      },
    },
  };
});
