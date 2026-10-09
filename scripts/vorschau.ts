// Vorschaubild für geteilte Links (Open Graph): Logo und Titel, animiert. Rendert die Karte Bild für Bild mit
// Chrome (headless) und setzt daraus zusammen:
//   public/vorschau.png  – Standbild (letztes Bild), 1200 × 630 – das zeigen WhatsApp, Signal, Telegram, iMessage
//   public/vorschau.mp4  – Animation (og:video; Discord, Mastodon u. a. spielen sie ab)
//   public/vorschau.gif  – Animation zum Weiterschicken und für die README
//   public/icon-180.png, public/icon-512.png – App-Icons (Homescreen, Web-App-Manifest)
// Aufruf: npm run vorschau  (braucht Google Chrome und ffmpeg; Chrome-Pfad notfalls über CHROME=…)

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

const wurzel = new URL('../', import.meta.url)
const zwischen = new URL('.cache/vorschau/', wurzel)
const oeffentlich = new URL('public/', wurzel)
const pfad = (u: URL) => decodeURIComponent(u.pathname)

const gefunden =
  process.env.CHROME ??
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(
    existsSync,
  )
if (!gefunden) throw new Error('Google Chrome nicht gefunden – Pfad über CHROME=… angeben.')
const CHROME: string = gefunden

const BREITE = 1200
const HOEHE = 630
const BPS = 15
const DAUER = 3.6

const schrift = (paket: string, datei: string) =>
  readFileSync(new URL(`node_modules/@fontsource-variable/${paket}/files/${datei}`, wurzel)).toString('base64')

const FARBEN = { papier: '#eef1f5', tinte: '#1a2233', blau: '#1f4bb8', leise: '#535d74' }

/** Animation `name` ab `start` Sekunden, `dauer` lang – angehalten auf der Zeit --t (so lässt sich jedes Bild setzen). */
const anim = (name: string, start: number, dauer: number, kurve = 'cubic-bezier(.2,.8,.2,1)') =>
  `animation: ${name} ${dauer}s ${kurve} both paused; animation-delay: calc(${start}s - var(--t) * 1s);`

const karte = (t: number) => `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><style>
@font-face { font-family: 'Bricolage'; font-weight: 200 800;
  src: url(data:font/woff2;base64,${schrift('bricolage-grotesque', 'bricolage-grotesque-latin-standard-normal.woff2')}) format('woff2'); }
@font-face { font-family: 'Atkinson'; font-weight: 200 800;
  src: url(data:font/woff2;base64,${schrift('atkinson-hyperlegible-next', 'atkinson-hyperlegible-next-latin-wght-normal.woff2')}) format('woff2'); }
:root { --t: ${t}; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${BREITE}px; height: ${HOEHE}px; overflow: hidden; background: ${FARBEN.papier}; }
body { font-family: 'Atkinson', sans-serif; color: ${FARBEN.tinte}; display: grid; place-items: center; }
.karte { width: 1110px; height: 540px; background: #fff; border: 4px solid ${FARBEN.tinte}; border-radius: 30px;
  box-shadow: 10px 10px 0 ${FARBEN.tinte}; display: flex; align-items: center; gap: 44px; padding: 0 64px 0 52px; }
.logo { width: 330px; height: 330px; flex: none; overflow: visible; position: relative; }
.logo svg { width: 100%; height: 100%; overflow: visible; }
.urne { transform-box: view-box; transform-origin: 32px 59px; ${anim('auf', 0, 0.55, 'cubic-bezier(.3,1.6,.5,1)')} }
.feder { transform-box: view-box; transform-origin: 32px 59px; ${anim('feder', 0.88, 0.4, 'ease-out')} }
.zettel { ${anim('fall', 0.35, 0.55, 'cubic-bezier(.5,0,.7,1)')} }
.kreuz { stroke-dasharray: 1; ${anim('zeichnen', 0.95, 0.5, 'ease-out')} }
.stempel { position: absolute; right: -18px; bottom: 18px; width: 136px; height: 136px; border-radius: 50%;
  border: 7px solid ${FARBEN.blau}; color: ${FARBEN.blau}; background: #fff;
  display: grid; place-items: center; font: 800 54px/1 'Bricolage'; letter-spacing: -0.02em;
  ${anim('stempeln', 2.0, 0.38, 'cubic-bezier(.3,1.5,.5,1)')} }
.text { min-width: 0; }
h1 { font: 800 112px/0.98 'Bricolage'; letter-spacing: -0.04em; white-space: nowrap; ${anim('rein', 1.05, 0.55)} }
.slogan { margin-top: 18px; font: 600 42px/1.15 'Bricolage'; color: ${FARBEN.blau}; ${anim('rein', 1.35, 0.5)} }
.linie { margin: 30px 0 24px; height: 4px; background: ${FARBEN.tinte}; transform-origin: left;
  ${anim('linie', 1.55, 0.45)} }
.info { font: 500 31px/1.35 'Atkinson'; color: ${FARBEN.leise}; ${anim('rein', 1.7, 0.5)} }
.info b { color: ${FARBEN.tinte}; font-weight: 700; }
@keyframes auf { from { transform: translateY(40px) scale(.35); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes feder { 0%, 100% { transform: none } 35% { transform: scale(1.05, .9) } 70% { transform: scale(.98, 1.03) } }
@keyframes fall { from { transform: translateY(-300px) rotate(-24deg); opacity: 0 } 25% { opacity: 1 } to { transform: none } }
@keyframes zeichnen { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes stempeln { from { transform: scale(2.4) rotate(-40deg); opacity: 0 } to { transform: rotate(-12deg); opacity: 1 } }
@keyframes rein { from { transform: translateX(70px); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes linie { from { transform: scaleX(0) } to { transform: scaleX(1) } }
</style></head><body>
<div class="karte">
  <div class="logo">
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <g class="feder"><g class="urne">
        <g class="zettel"><g transform="rotate(-8 32 20)">
          <rect x="19" y="4" width="26" height="30" rx="3" fill="#fff" stroke="${FARBEN.tinte}" stroke-width="2.5"/>
          <path class="kreuz" pathLength="1" d="M26 11.5c3 3 8 8.4 12 11.6M37.6 10.6c-3.4 3.8-7.8 8.6-11.8 13"
            fill="none" stroke="${FARBEN.blau}" stroke-width="3" stroke-linecap="round"/>
        </g></g>
        <rect x="6" y="28" width="52" height="31" rx="7" fill="${FARBEN.blau}"/>
        <rect x="4" y="25" width="56" height="8" rx="4" fill="${FARBEN.tinte}"/>
        <rect x="18" y="27.5" width="28" height="3" rx="1.5" fill="${FARBEN.papier}" opacity=".5"/>
      </g></g>
    </svg>
    <div class="stempel">Ja!</div>
  </div>
  <div class="text">
    <h1>Wer sagt Ja?</h1>
    <p class="slogan">Das Quiz zu den Wahlprogrammen</p>
    <div class="linie"></div>
    <p class="info"><b>Bundestagswahl 2025</b> · 8 Parteien<br>Bis zu 8 Personen · ohne Anmeldung</p>
  </div>
</div>
</body></html>`

