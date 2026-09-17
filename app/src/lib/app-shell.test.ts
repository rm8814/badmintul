import { describe, expect, it } from 'vitest'

const shell = await import('../components/AppShell?raw').then((module) => module.default)
const dashboard = await import('../components/RoleDashboard?raw').then((module) => module.default)

describe('Task 28 authenticated app shell', () => {
  it('provides role navigation and sign out controls', () => {
    expect(shell).toContain('badmintul<span')
    expect(shell).toContain('roleLabels[role]')
    expect(shell).toContain('Signing out…')
    expect(shell).toContain('await signOut()')
    expect(shell).toContain("window.location.replace('/')")
  })

  it('wraps both normal and suspended dashboard states in the shell', () => {
    expect(dashboard).toContain('<AppShell role={role}>')
    expect(dashboard).toContain('user.suspended === true')
  })
})
