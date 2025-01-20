import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from '../config/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDevelopment = process.env.NODE_ENV !== 'production';

export default defineConfig({
  root: './client',
  plugins: [react()],
  server: {
    host: isDevelopment ? 'localhost' : '0.0.0.0',
    port: config.frontend.port,
    strictPort: false,
    watch: {
      usePolling: true
    },
    proxy: {
      '/api': {
        target: isDevelopment
          ? `http://localhost:${config.backend.port}`
          : `http://backend:${config.backend.port}`,
        changeOrigin: true,
      },
      '/ws': {
        target: isDevelopment
          ? `ws://localhost:${config.backend.port}`
          : `ws://backend:${config.backend.port}`,
        ws: true,
        changeOrigin: true,
      },
      '/media': {
        target: isDevelopment
          ? `http://localhost:${config.backend.port}`
          : `http://backend:${config.backend.port}`,
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true
  }
});