#!/usr/bin/env node
/**
 * Scan data/logos.csv for broken logo URLs and write dead entries to a JSON file.
 *
 * A URL is considered dead if:
 *   - The connection fails or times out
 *   - The HTTP response is not 2xx  (429s are retried with exponential backoff)
 *   - The Content-Type header is not image/*
 *
 * Requires: Node.js 18+ (uses built-in fetch)
 *
 * Usage:
 *   # Full scan of data/logos.csv
 *   node scripts/check_logos.js
 *
 *   # Re-check a previous result (overwrites the same file by default)
 *   node scripts/check_logos.js --recheck dead_logos.json --concurrency 10 --delay 500
 *
 *   # Keep re-checking until no more URLs recover
 *   node scripts/check_logos.js --recheck dead_logos.json --loop --concurrency 10 --delay 500
 */

import { createReadStream, writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { parseArgs } from 'node:util'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Match Python's ssl=False — accept self-signed / expired certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const DEFAULT_CONCURRENCY = 50
const DEFAULT_TIMEOUT = 15_000 // ms per request
const DEFAULT_DELAY_MS = 0
const MAX_RETRIES = 4
const RETRY_BASE = 2.0 // seconds; doubles each retry + jitter

const CSV_PATH = resolve(__dirname, '..', 'data', 'logos.csv')
const DEFAULT_OUTPUT = resolve(__dirname, '..', 'dead_logos.json')

// ---------------------------------------------------------------------------
// Magic-byte image detection (for servers that send application/octet-stream)
// ---------------------------------------------------------------------------

const IMAGE_MAGIC = [
  { magic: Buffer.from([0x89, 0x50, 0x4e, 0x47]), offset: 0 }, // PNG
  { magic: Buffer.from([0xff, 0xd8, 0xff]), offset: 0 },       // JPEG
  { magic: Buffer.from('GIF87a'), offset: 0 },                  // GIF
  { magic: Buffer.from('GIF89a'), offset: 0 },                  // GIF
  { magic: Buffer.from('RIFF'), offset: 0 },                    // WebP
  { magic: Buffer.from('<svg'), offset: 0 },                    // SVG
  { magic: Buffer.from('<?xml'), offset: 0 },                   // SVG via XML declaration
  { magic: Buffer.from([0x00, 0x00, 0x00]), offset: 0 },        // AVIF/HEIF (ftyp box, loose match)
]
const SNIFF_BYTES = 16

function isImageBytes(data) {
  for (const { magic, offset } of IMAGE_MAGIC) {
    if (data.length >= offset + magic.length && data.subarray(offset, offset + magic.length).equals(magic)) {
      return true
    }
  }
  return false
}

// ---------------------------------------------------------------------------
// CSV loader
// ---------------------------------------------------------------------------

function parseCsvLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

async function loadCsv(path) {
  const rows = []
  const rl = createInterface({ input: createReadStream(path, 'utf-8'), crlfDelay: Infinity })
  let headers = null
  for await (const line of rl) {
    const values = parseCsvLine(line)
    if (!headers) {
      headers = values
      continue
    }
    const row = {}
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i] ?? ''
    }
    rows.push(row)
  }
  return rows
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function save(dead, path) {
  mkdirSync(dirname(path), { recursive: true })
  const sorted = [...dead].sort((a, b) => (a.channel || '').localeCompare(b.channel || ''))
  writeFileSync(path, JSON.stringify(sorted, null, 2) + '\n', 'utf-8')
}

function printSummary(dead) {
  const reasons = {}
  for (const r of dead) {
    const reason = r._reason
    let key
    if (reason.startsWith('HTTP ')) key = reason
    else if (reason.includes('timeout')) key = 'timeout'
    else if (['ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET', 'UND_ERR'].some(kw => reason.includes(kw))) key = 'connection error'
    else if (reason.startsWith('bad content-type')) key = 'bad content-type'
    else key = 'other'
    reasons[key] = (reasons[key] || 0) + 1
  }
  console.log('  Reason breakdown:')
  const sorted = Object.entries(reasons).sort((a, b) => b[1] - a[1])
  for (const [reason, count] of sorted) {
    console.log(`    ${String(count).padStart(6)}  ${reason}`)
  }
}

