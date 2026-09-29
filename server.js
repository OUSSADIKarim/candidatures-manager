// Production server for the online demo: one Node service for the API and the application.
//
//   /api/*        JSON Server REST API (same routes as `pnpm api`, behind a prefix)
//   static files  the built application (dist/)
//   anything else index.html, so that /candidatures/3 works on reload (history mode)
//
// The /api prefix is needed because the application page /candidatures and the API resource
// /candidatures would otherwise share the same URL. Local development is unchanged: pnpm start.
import { copyFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import jsonServer from 'json-server'

const root = fileURLToPath(new URL('.', import.meta.url))
const dist = join(root, 'dist')
const port = Number(process.env.PORT) || 3000

if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/ is missing: run "pnpm build" before "pnpm serve".')
  process.exit(1)
}

// Each start works on a fresh copy of the provided data: the demo always begins with the
// original candidatures, and the repository files are never modified.
const database = process.env.DB_FILE ?? join(tmpdir(), 'candidatures-db.json')
if (!process.env.DB_FILE) copyFileSync(join(root, 'db.backup.json'), database)

const app = jsonServer.create()

app.get('/healthz', (_request, response) => response.json({ status: 'ok' }))
app.use(
  '/api',
  (_request, response, next) => {
    response.set('Cache-Control', 'no-cache') // data changes: always revalidate
    next()
  },
  jsonServer.router(database),
)

// Compression and static files. No CORS needed: the application and the API share an origin.
app.use(jsonServer.defaults({ static: dist, logger: false, noCors: true }))
app.use((request, response, next) => {
  const wantsPage = request.method === 'GET' && request.accepts('html')
  if (wantsPage) response.sendFile(join(dist, 'index.html'))
  else next()
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Application : http://localhost:${port}`)
  console.log(`API         : http://localhost:${port}/api/candidatures`)
})
