import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    base: env.VITE_BASE_PATH || '/',
    build: {
      outDir: 'dist',
    },
    define: {
      __COMMIT_SHA__: JSON.stringify((env.CF_PAGES_COMMIT_SHA ?? 'dev').slice(0, 7)),
    },
  };
});
