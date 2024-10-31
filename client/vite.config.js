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
    host: '0.0.0.0', // Always bind to all network interfaces
    port: config.frontend.port,
    strictPort: true, // Force the specified port
    watch: {
      usePolling: true // Important for Docker volumes
    },
    proxy: {
      '/api': {
        target: 'http://backend:3000', // Use service name from docker-compose
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'http://backend:3000',
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