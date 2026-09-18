import { describe, expect, it } from 'vitest'

const source = await import('../pages/Landing?raw').then((module) => module.default)

describe('Task 39 public venue discovery cards', () => {
  it('shows location, pricing, availability, and approval information', () => {
    expect(source).toContain('{venue.address}')
    expect(source).toContain('venue.courtCount')
    expect(source).toContain('Live availability')
    expect(source).toContain('venue.lowestPrice')
    expect(source).toContain('Approved')
  })

  it('covers loading, empty, and error states responsively', () => {
    expect(source).toContain('venues === undefined')
    expect(source).toContain('Venue pilihan akan segera hadir.')
    expect(source).toContain('Venue belum dapat dimuat.')
    expect(source).toContain('sm:grid-cols-2 md:grid-cols-3')
  })
})
