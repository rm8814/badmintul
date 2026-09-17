import { describe, expect, it } from 'vitest'

const source = await import('../components/PlayerBrowsePanel?raw').then((module) => module.default)

describe('Task 19 availability calendar', () => {
  it('renders a day navigator and responsive availability grid', () => {
    expect(source).toContain('Previous day')
    expect(source).toContain('Next day')
    expect(source).toContain('grid-cols-1')
    expect(source).toContain('sm:grid-cols-2')
    expect(source).toContain('brand-success')
    expect(source).toContain('brand-danger')
  })

  it('keeps the existing booking mutation and pending booking control', () => {
    expect(source).toContain('api.bookings.createBooking')
    expect(source).toContain('disabled={pendingBooking !== null}')
  })
})
