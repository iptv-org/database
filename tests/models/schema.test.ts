import { describe, expect, it } from 'vitest'
import { Channel, City, Feed, Logo } from '../../scripts/models'

describe('model validation schemas', () => {
  it.each([
    () => Channel.prototype.getSchema(),
    () => City.prototype.getSchema(),
    () => Feed.prototype.getSchema(),
    () => Logo.prototype.getSchema()
  ])('reuses the model schema', getSchema => {
    expect(getSchema()).toBe(getSchema())
  })
})
