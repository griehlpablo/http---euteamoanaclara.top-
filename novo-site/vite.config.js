import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const useGeminiFlashLite = () => ({
  name: 'use-gemini-3.1-flash-lite',
  enforce: 'pre',
  transform(code, id) {
    const normalizedId = id.replaceAll('\\', '/').split('?')[0];
    if (!normalizedId.endsWith('/src/services/gemini.js')) return null;

    const updatedCode = code.replace(
      "STANDARD: 'gemini-flash-latest'",
      "STANDARD: 'gemini-3.1-flash-lite'",
    );

    if (updatedCode === code) {
      this.warn('Não foi possível localizar o modelo Gemini configurado.');
    }

    return { code: updatedCode, map: null };
  },
});

export default defineConfig({
  plugins: [useGeminiFlashLite(), react()],
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