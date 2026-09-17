import { describe, expect, it } from 'vitest'

const source = await import('../components/PlayerBrowsePanel?raw').then((module) => module.default)

describe('Task 15a booking history timezone', () => {
  it('formats booking history with the explicit WIB formatter', () => {
    expect(source).toContain('{formatWibTime(booking.startTime)} WIB')
    expect(source).not.toContain('booking.startTime).toLocaleString()')
  })
})
