import { Dictionary } from '@freearhey/core'
import { IssueData, Issue } from '../core'

const FIELDS = new Dictionary({
  'Channel ID': 'channel_id',
  'Channel ID (required)': 'channel_id',
  'Channel ID (optional)': 'channel_id',
  'Channel Name': 'name',
  'Alternative Names': 'alt_names',
  'Alternative Names (optional)': 'alt_names',
  Network: 'network',
  'Network (optional)': 'network',
  Owners: 'owners',
  'Owners (optional)': 'owners',
  Country: 'country',
  Subdivision: 'subdivision',
  'Subdivision (optional)': 'subdivision',
  City: 'city',
  'City (optional)': 'city',
  'Broadcast Area': 'broadcast_area',
  Languages: 'languages',
  Categories: 'categories',
  'Categories (optional)': 'categories',
  NSFW: 'is_nsfw',
  Launched: 'launched',
  'Launched (optional)': 'launched',
  Closed: 'closed',
  'Closed (optional)': 'closed',
  'Replaced By': 'replaced_by',
  'Replaced By (optional)': 'replaced_by',
  Website: 'website',
  'Website (optional)': 'website',
  Logo: 'logo',
  Reason: 'reason',
  Notes: 'notes',
  'Notes (optional)': 'notes',
  Reference: 'ref',
  'Reference (optional)': 'ref',
  'Reference (required)': 'ref'
})

export class IssueParser {
  parse(issue: { number: number; body: string; labels: { name: string }[] }): Issue {
    const fields = issue.body.split('###')

    const data = new Dictionary()
    fields.forEach((field: string) => {
      let [_label, , _value] = field.split(/\r?\n/)
      _label = _label ? _label.trim() : ''
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
