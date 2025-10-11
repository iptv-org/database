import { Dictionary } from '@freearhey/core'
import { IssueData, Issue } from '../core'

const FIELDS = new Dictionary({
  'Channel ID': 'channel_id',
  'Channel Name': 'channel_name',
  'Feed Name': 'feed_name',
  'Feed ID': 'feed_id',
  'Main Feed': 'is_main',
  'Alternative Names': 'alt_names',
  Network: 'network',
  Owners: 'owners',
  Country: 'country',
  Subdivision: 'subdivision',
  'Broadcast Area': 'broadcast_area',
  Timezones: 'timezones',
  Format: 'format',
  Languages: 'languages',
  Categories: 'categories',
  NSFW: 'is_nsfw',
  Launched: 'launched',
  Closed: 'closed',
  'Replaced By': 'replaced_by',
  Website: 'website',
  Reason: 'reason',
  Notes: 'notes',
  Reference: 'ref',
  'Logo URL': 'logo_url',
  Tags: 'tags',
  Width: 'width',
  Height: 'height',
  'New Channel ID': 'new_channel_id',
  'New Feed ID': 'new_feed_id',
  'New Logo URL': 'new_logo_url',
  'City Name': 'city_name',
  'City Code': 'city_code',
  'Wikidata ID': 'wikidata_id'
})

export class IssueParser {
  parse(issue: { number: number; body: string; labels: { name: string }[] }): Issue {
    const fields = typeof issue.body === 'string' ? issue.body.split('###') : []

    const data = new Dictionary()
    fields.forEach((field: string) => {
      const parsed = typeof field === 'string' ? field.split(/\r?\n/).filter(Boolean) : []
      let _label = parsed.shift()
      _label = _label ? _label.replace(/ \(optional\)| \(required\)/, '').trim() : ''
      let _value = parsed.join('\r\n')
      _value = _value ? _value.trim() : ''

      if (!_label || !_value) return data

      const id: string = FIELDS.get(_label)
      const value: string =
        _value.toLowerCase() === '_no response_' || _value.toLowerCase() === 'none' ? '' : _value

      if (!id) return

      data.set(id, value)
    })

    const labels = issue.labels.map(label => label.name)

    return new Issue({ number: issue.number, labels, data: new IssueData(data) })
  }
}
