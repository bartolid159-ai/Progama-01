import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['better-sqlite3']
  },
  build: {
    rollupOptions: {
      external: ['better-sqlite3', 'fs', 'path', 'util']
    }
  }
})
