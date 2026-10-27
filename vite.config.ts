import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer, defineConfig, type Plugin } from 'vite'
import { quizKatalog, spielbar, type FragenDatei } from './src/katalog.ts'
import { llmsTxt, pfad, sitemap, wahlLinks, wahlMarkdown, wahlSeite } from './src/seiten.ts'
import type { Katalog } from './src/typen.ts'

// Pfad, unter dem die App liegt: „/“ – lokal wie unter https://wersagtja.de/. BASIS_PFAD nur für einen Unterordner.
const base = process.env.BASIS_PFAD ?? '/'

/**
 * Statische Seiten je Wahl (HTML und Markdown), die Methodenseite /methode/, sitemap.xml, llms.txt und die Links in
 * index.html (src/seiten.ts, src/methodeSeite.tsx).
 */
function seiten(): Plugin {
  const lesen = (pfad: string) => readFileSync(new URL(pfad, import.meta.url), 'utf8')
  const katalog = () => quizKatalog(JSON.parse(lesen('./public/fragen.json')) as FragenDatei)
  const wahlen = () => katalog().wahlen.filter(spielbar)
  return {
    name: 'seiten',
    transformIndexHtml: (html) => html.replace('<!-- wahlen -->', wahlLinks(wahlen(), base)),
    async generateBundle(_, bundle) {
      const alle = wahlen()
      for (const d of alle) {
        this.emitFile({ type: 'asset', fileName: `${pfad(d.wahl)}/index.html`, source: wahlSeite(d, alle, base) })
        this.emitFile({ type: 'asset', fileName: `${pfad(d.wahl)}/index.md`, source: wahlMarkdown(d) })
      }
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap(alle) })
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt(lesen('./src/llms.txt'), alle) })

      // Die Methodenseite ist eine React-Komponente: gerendert über einen Vite-Server ohne diese Konfiguration.
      const server = await createServer({
        configFile: false,
        root: fileURLToPath(new URL('.', import.meta.url)),
        logLevel: 'error',
        appType: 'custom',
        server: { middlewareMode: true, hmr: false, ws: false },
        plugins: [react()],
      })
      try {
        const { methodeSeite } = (await server.ssrLoadModule('/src/methodeSeite.tsx')) as {
          methodeSeite: (k: Katalog, stile: string[], base: string) => string
        }
        const stile = Object.keys(bundle).filter((f) => f.endsWith('.css'))
        this.emitFile({ type: 'asset', fileName: 'methode/index.html', source: methodeSeite(katalog(), stile, base) })
      } finally {
        await server.close()
      }
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), seiten()],
})
