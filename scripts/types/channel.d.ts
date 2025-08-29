export type ChannelData = {
  id: string
  name: string
  alt_names?: string[]
  network?: string
  owners?: string[]
  country: string
  categories?: string[]
  is_nsfw: boolean
  launched?: string
  closed?: string
  replaced_by?: string
  website?: string
}
