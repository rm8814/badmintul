import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api } from '../../convex/_generated/api'
import schema from '../../convex/schema'

const modules = import.meta.glob('../../convex/**/*.{ts,js}')

describe('Task 12 cross-role access audit', () => {
  it('blocks each role from the other role-only functions', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => {
      const player = await ctx.db.insert('users', { email: 'audit-player@example.com', role: 'player' })
      const owner = await ctx.db.insert('users', { email: 'audit-owner@example.com', role: 'venueOwner' })
      const admin = await ctx.db.insert('users', { email: 'audit-admin@example.com', role: 'superadmin' })
      const venue = await ctx.db.insert('venues', { ownerId: owner, name: 'Audit venue', address: 'Address', description: '', photos: [], approvalStatus: 'approved' })
      const court = await ctx.db.insert('courts', { venueId: venue, name: 'Court', pricePerHour: 100, operatingHours: { open: '08:00', close: '22:00' } })
      return { player, owner, admin, court }
    })
    const player = t.withIdentity({ subject: ids.player })
    const owner = t.withIdentity({ subject: ids.owner })
    const admin = t.withIdentity({ subject: ids.admin })
    await expect(player.query(api.venues.listMyVenues, {})).rejects.toThrow('Venue owner role required')
    await expect(player.query(api.admin.getMetrics, {})).rejects.toThrow('Superadmin role required')
    await expect(owner.query(api.admin.listPendingVenues, {})).rejects.toThrow('Superadmin role required')
    await expect(owner.mutation(api.bookings.createBooking, { courtId: ids.court, startTime: Date.now() + 86400000, endTime: Date.now() + 90000000 })).rejects.toThrow('Player role required')
    await expect(admin.query(api.venues.listMyVenues, {})).rejects.toThrow('Venue owner role required')
    await expect(admin.query(api.bookings.listMyBookings, {})).rejects.toThrow('Player role required')
  })
})
