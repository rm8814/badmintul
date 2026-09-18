import { describe, expect, it } from 'vitest'
import { getRouteTitle, isAuthenticatedRoute } from './route-metadata'

const shell = await import('../components/AppShell?raw').then((module) => module.default)

describe('Tasks 43a and 44a follow-up fixes', () => {
  it('classifies every dashboard sub-route as private dashboard content', () => {
    for (const path of ['/admin/metrics', '/venue-owner/bookings', '/venue-owner/stats']) {
      expect(isAuthenticatedRoute(path)).toBe(true)
      expect(getRouteTitle(path)).toBe('Dashboard — badmintul')
    }
    expect(isAuthenticatedRoute('/support')).toBe(false)
  })

  it('protects the closed sidebar and dismisses the user menu outside its boundary', () => {
    expect(shell).toContain('aria-hidden={!isNavOpen}')
    expect(shell).toContain('userMenuRef.current.contains')
    expect(shell).toContain("event.key === 'Escape'")
    expect(shell).toContain("window.addEventListener('pointerdown'")
  })
})
