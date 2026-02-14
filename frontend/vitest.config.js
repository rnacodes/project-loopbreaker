import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    globals: true,
    css: false,
    env: {
      VITE_API_URL: 'http://localhost:5033/api'
    },
    deps: {
      optimizer: {
        web: {
          include: [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
            '@testing-library/react',
            '@testing-library/jest-dom',
            '@testing-library/user-event',
            'react-router-dom',
            'axios',
          ]
        }
      }
    }
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:5033/api')
  }
});
