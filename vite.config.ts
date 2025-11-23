import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const base = process.env.VITE_BASE ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
})
