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
  City: 'city',
  'Broadcast Area': 'broadcast_area',
  Timezones: 'timezones',
  Format: 'video_format',
  Languages: 'languages',
  Categories: 'categories',
  NSFW: 'is_nsfw',
  Launched: 'launched',
  Closed: 'closed',
  'Replaced By': 'replaced_by',
  Website: 'website',
  Logo: 'logo',
  Reason: 'reason',
  Notes: 'notes',
  Reference: 'ref'
})

export class IssueParser {
  parse(issue: { number: number; body: string; labels: { name: string }[] }): Issue {
    if (!issue.body) throw new Error('Issue body is missing')

    const fields = issue.body.split('###')

    const data = new Dictionary()
    fields.forEach((field: string) => {
      let [_label, , _value] = field.split(/\r?\n/)
      _label = _label ? _label.replace(/ \(optional\)| \(required\)/, '').trim() : ''
      _value = _value ? _value.trim() : ''

      if (!_label || !_value) return data

      const id: string = FIELDS.get(_label)
      const value: string | undefined =
        _value === '_No response_' || _value === 'None' ? undefined : _value

      if (!id) return

      data.set(id, value)
    })

    const labels = issue.labels.map(label => label.name)

    return new Issue({ number: issue.number, labels, data: new IssueData(data) })
  }
}
