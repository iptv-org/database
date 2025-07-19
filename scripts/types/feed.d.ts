export type FeedData = {
  channel: string
  id: string
  name: string
  alt_names: string[]
  is_main: boolean
  broadcast_area: string[]
  timezones: string[]
  languages: string[]
  format?: string
}
