import { describe, expect, it } from 'vitest'

const source = await import('../components/VenueOwnerPanel?raw').then((module) => module.default)

describe('Venue owner operations UI', () => {
  it('renders scoped bookings and real stats with loading states', () => {
    expect(source).toContain('api.bookings.listBookingsForMyVenues')
    expect(source).toContain('api.bookings.getMyVenueStats')
    expect(source).toContain('Loading incoming bookings…')
    expect(source).toContain('Loading venue stats…')
    expect(source).toContain('Revenue: IDR')
  })
})
