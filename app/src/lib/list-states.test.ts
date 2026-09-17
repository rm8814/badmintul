import { describe, expect, it } from 'vitest'

const sources = await Promise.all([
  import('../components/VenueOwnerPanel?raw').then((module) => module.default),
  import('../components/SuperadminPanel?raw').then((module) => module.default),
  import('../components/PlayerBrowsePanel?raw').then((module) => module.default),
])

describe('Task 20 dashboard list states', () => {
  it('renders explicit loading states for each list query', () => {
    expect(sources[0]).toContain('Loading your venues…')
    expect(sources[1]).toContain('Loading approval queue…')
    expect(sources[2]).toContain('Loading your bookings…')
  })

  it('provides role-specific empty-state actions and uses Card layouts', () => {
    expect(sources[0]).toContain('Submit your first venue')
    expect(sources[1]).toContain('No pending venues.')
    expect(sources[2]).toContain('Browse venues to book a court')
    expect(sources[0]).toContain('<Card')
    expect(sources[1]).toContain("import Card from './ui/Card'")
    expect(sources[2]).toContain('<Card')
  })
})
