import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { createServer } from 'node:http'
import { checkAll } from '../../scripts/check_logos.js'

const REMOTE_IMAGE = 'https://i.imgur.com/7oNe8xj.png'

let server
let baseUrl

beforeAll(async () => {
  server = createServer((req, res) => {
    const path = req.url

    if (path === '/not-found') {
      res.writeHead(404)
      res.end('Not Found')
    } else if (path === '/forbidden') {
      res.writeHead(403)
      res.end('Forbidden')
    } else if (path === '/bad-content-type') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end('<html></html>')
    } else if (path === '/server-error') {
      res.writeHead(500)
      res.end('Internal Server Error')
    } else if (path === '/rate-limited') {
      res.writeHead(429, { 'Retry-After': '0' })
      res.end('Too Many Requests')
    } else {
      res.writeHead(404)
      res.end()
    }
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

afterAll(() => {
  server?.close()
})

function makeRows(paths) {
  return paths.map(p => ({ channel: p, url: `${baseUrl}${p}` }))
}

describe('check_logos', () => {
  it('marks a valid remote image URL as alive', async () => {
    const rows = [{ channel: 'test', url: REMOTE_IMAGE }]
    const dead = await checkAll(rows, 2, 10000, 0, null)
    expect(dead).toHaveLength(0)
  })

  it('marks a 404 URL as dead', async () => {
    const rows = makeRows(['/not-found'])
    const dead = await checkAll(rows, 2, 5000, 0, null)
    expect(dead).toHaveLength(1)
    expect(dead[0]._reason).toBe('HTTP 404')
  })

  it('marks a 403 URL as dead', async () => {
    const rows = makeRows(['/forbidden'])
    const dead = await checkAll(rows, 2, 5000, 0, null)
    expect(dead).toHaveLength(1)
    expect(dead[0]._reason).toBe('HTTP 403')
  })

  it('marks a bad content-type as dead', async () => {
    const rows = makeRows(['/bad-content-type'])
    const dead = await checkAll(rows, 2, 5000, 0, null)
    expect(dead).toHaveLength(1)
    expect(dead[0]._reason).toContain('bad content-type')
  })

  it('marks a 500 URL as dead', async () => {
    const rows = makeRows(['/server-error'])
    const dead = await checkAll(rows, 2, 5000, 0, null)
    expect(dead).toHaveLength(1)
    expect(dead[0]._reason).toBe('HTTP 500')
  })

  it('handles a mix of alive and dead URLs', async () => {
    const rows = [
      { channel: 'alive', url: REMOTE_IMAGE },
      ...makeRows(['/not-found', '/forbidden', '/server-error']),
    ]
    const dead = await checkAll(rows, 3, 10000, 0, null)
    expect(dead).toHaveLength(3)
    const reasons = dead.map(d => d._reason).sort()
    expect(reasons).toEqual(['HTTP 403', 'HTTP 404', 'HTTP 500'])
  })

  it('retries and gives up on persistent 429', async () => {
    const rows = makeRows(['/rate-limited'])
    const dead = await checkAll(rows, 2, 5000, 0, null)
    expect(dead).toHaveLength(1)
    expect(dead[0]._reason).toBe('HTTP 429 (gave up after retries)')
  })

  it('marks empty URL as dead', async () => {
    const dead = await checkAll([{ channel: 'test', url: '' }], 2, 5000, 0, null)
    expect(dead).toHaveLength(1)
    expect(dead[0]._reason).toBe('empty url')
  })
})
