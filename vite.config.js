import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Relative base ('./') keeps the build host-agnostic: it works from a domain
// root, a GitHub Pages project subpath, Netlify, Vercel, or even file://.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
