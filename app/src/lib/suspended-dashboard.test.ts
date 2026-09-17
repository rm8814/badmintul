import { describe, expect, it } from 'vitest'

const source = await import('../components/RoleDashboard?raw').then((module) => module.default)

describe('Task 26a suspended dashboard gate', () => {
  it('renders the suspension message before dashboard children', () => {
    expect(source).toContain('user.suspended === true')
    expect(source).toContain('Your account has been suspended')
    expect(source.indexOf('user.suspended === true')).toBeLessThan(source.indexOf('return <AppShell role={role}><main'))
  })
})
