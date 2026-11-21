import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_API_URL || loadEnv(mode, process.cwd(), '').VITE_API_URL || 'http://localhost:5001', changeOrigin: true },
      '/v2': { target: process.env.VITE_API_URL || loadEnv(mode, process.cwd(), '').VITE_API_URL || 'http://localhost:5001', changeOrigin: true },
    },
  },
}));
