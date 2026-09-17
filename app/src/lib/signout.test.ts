import { describe, expect, it } from 'vitest'

const source = await import('../components/AuthPanel?raw').then((module) => module.default)

describe('stale authenticated session sign out', () => {
  it('awaits sign out before navigating, so the local token is actually cleared before leaving the page', () => {
    expect(source).toContain('async function signOutAndReturnToLogin()')
    expect(source).toContain('await signOut()')
    expect(source).not.toContain('void signOut()')
    expect(source).toContain("window.location.replace('/')")
  })

  it('shows a pending state and disables the button while signing out', () => {
    expect(source).toContain('isSigningOut')
    expect(source).toContain("disabled={isSigningOut}")
    expect(source).toContain("'Signing out…'")
  })
})
