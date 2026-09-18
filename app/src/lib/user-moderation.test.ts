import { describe, expect, it } from 'vitest'

const appSource = await import('../App?raw').then((module) => module.default)
const shellSource = await import('../components/AppShell?raw').then((module) => module.default)
const panelSource = await import('../components/SuperadminPanel?raw').then((module) => module.default)

describe('Task 49 superadmin user moderation', () => {
  it('routes and labels the users view', () => {
    expect(appSource).toContain("'/admin/users'")
    expect(shellSource).toContain("{ label: 'Users', href: '/admin/users' }")
    expect(panelSource).toContain("view === 'users'")
  })

  it('connects minimal user records to suspend controls', () => {
    expect(panelSource).toContain('api.admin.listUsers')
    expect(panelSource).toContain('api.admin.setUserSuspended')
    expect(panelSource).toContain('listedUser.email')
    expect(panelSource).toContain('listedUser.role')
    expect(panelSource).toContain('Unsuspend')
  })
})
