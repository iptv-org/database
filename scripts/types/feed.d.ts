export type FeedData = {
  channel: string
  id: string
  name: string
  is_main: boolean
  broadcast_area: string[]
  timezones: string[]
  languages: string[]
  video_format?: string
}