rmSync(zwischen, { recursive: true, force: true })
mkdirSync(zwischen, { recursive: true })

function aufnehmen(t: number, ziel: URL) {
  const html = new URL(`karte.html`, zwischen)
  writeFileSync(html, karte(t))
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${BREITE},${HOEHE}`,
      '--virtual-time-budget=1500',
      `--screenshot=${pfad(ziel)}`,
      html.href,
    ],
    { stdio: 'ignore' },
  )
}

const bilder = Math.round(DAUER * BPS)
for (let i = 0; i <= bilder; i++) {
  aufnehmen(i / BPS, new URL(`bild-${String(i).padStart(3, '0')}.png`, zwischen))
  process.stdout.write(`\rBild ${i}/${bilder}`)
}
process.stdout.write('\n')

const ff = (...args: string[]) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' })
const folge = `${pfad(zwischen)}bild-%03d.png`

// Standbild: das letzte Bild (alles sichtbar).
ff('-i', pfad(new URL(`bild-${String(bilder).padStart(3, '0')}.png`, zwischen)), pfad(new URL('vorschau.png', oeffentlich)))
// Video: Animation, dann 1,5 s Standbild – für Dienste, die og:video abspielen.
ff(
  '-framerate', String(BPS), '-i', folge,
  '-vf', `tpad=stop_mode=clone:stop_duration=1.5,format=yuv420p`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-movflags', '+faststart', '-an',
  pfad(new URL('vorschau.mp4', oeffentlich)),
)
// GIF in halber Größe (kleine Datei), Standbild am Ende länger.
ff(
  '-framerate', String(BPS), '-i', folge,
  '-filter_complex',
  'tpad=stop_mode=clone:stop_duration=2,scale=600:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4',
  '-loop', '0',
  pfad(new URL('vorschau.gif', oeffentlich)),
)

// App-Icons: Logo auf Papierfarbe mit Rand (iOS schneidet nichts ab, Android rundet ab).
const favicon = readFileSync(new URL('favicon.svg', oeffentlich), 'utf8').trim().replace(/^<svg[^>]*>|<\/svg>$/g, '')
const iconSvg = new URL('icon.svg', zwischen)
writeFileSync(
  iconSvg,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -14 92 92"><rect x="-14" y="-14" width="92" height="92" fill="${FARBEN.papier}"/>${favicon}</svg>`,
)
for (const g of [180, 512])
  execFileSync('rsvg-convert', ['-w', String(g), '-h', String(g), '-o', pfad(new URL(`icon-${g}.png`, oeffentlich)), pfad(iconSvg)])

console.log('Fertig: public/vorschau.png, vorschau.mp4, vorschau.gif, icon-180.png, icon-512.png')
