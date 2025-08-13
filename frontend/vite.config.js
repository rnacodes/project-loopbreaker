import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Make environment variables available at build time
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5033/api')
  }
})
