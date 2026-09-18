import { describe, expect, it } from 'vitest'

const appSource = await import('../App?raw').then((module) => module.default)
const shellSource = await import('../components/AppShell?raw').then((module) => module.default)
const ownerSource = await import('../components/VenueOwnerPanel?raw').then((module) => module.default)
const adminSource = await import('../components/SuperadminPanel?raw').then((module) => module.default)

describe('Task 43 split dashboard routes', () => {
  it('routes every sidebar destination to a distinct real view', () => {
    for (const path of ['/venue-owner', '/venue-owner/bookings', '/venue-owner/stats', '/admin', '/admin/metrics']) {
      expect(appSource).toContain(`'${path}'`)
      expect(shellSource).toContain(`href: '${path}'`)
    }
  })

  it('keeps each existing query-backed role view behind an explicit view prop', () => {
    expect(ownerSource).toContain("view === 'overview'")
    expect(ownerSource).toContain("view === 'bookings'")
    expect(ownerSource).toContain("view === 'stats'")
    expect(adminSource).toContain("view === 'queue'")
    expect(adminSource).toContain("view === 'metrics'")
  })
})
