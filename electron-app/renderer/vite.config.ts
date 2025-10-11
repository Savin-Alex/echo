import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,  // Fail instead of auto-bumping to prevent black screen
    host: 'localhost'
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});




