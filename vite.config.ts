import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Pages are already lazy-loaded → separate chunks per route
    chunkSizeWarningLimit: 800,
  },
})
