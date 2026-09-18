import { describe, expect, it } from 'vitest'

const source = await import('../components/AppShell?raw').then((module) => module.default)

describe('Task 42 sidebar and topbar shell', () => {
  it('defines role-aware navigation and active-page semantics', () => {
    expect(source).toContain('const roleNav')
    expect(source).toContain('aria-current')
    expect(source).toContain('aria-label="Dashboard navigation"')
    expect(source).toContain('roleNav[role]')
  })

  it('provides a mobile drawer and persistent sign-out action', () => {
    expect(source).toContain('Open dashboard navigation')
    expect(source).toContain('Close dashboard navigation overlay')
    expect(source).toContain('lg:hidden')
    expect(source).toContain('await signOut()')
    expect(source).toContain('Signing out…')
  })
})
