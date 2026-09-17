import { describe, expect, it } from 'vitest'

const shell = await import('../components/AppShell?raw').then((module) => module.default)
const dashboard = await import('../components/RoleDashboard?raw').then((module) => module.default)

describe('Task 28a deterministic sign-out navigation', () => {
  it('marks sign-out before auth state can trigger the dashboard redirect', () => {
    expect(shell.indexOf('markSignOutInProgress()')).toBeLessThan(shell.indexOf('await signOut()'))
    expect(dashboard).toContain('if (signOutInProgress || isLoading')
    expect(dashboard).toContain("window.location.replace('/login')")
    expect(dashboard).toContain("window.location.replace('/')")
  })
})
