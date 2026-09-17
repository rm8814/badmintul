import { describe, expect, it } from 'vitest'

const auth = await import('../components/AuthPanel?raw').then((module) => module.default)
const shell = await import('../components/AppShell?raw').then((module) => module.default)

describe('Task 30 transition feedback', () => {
  it('shows redirect feedback after successful authentication', () => {
    expect(auth).toContain('setIsRedirecting(true)')
    expect(auth).toContain('Redirecting to your dashboard…')
  })

  it('keeps signing-out feedback during awaited navigation', () => {
    expect(shell).toContain('setIsSigningOut(true)')
    expect(shell).toContain('await signOut()')
    expect(shell).toContain('Signing out…')
  })
})
