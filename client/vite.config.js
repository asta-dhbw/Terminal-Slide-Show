import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from '../config/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: './client',
  plugins: [react()],
  server: {
    port: config.frontend.port,
    host: true,
    proxy: {
      '/api': {
        target: `http://${config.backend.host}:${config.backend.port}`,
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/media': {
        target: `http://${config.backend.host}:${config.backend.port}`,
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true
  }
});