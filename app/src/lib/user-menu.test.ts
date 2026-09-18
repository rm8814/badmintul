import { describe, expect, it } from 'vitest'

const source = await import('../components/AppShell?raw').then((module) => module.default)

describe('Task 44 topbar user menu', () => {
  it('provides a role menu with keyboard and mouse close behavior', () => {
    expect(source).toContain('aria-haspopup="menu"')
    expect(source).toContain('aria-expanded={isUserMenuOpen}')
    expect(source).toContain('role="menu"')
    expect(source).toContain('role="menuitem"')
    expect(source).toContain("event.key === 'Escape'")
  })

  it('keeps the race-safe sign-out flow inside the menu', () => {
    expect(source).toContain('await signOut()')
    expect(source).toContain('markSignOutInProgress()')
    expect(source).toContain("window.location.replace('/')")
    expect(source).toContain('Signing out…')
    expect(source).not.toContain('notification')
    expect(source).not.toContain('search')
  })
})
