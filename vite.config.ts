import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import { quizKatalog, spielbar, type FragenDatei } from './src/katalog.ts'
import { llmsTxt, pfad, sitemap, wahlLinks, wahlMarkdown, wahlSeite } from './src/seiten.ts'

// Pfad, unter dem die App liegt: „/“ – lokal wie unter https://wersagtja.de/. BASIS_PFAD nur für einen Unterordner.
const base = process.env.BASIS_PFAD ?? '/'

/** Statische Seiten je Wahl (HTML und Markdown), sitemap.xml, llms.txt und die Links in index.html (src/seiten.ts). */
function seiten(): Plugin {
  const lesen = (pfad: string) => readFileSync(new URL(pfad, import.meta.url), 'utf8')
  const wahlen = () => quizKatalog(JSON.parse(lesen('./public/fragen.json')) as FragenDatei).wahlen.filter(spielbar)
  return {
    name: 'seiten',
    transformIndexHtml: (html) => html.replace('<!-- wahlen -->', wahlLinks(wahlen(), base)),
    generateBundle() {
      const alle = wahlen()
      for (const d of alle) {
        this.emitFile({ type: 'asset', fileName: `${pfad(d.wahl)}/index.html`, source: wahlSeite(d, alle, base) })
        this.emitFile({ type: 'asset', fileName: `${pfad(d.wahl)}/index.md`, source: wahlMarkdown(d) })
      }
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap(alle) })
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt(lesen('./src/llms.txt'), alle) })
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), seiten()],
})
