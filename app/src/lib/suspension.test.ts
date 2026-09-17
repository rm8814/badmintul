import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api } from '../../convex/_generated/api'
import schema from '../../convex/schema'

const modules = import.meta.glob('../../convex/**/*.{ts,js}')

describe('Task 26 suspension enforcement', () => {
  it('hides a suspended approved venue from player browse and supports unsuspend', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => {
      const admin = await ctx.db.insert('users', { email: 'suspend-admin@example.com', role: 'superadmin' })
      const owner = await ctx.db.insert('users', { email: 'suspend-owner@example.com', role: 'venueOwner' })
      const venue = await ctx.db.insert('venues', { ownerId: owner, name: 'Suspended venue', address: 'A', description: '', photos: [], approvalStatus: 'approved' })
      return { admin, venue }
    })
    const admin = t.withIdentity({ subject: ids.admin })
    expect((await t.query(api.venues.listApprovedVenues, {})).map((venue) => venue._id)).toContain(ids.venue)
    await admin.mutation(api.admin.setVenueSuspended, { venueId: ids.venue, suspended: true })
    expect((await t.query(api.venues.listApprovedVenues, {})).map((venue) => venue._id)).not.toContain(ids.venue)
    await admin.mutation(api.admin.setVenueSuspended, { venueId: ids.venue, suspended: false })
    expect((await t.query(api.venues.listApprovedVenues, {})).map((venue) => venue._id)).toContain(ids.venue)
  })

  it('rejects a suspended user with an existing identity and blocks non-admin moderation', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => {
      const admin = await ctx.db.insert('users', { email: 'suspend-admin-2@example.com', role: 'superadmin' })
      const player = await ctx.db.insert('users', { email: 'suspend-player@example.com', role: 'player' })
      return { admin, player }
    })
    const admin = t.withIdentity({ subject: ids.admin })
    await admin.mutation(api.admin.setUserSuspended, { userId: ids.player, suspended: true })
    await expect(t.withIdentity({ subject: ids.player }).query(api.bookings.listMyBookings, {})).rejects.toThrow('suspended')
    await expect(t.withIdentity({ subject: ids.player }).mutation(api.admin.setUserSuspended, { userId: ids.player, suspended: false })).rejects.toThrow('Superadmin role required')
  })
})
