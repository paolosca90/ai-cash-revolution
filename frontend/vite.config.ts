import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '~backend/client': path.resolve(__dirname, './client'),
      '~backend': path.resolve(__dirname, '../backend'),
    },
  },
  plugins: [
    tailwindcss(),
    react(),
  ],
  build: {
    minify: mode === 'production',
    outDir: 'dist',
    sourcemap: mode === 'development',
  },
  server: {
    port: 5173,
    host: true
  }
}))
