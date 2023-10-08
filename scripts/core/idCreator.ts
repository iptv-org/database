export class IDCreator {
  create(name: string, country: string): string {
    const slug = normalize(name)
    const code = country.toLowerCase()

    return `${slug}.${code}`
  }
}

function normalize(name: string) {
  return name
    .replace(/^@/gi, 'At')
    .replace(/^&/i, 'And')
    .replace(/\+/gi, 'Plus')
    .replace(/\s-(\d)/gi, ' Minus$1')
    .replace(/[^a-z\d]+/gi, '')
}
