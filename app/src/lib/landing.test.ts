import { describe, expect, it } from 'vitest'

const landingSource = await import('../pages/Landing?raw').then((module) => module.default)
const appSource = await import('../App?raw').then((module) => module.default)

describe('Task 9 public landing page', () => {
  it('uses the light branded landing layout and role value propositions', () => {
    expect(landingSource).toContain('bg-brand-bg')
    expect(landingSource).toContain('text-brand-primary')
    expect(landingSource).toContain('text-brand-accent')
    expect(landingSource).toContain('Punya venue badminton?')
    expect(landingSource).toContain('Tiga langkah')
  })

  it('routes the public root to Landing and exposes auth links', () => {
    expect(appSource).toContain("path === '/'")
    expect(landingSource).toContain('href="/signup"')
    expect(landingSource).toContain('href="/login"')
  })
})
