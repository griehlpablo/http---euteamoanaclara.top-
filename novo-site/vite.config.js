import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Aqui está o bloqueio! O Vite vai ignorar esses arquivos gigantes que quebram o build
      external: ['dashjs', 'hls.js', 'flv.js']
    }
  }
})