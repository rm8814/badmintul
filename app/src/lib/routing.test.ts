import { describe, expect, it } from 'vitest'

const appSource = await import('../App?raw').then((module) => module.default)
const routeSource = await import('../components/RoleDashboard?raw').then((module) => module.default)
const authSource = await import('../components/AuthPanel?raw').then((module) => module.default)

describe('Task 13 role dashboard routing', () => {
  it('defines a distinct route for each role dashboard', () => {
    expect(appSource).toContain("path === '/player'")
    expect(appSource).toContain("path === '/venue-owner'")
    expect(appSource).toContain("path === '/admin'")
    expect(appSource).toContain("<RoleDashboard role=\"player\">")
    expect(appSource).toContain("<RoleDashboard role=\"venueOwner\">")
    expect(appSource).toContain("<RoleDashboard role=\"superadmin\">")
  })

  it('redirects unauthenticated and mismatched users', () => {
    expect(routeSource).toContain("window.location.replace('/login')")
    expect(routeSource).toContain("window.location.replace('/')")
    expect(routeSource).toContain('user.role !== role')
  })

  it('redirects authenticated users to their role dashboard after auth', () => {
    expect(authSource).toContain("user.role === 'venueOwner' ? '/venue-owner'")
    expect(authSource).toContain("user.role === 'superadmin' ? '/admin' : '/player'")
  })
})