// ---------------------------------------------------------------------------
// Progress formatting
// ---------------------------------------------------------------------------

function fmtProgress(checked, total, dead, elapsed) {
  const rate = elapsed > 0 ? checked / elapsed : 0
  const eta = rate > 0 && checked < total ? (total - checked) / rate : 0
  return `[${checked}/${total}] ${(checked / total * 100).toFixed(1)}%  dead: ${dead}  ${rate.toFixed(1)}/s  eta: ${(eta / 60).toFixed(1)}min`
}

// ---------------------------------------------------------------------------
// Fetch with method fallback
// ---------------------------------------------------------------------------

async function fetchUrl(url, method, timeout) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const resp = await fetch(url, {
      method: method === 'GET_SNIFF' ? 'GET' : method,
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; logo-checker/1.0)' },
    })
    let bodyPrefix = null
    if (method === 'GET_SNIFF') {
      const reader = resp.body?.getReader()
      if (reader) {
        const { value } = await reader.read()
        bodyPrefix = value ? Buffer.from(value.slice(0, SNIFF_BYTES)) : Buffer.alloc(0)
        reader.cancel().catch(() => {})
      } else {
        bodyPrefix = Buffer.alloc(0)
      }
    }
    return {
      status: resp.status,
      contentType: resp.headers.get('content-type') || '',
      retryAfter: resp.headers.get('retry-after'),
      bodyPrefix,
    }
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function checkAll(rows, concurrency, timeout, delayMs, liveOutput) {
  const total = rows.length
  const dead = []
  const aliveUrls = new Set()
  let checked = 0
  let pending = total
  let dirty = false
  const start = performance.now()
  const delayS = delayMs / 1000

  const queue = []
  const waiters = []

  function enqueue(item) {
    if (waiters.length > 0) {
      waiters.shift()(item)
    } else {
      queue.push(item)
    }
  }

  function dequeue() {
    if (queue.length > 0) return Promise.resolve(queue.shift())
    return new Promise(r => waiters.push(r))
  }

  for (const row of rows) {
    enqueue({ row, attempt: 0, method: 'HEAD' })
  }

  function flushLive() {
    if (!liveOutput) return
    const remaining = rows.filter(r => !aliveUrls.has(r.url || ''))
    save(remaining, liveOutput)
  }

  function markResolved(row, isDead, reason) {
    checked++
    pending--
    if (checked % 500 === 0 || checked === total) {
      const elapsed = (performance.now() - start) / 1000
      console.log('  ' + fmtProgress(checked, total, dead.length, elapsed))
    }
    if (isDead) {
      const entry = { ...row }
      delete entry._reason
      entry._reason = reason
      dead.push(entry)
    } else {
      aliveUrls.add(row.url || '')
      dirty = true
    }
    if (pending === 0) {
      for (let i = 0; i < concurrency; i++) enqueue(null)
    }
  }

  function requeueLater(item, delay) {
    setTimeout(() => enqueue(item), delay * 1000)
  }

  const heartbeat = setInterval(() => {
    const elapsed = (performance.now() - start) / 1000
    console.log('  ' + fmtProgress(checked, total, dead.length, elapsed))
    if (dirty) {
      flushLive()
      dirty = false
    }
  }, 15_000)

  async function worker() {
    while (true) {
      const item = await dequeue()
      if (item === null) return

      const { row, attempt, method } = item
      const url = (row.url || '').trim()

      if (!url) {
        markResolved(row, true, 'empty url')
        continue
      }

      let result
      try {
        result = await fetchUrl(url, method, timeout)
        if (delayS > 0) await new Promise(r => setTimeout(r, delayMs))
      } catch (err) {
        const msg = err.name === 'AbortError' ? 'timeout' : String(err.cause?.code || err.message || err)
        if (msg.includes('EMFILE') && attempt < MAX_RETRIES) {
          requeueLater({ row, attempt: attempt + 1, method }, 1.0 + Math.random())
          continue
        }
        markResolved(row, true, msg)
        continue
      }

      const { status, contentType, retryAfter, bodyPrefix } = result

      if (status === 429) {
        if (attempt >= MAX_RETRIES) {
          markResolved(row, true, 'HTTP 429 (gave up after retries)')
        } else {
          const wait = retryAfter ? parseFloat(retryAfter) : RETRY_BASE * (2 ** attempt)
          requeueLater({ row, attempt: attempt + 1, method }, Math.min(wait, 60) + Math.random() * 2)
        }
        continue
      }

      if (status === 405 && method === 'HEAD') {
        enqueue({ row, attempt, method: 'GET' })
        continue
      }

      if (!(status >= 200 && status < 300)) {
        markResolved(row, true, `HTTP ${status}`)
        continue
      }

      if (contentType && !contentType.startsWith('image/')) {
        if (contentType.includes('octet-stream') && method === 'HEAD') {
          enqueue({ row, attempt, method: 'GET_SNIFF' })
          continue
        }
        if (method !== 'GET_SNIFF') {
          markResolved(row, true, `bad content-type: ${contentType}`)
          continue
        }
      }

      if (method === 'GET_SNIFF') {
        if (isImageBytes(bodyPrefix)) {
          markResolved(row, false, 'ok')
        } else {
          markResolved(row, true, `bad content-type: ${contentType} (not an image)`)
        }
        continue
      }

      markResolved(row, false, 'ok')
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  clearInterval(heartbeat)

  flushLive()
  const elapsed = (performance.now() - start) / 1000
  console.log(`  Finished in ${(elapsed / 60).toFixed(1)}min — ${dead.length}/${total} still dead`)
  return dead
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main() {
  const { values } = parseArgs({
    options: {
      concurrency: { type: 'string', default: String(DEFAULT_CONCURRENCY) },
      timeout: { type: 'string', default: String(DEFAULT_TIMEOUT / 1000) },
      delay: { type: 'string', default: String(DEFAULT_DELAY_MS) },
      output: { type: 'string' },
      recheck: { type: 'string' },
      loop: { type: 'boolean', default: false },
    },
    strict: true,
  })

  const concurrency = parseInt(values.concurrency, 10)
  const timeout = parseInt(values.timeout, 10) * 1000
  const delayMs = parseInt(values.delay, 10)

  if (values.loop && !values.recheck) {
    console.error('Error: --loop requires --recheck')
    process.exit(1)
  }

  let rows
  let output

  if (values.recheck) {
    const recheckPath = resolve(values.recheck)
    rows = loadJson(recheckPath)
    output = values.output ? resolve(values.output) : recheckPath
    console.log(`Rechecking ${recheckPath}  (${rows.length} entries)`)
  } else {
    rows = await loadCsv(CSV_PATH)
    output = values.output ? resolve(values.output) : DEFAULT_OUTPUT
  }

  const liveOutput = values.recheck ? output : null

  if (values.loop) {
    for (let iteration = 1; iteration < 1000; iteration++) {
      console.log(`\n--- Iteration ${iteration} (${rows.length} entries) ---`)
      const dead = await checkAll(rows, concurrency, timeout, delayMs, liveOutput)
      printSummary(dead)
      if (!values.recheck) save(dead, output)
      console.log(`  Saved ${dead.length} entries to ${output}`)

      const cleared = rows.length - dead.length
      if (cleared === 0) {
        console.log(`\nStabilized after ${iteration} iteration(s). ${dead.length} confirmed dead.`)
        break
      }
      console.log(`  Cleared ${cleared} URLs this pass — running again...`)
      rows = dead
    }
  } else {
    const dead = await checkAll(rows, concurrency, timeout, delayMs, liveOutput)
    printSummary(dead)
    if (!values.recheck) save(dead, output)
    console.log(`\nWritten to ${output}`)
  }
}

main()
