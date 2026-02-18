import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  publicDir: 'public',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/client/index.html'),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/client'),
      '@components': path.resolve(__dirname, 'src/client/components'),
      '@hooks': path.resolve(__dirname, 'src/client/hooks'),
      '@services': path.resolve(__dirname, 'src/client/services'),
      '@utils': path.resolve(__dirname, 'src/client/utils'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@stores': path.resolve(__dirname, 'src/client/stores'),
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
});