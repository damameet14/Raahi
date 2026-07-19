import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  base: '/admin/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './source'),
    },
  },
  server: {
    port: 5173,
    // Allow the production domains (served behind the nginx reverse proxy /
    // Cloudflare tunnel) in addition to localhost.
    allowedHosts: ['localhost', '.d14.app'],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
});
