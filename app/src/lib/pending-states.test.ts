import { describe, expect, it } from 'vitest'

const sources = await Promise.all([
  import('../components/AuthPanel?raw').then((module) => module.default),
  import('../components/VenueOwnerPanel?raw').then((module) => module.default),
  import('../components/SuperadminPanel?raw').then((module) => module.default),
  import('../components/PlayerBrowsePanel?raw').then((module) => module.default),
])

describe('Task 18 mutation pending states', () => {
  it('disables each mutation control and changes its label while pending', () => {
    expect(sources[0]).toContain('disabled={isSubmitting}')
    expect(sources[0]).toContain('Submitting…')
    expect(sources[1]).toContain('disabled={isSubmitting}')
    expect(sources[1]).toContain('Submitting…')
    expect(sources[2]).toContain('disabled={pendingAction !== null}')
    expect(sources[2]).toContain('Approving…')
    expect(sources[2]).toContain('Rejecting…')
    expect(sources[3]).toContain('disabled={pendingBooking !== null}')
    expect(sources[3]).toContain('Booking…')
  })
})
