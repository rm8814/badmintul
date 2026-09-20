import { describe, expect, it } from 'vitest'

const appSource = await import('../App?raw').then((module) => module.default)
const shellSource = await import('../components/AppShell?raw').then((module) => module.default)
const panelSource = await import('../components/VenueOwnerPanel?raw').then((module) => module.default)

describe('Task 47 venue availability management', () => {
  it('routes and labels the owner availability destination', () => {
    expect(appSource).toContain("'/venue-owner/availability'")
    expect(shellSource).toContain("{ label: 'Availability', href: '/venue-owner/availability', icon: ClockIcon }")
    expect(panelSource).toContain("view === 'availability'")
  })

  it('connects the form to existing block mutations and surfaces errors', () => {
    expect(panelSource).toContain('api.venues.listBlocksForMyVenues')
    expect(panelSource).toContain('api.venues.createCourtBlock')
    expect(panelSource).toContain('api.venues.removeCourtBlock')
    expect(panelSource).toContain('role="alert"')
    expect(panelSource).toContain('caught instanceof Error ? caught.message')
  })
})
