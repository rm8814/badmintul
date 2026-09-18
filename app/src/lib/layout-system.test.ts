import { describe, expect, it } from 'vitest'

const roleDashboard = await import('../components/RoleDashboard?raw').then((module) => module.default)
const shell = await import('../components/AppShell?raw').then((module) => module.default)
const home = await import('../pages/Home?raw').then((module) => module.default)

describe('Task 34 responsive layout system', () => {
  it('uses a shared content-container across public and authenticated wrappers', () => {
    expect(home).toContain('content-container')
    expect(roleDashboard).toContain('content-container flex')
    expect(shell).toContain('content-container flex')
  })

  it('keeps responsive page padding and no fixed narrow dashboard width', () => {
    expect(roleDashboard).toContain('px-4 py-8 sm:px-8 sm:py-10')
    expect(roleDashboard).not.toContain('max-w-4xl')
  })
})
