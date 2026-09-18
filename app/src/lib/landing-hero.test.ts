import { describe, expect, it } from 'vitest'

const source = await import('../pages/Landing?raw').then((module) => module.default)

describe('Task 36 conversion landing hero', () => {
  it('has a clear primary and secondary role CTA', () => {
    expect(source).toContain('Booking lapangan')
    expect(source).toContain('Daftarkan venue')
    expect(source).toContain('Temukan waktu main yang pas')
  })

  it('keeps the hero responsive and visually structured', () => {
    expect(source).toContain('md:grid-cols-[1.05fr_.95fr]')
    expect(source).toContain('sm:flex-row')
    expect(source).toContain('content-container')
  })
})
