import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Pfad, unter dem die App liegt: „/“ lokal, „/<repository>/“ auf GitHub Pages (.github/workflows/pages.yml).
const base = process.env.BASIS_PFAD ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
})
