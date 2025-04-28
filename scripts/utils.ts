export function createChannelId(
  name: string | undefined,
  country: string | undefined
): string | undefined {
  if (!name || !country) return undefined

  const slug = normalize(name)
  const code = country.toLowerCase()

  return `${slug}.${code}`
}

export function createFeedId(name: string) {
  return normalize(name)
}

function normalize(string: string) {
  return string
    .replace(/^@/gi, 'At')
    .replace(/^&/i, 'And')
    .replace(/\+/gi, 'Plus')
    .replace(/\s-(\d)/gi, ' Minus$1')
    .replace(/^-(\d)/gi, 'Minus$1')
    .replace(/[^a-z\d]+/gi, '')
}
