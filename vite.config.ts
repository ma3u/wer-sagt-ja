import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Pfad, unter dem die App liegt: „/“ – lokal wie unter https://wersagtja.de/. BASIS_PFAD nur für einen Unterordner.
const base = process.env.BASIS_PFAD ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
})
