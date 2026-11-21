import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { devProxyFor, resolveApiProxyTarget } from './scripts/api-proxy-target.ts';

export default defineConfig(async ({ command, mode }) => {
  let proxy: ReturnType<typeof devProxyFor> = undefined;
  if (command === 'serve') {
    const fileEnv = loadEnv(mode, process.cwd(), '');
    const resolved = await resolveApiProxyTarget({ ...fileEnv, ...process.env });
    proxy = devProxyFor(command, resolved.origin);
    if (resolved.warning) console.error(`\n[dashboard]\n${resolved.warning}\n`);
    else console.log(`[dashboard] API proxy → ${resolved.origin}`);
  }

  return {
    plugins: [react()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      // IPv4 loopback. On Windows, binding "localhost" can listen only on ::1,
      // so http://127.0.0.1:5173 would not connect.
      host: '127.0.0.1',
      port: 5173,
      proxy,
    },
  };
});
