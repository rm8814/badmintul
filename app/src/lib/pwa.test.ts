import { describe, expect, it } from 'vitest'

const configSource = await import('../../vite.config?raw').then((module) => module.default)
const icon192 = await import('../../public/pwa-icon-192.svg?raw').then((module) => module.default)
const icon512 = await import('../../public/pwa-icon-512.svg?raw').then((module) => module.default)

describe('Task 10 PWA setup', () => {
  it('configures standalone metadata and app-shell caching', () => {
    expect(configSource).toContain("display: 'standalone'")
    expect(configSource).toContain("theme_color: '#7c3aed'")
    expect(configSource).toContain("background_color: '#fafafa'")
    expect(configSource).toContain("globPatterns: ['**/*.{js,css,html,svg,png,ico}']")
  })
  it('provides both required icon sizes', () => {
    expect(configSource).toContain("sizes: '192x192'")
    expect(configSource).toContain("sizes: '512x512'")
    expect(icon192).toContain('<svg')
    expect(icon512).toContain('<svg')
  })
})
