type FeedProps = {
  channel: string
  id: string
  name?: string
  is_main?: boolean
  broadcast_area?: string[]
  timezones?: string[]
  languages?: string[]
  video_format?: string
}

export class Feed {
  channel: string
  id: string
  name?: string
  is_main?: boolean
  broadcast_area: string[]
  timezones: string[]
  languages: string[]
  video_format?: string

  constructor({
    channel,
    id,
    name,
    is_main,
    broadcast_area,
    timezones,
    languages,
    video_format
  }: FeedProps) {
    this.channel = channel
    this.id = id
    this.name = name
    this.is_main = is_main
    this.broadcast_area = broadcast_area || []
    this.timezones = timezones || []
    this.languages = languages || []
    this.video_format = video_format
  }

  data() {
    const { ...object } = this

    return object
  }

  merge(feed: Feed) {
    const data: { [key: string]: string | string[] | boolean | undefined } = feed.data()
    for (const prop in data) {
      if (data[prop] === undefined) continue
      this[prop] = data[prop]
    }
  }
}
