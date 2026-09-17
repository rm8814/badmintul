import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api } from '../../convex/_generated/api'
import schema from '../../convex/schema'

const modules = import.meta.glob('../../convex/**/*.{ts,js}')

describe('Task 7 approved venue browse', () => {
  it('returns approved venues and excludes pending venues', async () => {
    const t = convexTest(schema, modules)
    const ownerId = await t.run((ctx) => ctx.db.insert('users', { email: 'browse-owner@example.com', role: 'venueOwner' }))
    const venueId = await t.withIdentity({ subject: ownerId }).mutation(api.venues.createVenueWithCourts, { name: 'Pending venue', address: 'Address', description: '', photos: [], courts: [{ name: 'Court 1', pricePerHour: 100, operatingHours: { open: '08:00', close: '22:00' } }] })
    expect((await t.query(api.venues.listApprovedVenues, {})).map((venue) => venue._id)).not.toContain(venueId)
    await t.run((ctx) => ctx.db.patch(venueId, { approvalStatus: 'approved' }))
    expect((await t.query(api.venues.listApprovedVenues, {})).map((venue) => venue._id)).toContain(venueId)
  })

  it('reads confirmed bookings for the selected court and day', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => {
      const owner = await ctx.db.insert('users', { email: 'availability-owner@example.com', role: 'venueOwner' })
      const venue = await ctx.db.insert('venues', { ownerId: owner, name: 'Approved', address: 'Address', description: '', photos: [], approvalStatus: 'approved' })
      const court = await ctx.db.insert('courts', { venueId: venue, name: 'Court', pricePerHour: 100, operatingHours: { open: '08:00', close: '22:00' } })
      const player = await ctx.db.insert('users', { email: 'availability-player@example.com', role: 'player' })
      const booking = await ctx.db.insert('bookings', { courtId: court, playerId: player, startTime: 1000, endTime: 2000, status: 'confirmed' })
      return { court, booking }
    })
    expect(await t.query(api.bookings.getCourtAvailability, { courtId: ids.court, dayStart: 0, dayEnd: 3000 })).toMatchObject([{ _id: ids.booking, status: 'confirmed' }])
  })
})
