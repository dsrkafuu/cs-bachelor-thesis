import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

/**
 * https://vitejs.dev/config/
 */
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        typescript: true,
      },
      esbuildOptions: {
        loader: 'tsx',
      },
    }),
  ],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        // custom antd theme
        modifyVars: {
          'primary-color': '#7793cc',
        },
      },
      scss: {
        additionalData: `@import '@/styles/variables.scss';`,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    emptyOutDir: false,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
      },
    },
    cors: {
      origin: true,
      credentials: true,
      maxAge: 86400,
    },
  },
});
