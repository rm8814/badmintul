import { convexTest } from 'convex-test'
import { describe, expect, it, vi } from 'vitest'
import { api } from '../../convex/_generated/api'
import schema from '../../convex/schema'

const modules = import.meta.glob('../../convex/**/*.{ts,js}')

async function setup(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const player = await ctx.db.insert('users', { email: `player-${Math.random()}@example.com`, role: 'player' })
    const venue = await ctx.db.insert('venues', { ownerId: player, name: 'Venue', address: 'Address', description: '', photos: [], approvalStatus: 'approved' })
    const court = await ctx.db.insert('courts', { venueId: venue, name: 'Court', pricePerHour: 100, operatingHours: { open: '08:00', close: '22:00' } })
    return { player, court }
  })
}

describe('Task 8 booking flow', () => {
  it('allows exactly one of two concurrent bookings for the same slot', async () => {
    const t = convexTest(schema, modules)
    const { court } = await setup(t)
    const playerA = await t.run((ctx) => ctx.db.insert('users', { email: 'player-a@example.com', role: 'player' }))
    const playerB = await t.run((ctx) => ctx.db.insert('users', { email: 'player-b@example.com', role: 'player' }))
    const start = Date.now() + 86400000
    const results = await Promise.allSettled([
      t.withIdentity({ subject: playerA }).mutation(api.bookings.createBooking, { courtId: court, startTime: start, endTime: start + 3600000 }),
      t.withIdentity({ subject: playerB }).mutation(api.bookings.createBooking, { courtId: court, startTime: start, endTime: start + 3600000 }),
    ])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
  })

  it('rejects cancelling another player booking and cancellation inside the window', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-16T10:00:00Z'))
    const t = convexTest(schema, modules)
    const { court, player } = await setup(t)
    const otherPlayer = await t.run((ctx) => ctx.db.insert('users', { email: 'other@example.com', role: 'player' }))
    const booking = await t.withIdentity({ subject: player }).mutation(api.bookings.createBooking, { courtId: court, startTime: Date.now() + 3600000, endTime: Date.now() + 7200000 })
    await expect(t.withIdentity({ subject: otherPlayer }).mutation(api.bookings.cancelBooking, { bookingId: booking })).rejects.toThrow('does not belong')
    await expect(t.withIdentity({ subject: player }).mutation(api.bookings.cancelBooking, { bookingId: booking })).rejects.toThrow('at least 2 hours')
    vi.useRealTimers()
  })
})
