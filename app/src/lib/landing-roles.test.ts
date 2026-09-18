import { describe, expect, it } from 'vitest'

const source = await import('../pages/Landing?raw').then((module) => module.default)

describe('Task 37 role value sections', () => {
  it('explains player and venue-owner benefits with distinct CTAs', () => {
    expect(source).toContain('Untuk pemain')
    expect(source).toContain('Untuk pemilik venue')
    expect(source).toContain('Lihat slot live.')
    expect(source).toContain('Kelola ketersediaan.')
    expect(source).toContain('Cari lapangan')
    expect(source).toContain('Daftarkan venue')
  })

  it('uses a responsive two-column role layout', () => {
    expect(source).toContain('grid gap-5 md:grid-cols-2')
  })
})
