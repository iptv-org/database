type ChannelProps = {
  id: string
  name?: string
  alt_names?: string[]
  network?: string
  owners?: string[]
  country?: string
  subdivision?: string
  city?: string
  broadcast_area?: string[]
  languages?: string[]
  categories?: string[]
  is_nsfw?: boolean
  launched?: string
  closed?: string
  replaced_by?: string
  website?: string
  logo?: string
}

export class Channel {
  id: string
  name?: string
  alt_names?: string[]
  network?: string
  owners?: string[]
  country?: string
  subdivision?: string
  city?: string
  broadcast_area?: string[]
  languages?: string[]
  categories?: string[]
  is_nsfw?: boolean
  launched?: string
  closed?: string
  replaced_by?: string
  website?: string
  logo?: string

  constructor({
    id,
    name,
    alt_names,
    network,
    owners,
    country,
    subdivision,
    city,
    broadcast_area,
    languages,
    categories,
    is_nsfw,
    launched,
    closed,
    replaced_by,
    website,
    logo
  }: ChannelProps) {
    this.id = id
    this.name = name
    this.alt_names = alt_names
    this.network = network
    this.owners = owners
    this.country = country
    this.subdivision = subdivision
    this.city = city
    this.broadcast_area = broadcast_area
    this.languages = languages
    this.categories = categories
    this.is_nsfw = is_nsfw
    this.launched = launched
    this.closed = closed
    this.replaced_by = replaced_by
    this.website = website
    this.logo = logo
  }

  data() {
    const { ...object } = this

    return object
  }

  merge(channel: Channel) {
    const data: { [key: string]: string | string[] | boolean | undefined } = channel.data()
    for (const prop in data) {
      if (data[prop] === undefined) continue
      this[prop] = data[prop]
    }
  }
}
