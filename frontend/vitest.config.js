import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    globals: true,
    css: true,
    env: {
      VITE_API_URL: 'http://localhost:5033/api'
    }
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:5033/api')
  }
});
