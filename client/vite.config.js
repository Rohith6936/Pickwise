//finalworking/p6/client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false,
    host: true,
  },
  preview: {
    port: 5174,
    host: true,
  },
})