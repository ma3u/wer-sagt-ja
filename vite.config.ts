import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import { quizKatalog, spielbar, type FragenDatei } from './src/katalog.ts'
import { pfad, sitemap, wahlLinks, wahlSeite } from './src/seiten.ts'

// Pfad, unter dem die App liegt: „/“ – lokal wie unter https://wersagtja.de/. BASIS_PFAD nur für einen Unterordner.
const base = process.env.BASIS_PFAD ?? '/'

/** Statische Seiten je Wahl, sitemap.xml und die Links darauf in index.html (src/seiten.ts). */
function seiten(): Plugin {
  const wahlen = () => {
    const datei = JSON.parse(readFileSync(new URL('./public/fragen.json', import.meta.url), 'utf8')) as FragenDatei
    return quizKatalog(datei).wahlen.filter(spielbar)
  }
  return {
    name: 'seiten',
    transformIndexHtml: (html) => html.replace('<!-- wahlen -->', wahlLinks(wahlen(), base)),
    generateBundle() {
      const alle = wahlen()
      for (const d of alle) this.emitFile({ type: 'asset', fileName: `${pfad(d.wahl)}/index.html`, source: wahlSeite(d, alle, base) })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap(alle) })
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), seiten()],
})
