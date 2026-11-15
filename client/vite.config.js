import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const config = loadEnv(mode, process.cwd(), '');
  const proxy = { '/api': { target: config.BACKEND_TARGET || 'http://127.0.0.1:5000', changeOrigin: true } };
  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy },
    test: { environment: 'jsdom', setupFiles: ['./src/test/setup.js'], clearMocks: true },
  };
});
