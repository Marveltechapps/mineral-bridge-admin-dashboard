import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { devProxyFor, resolveApiProxyTarget } from './scripts/api-proxy-target.ts';

export default defineConfig(async ({ command, mode }) => {
  let proxy: ReturnType<typeof devProxyFor> = undefined;
  if (command === 'serve') {
    const fileEnv = loadEnv(mode, process.cwd(), '');
    const target = await resolveApiProxyTarget({ ...fileEnv, ...process.env });
    proxy = devProxyFor(command, target);
    console.log(`[dashboard] API proxy → ${target}`);
  }

  return {
    plugins: [react()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      port: 5173,
      proxy,
    },
  };
});
