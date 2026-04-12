import fs from 'node:fs'
import path from 'node:path'

const ROUTES_DIR = path.resolve(__dirname, '../src/routes')

const listRouteFiles = (): string[] => fs
  .readdirSync(ROUTES_DIR)
  .filter((f) => f.endsWith('.ts') && !f.startsWith('_'))
  .map((f) => path.join(ROUTES_DIR, f))

// Bare router.method(...) calls — old pattern without marker helper.
// Marker helpers are used via `routes.route(x).method(...tenantScoped(h))` — so the
// method call site will contain a spread of adminOnly/tenantScoped/publicRoute.
const BARE_CALL_RE = /\.(get|post|put|delete|patch)\s*\(([^)]*)\)/g
const MARKER_HELPERS = ['adminOnly', 'tenantScoped', 'publicRoute']

const isCovered = (argsText: string): boolean => MARKER_HELPERS.some((h) => argsText.includes(h))

describe('marker coverage', () => {
  it('every route file uses a marker helper on every route', () => {
    const offenders: string[] = []
    for (const file of listRouteFiles()) {
      const src = fs.readFileSync(file, 'utf8')
      let match: RegExpExecArray | null
      BARE_CALL_RE.lastIndex = 0
      while ((match = BARE_CALL_RE.exec(src)) !== null) {
        const [, method, args] = match
        if (!isCovered(args)) {
          offenders.push(`${path.basename(file)}: .${method}(${args.slice(0, 80)}...)`)
        }
      }
    }
    if (offenders.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`Unmarked routes found:\n  ${offenders.join('\n  ')}`)
    }
    expect(offenders).toHaveLength(0)
  })
})
