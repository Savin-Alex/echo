import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname),
  base: './',
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(__dirname, 'index.html')
    }
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src')
    }
  }
});




