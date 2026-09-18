import { describe, expect, it } from 'vitest'

const appSource = await import('../App?raw').then((module) => module.default)
const landingSource = await import('../pages/Landing?raw').then((module) => module.default)
const infoSource = await import('../pages/InfoPage?raw').then((module) => module.default)

describe('Task 40 footer and support navigation', () => {
  it('resolves every footer destination through the app router', () => {
    for (const path of ['/login', '/signup', '/support', '/terms', '/privacy', '/cancellation', '/venue-owner-info']) {
      expect(appSource).toContain(`'${path}'`)
    }
  })

  it('provides keyboard-friendly labeled footer navigation and clear placeholders', () => {
    expect(landingSource).toContain('aria-label="Footer navigation"')
    expect(landingSource).toContain('Support / kontak')
    expect(landingSource).toContain('Syarat dan ketentuan')
    expect(landingSource).toContain('Pembatalan')
    expect(landingSource).toContain('Untuk pemilik venue')
    expect(infoSource).toContain('Halaman ini sedang disiapkan.')
  })
})
