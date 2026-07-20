import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /\/services\/gemini$/,
        replacement: resolve(__dirname, 'src/services/gemini-flash-lite.js'),
      },
    ],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        planohelena: resolve(__dirname, 'planohelena/index.html'),
      },
      external: ['dashjs', 'hls.js', 'flv.js'],
    },
  },
});