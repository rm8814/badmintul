import { describe, expect, it } from 'vitest'

const appSource = await import('../App?raw').then((module) => module.default)
const shellSource = await import('../components/AppShell?raw').then((module) => module.default)
const panelSource = await import('../components/SuperadminPanel?raw').then((module) => module.default)

describe('Task 48 superadmin venue moderation', () => {
  it('routes the venues view and exposes the role-specific navigation item', () => {
    expect(appSource).toContain("'/admin/venues'")
    expect(shellSource).toContain("{ label: 'Venues', href: '/admin/venues', icon: BuildingIcon }")
    expect(panelSource).toContain("view === 'venues'")
  })

  it('connects venue suspend controls to the existing admin mutation', () => {
    expect(panelSource).toContain('api.admin.listAllVenues')
    expect(panelSource).toContain('api.admin.setVenueSuspended')
    expect(panelSource).toContain('Suspend')
    expect(panelSource).toContain('Unsuspend')
  })
})
