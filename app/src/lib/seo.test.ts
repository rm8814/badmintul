import { describe, expect, it } from 'vitest'

const htmlSource = await import('../../index.html?raw').then((module) => module.default)
const appSource = await import('../App?raw').then((module) => module.default)

describe('Task 41 SEO and social sharing readiness', () => {
  it('includes complete landing metadata and structured website data', () => {
    expect(htmlSource).toContain('<html lang="id">')
    expect(htmlSource).toContain('name="description"')
    expect(htmlSource).toContain('rel="canonical" href="https://badmintul.com/"')
    expect(htmlSource).toContain('property="og:title"')
    expect(htmlSource).toContain('property="og:description"')
    expect(htmlSource).toContain('property="og:image"')
    expect(htmlSource).toContain('name="twitter:card"')
    expect(htmlSource).toContain('application/ld+json')
    expect(htmlSource).toContain('badmintul — Booking lapangan badminton')
  })

  it('marks authenticated routes noindex at runtime and updates canonical metadata', () => {
    expect(appSource).toContain("'noindex, nofollow'")
    expect(appSource).toContain("document.title = title")
    expect(appSource).toContain('https://badmintul.com${path')
  })
})
