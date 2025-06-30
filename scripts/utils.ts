import path from 'node:path'

export function createChannelId(
  name: string | undefined,
  country: string | undefined
): string | undefined {
  if (!name || !country) return undefined

  const slug = normalize(name)
  const code = country.toLowerCase()

  return `${slug}.${code}`
}

export function createFeedId(name: string): string {
  return normalize(name)
}

function normalize(string: string): string {
  return string
    .replace(/^@/gi, 'At')
    .replace(/^&/i, 'And')
    .replace(/\+/gi, 'Plus')
    .replace(/\s-(\d)/gi, ' Minus$1')
    .replace(/^-(\d)/gi, 'Minus$1')
    .replace(/[^a-z\d]+/gi, '')
}

export function getFileExtension(url: string): string {
  const filename = path.basename(url)
  const extension = path.extname(filename)

  return extension.replace(/^\./, '').toLowerCase()
}
