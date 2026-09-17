import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api } from '../../convex/_generated/api'
import schema from '../../convex/schema'

const modules = import.meta.glob('../../convex/**/*.{ts,js}')

describe('Tasks 24 and 25 venue operations', () => {
  it('returns bookings only for the authenticated owner venues', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => {
      const ownerA = await ctx.db.insert('users', { email: 'ops-a@example.com', role: 'venueOwner' })
      const ownerB = await ctx.db.insert('users', { email: 'ops-b@example.com', role: 'venueOwner' })
      const player = await ctx.db.insert('users', { email: 'ops-player@example.com', role: 'player' })
      const venueA = await ctx.db.insert('venues', { ownerId: ownerA, name: 'A', address: 'A', description: '', photos: [], approvalStatus: 'approved' })
      const venueB = await ctx.db.insert('venues', { ownerId: ownerB, name: 'B', address: 'B', description: '', photos: [], approvalStatus: 'approved' })
      const courtA = await ctx.db.insert('courts', { venueId: venueA, name: 'A court', pricePerHour: 250, operatingHours: { open: '08:00', close: '22:00' } })
      const courtB = await ctx.db.insert('courts', { venueId: venueB, name: 'B court', pricePerHour: 250, operatingHours: { open: '08:00', close: '22:00' } })
      const bookingA = await ctx.db.insert('bookings', { courtId: courtA, playerId: player, startTime: 1000, endTime: 3601000, status: 'confirmed' })
      await ctx.db.insert('bookings', { courtId: courtB, playerId: player, startTime: 2000, endTime: 3602000, status: 'confirmed' })
      return { ownerA, bookingA }
    })
    const bookings = await t.withIdentity({ subject: ids.ownerA }).query(api.bookings.listBookingsForMyVenues, {})
    expect(bookings).toHaveLength(1)
    expect(bookings[0]._id).toBe(ids.bookingA)
    expect(bookings[0].venueName).toBe('A')
  })

  it('computes exact confirmed revenue for each owned venue', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => {
      const owner = await ctx.db.insert('users', { email: 'stats-owner@example.com', role: 'venueOwner' })
      const player = await ctx.db.insert('users', { email: 'stats-player@example.com', role: 'player' })
      const venue = await ctx.db.insert('venues', { ownerId: owner, name: 'Stats venue', address: 'A', description: '', photos: [], approvalStatus: 'approved' })
      const court = await ctx.db.insert('courts', { venueId: venue, name: 'Court', pricePerHour: 250, operatingHours: { open: '08:00', close: '22:00' } })
      await ctx.db.insert('bookings', { courtId: court, playerId: player, startTime: Date.now() + 86400000, endTime: Date.now() + 90000000, status: 'confirmed' })
      await ctx.db.insert('bookings', { courtId: court, playerId: player, startTime: Date.now() + 172800000, endTime: Date.now() + 176400000, status: 'confirmed' })
      await ctx.db.insert('bookings', { courtId: court, playerId: player, startTime: Date.now() + 259200000, endTime: Date.now() + 262800000, status: 'confirmed' })
      return { owner, venue }
    })
    const stats = await t.withIdentity({ subject: ids.owner }).query(api.bookings.getMyVenueStats, {})
    expect(stats).toMatchObject([{ venueId: ids.venue, revenue: 750 }])
  })
})
