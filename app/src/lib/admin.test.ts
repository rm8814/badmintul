import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api } from '../../convex/_generated/api'
import schema from '../../convex/schema'

const modules = import.meta.glob('../../convex/**/*.{ts,js}')

describe('Task 6 superadmin boundary', () => {
  it('rejects a player from the approval queue and metrics', async () => {
    const t = convexTest(schema, modules)
    const playerId = await t.run((ctx) => ctx.db.insert('users', { email: 'player-admin-test@example.com', role: 'player' }))
    const asPlayer = t.withIdentity({ subject: playerId })
    await expect(asPlayer.query(api.admin.listPendingVenues, {})).rejects.toThrow('Superadmin role required')
    await expect(asPlayer.query(api.admin.getMetrics, {})).rejects.toThrow('Superadmin role required')
  })

  it('lets a superadmin approve a pending venue', async () => {
    const t = convexTest(schema, modules)
    const ownerId = await t.run((ctx) => ctx.db.insert('users', { email: 'venue-admin-test@example.com', role: 'venueOwner' }))
    const adminId = await t.run((ctx) => ctx.db.insert('users', { email: 'admin-test@example.com', role: 'superadmin' }))
    const venueId = await t.withIdentity({ subject: ownerId }).mutation(api.venues.createVenueWithCourts, { name: 'Approval venue', address: 'Address', description: '', photos: [], city: 'Jakarta', courts: [{ name: 'Court 1', pricePerHour: 100, operatingHours: { open: '08:00', close: '22:00' } }] })
    const admin = t.withIdentity({ subject: adminId })
    expect((await admin.query(api.admin.listPendingVenues, {})).map((venue) => venue._id)).toContain(venueId)
    await admin.mutation(api.admin.setVenueApproval, { venueId, status: 'approved' })
    expect((await admin.query(api.admin.listPendingVenues, {})).map((venue) => venue._id)).not.toContain(venueId)
  })

  it('lists all venue statuses for superadmins and enforces suspension in public browse', async () => {
    const t = convexTest(schema, modules)
    const ownerId = await t.run((ctx) => ctx.db.insert('users', { email: 'all-venues-owner@example.com', role: 'venueOwner' }))
    const adminId = await t.run((ctx) => ctx.db.insert('users', { email: 'all-venues-admin@example.com', role: 'superadmin' }))
    const venueId = await t.run((ctx) => ctx.db.insert('venues', { ownerId, name: 'Rejected venue', address: 'Address', description: '', photos: [], approvalStatus: 'rejected' }))
    const approvedId = await t.run((ctx) => ctx.db.insert('venues', { ownerId, name: 'Approved venue', address: 'Address', description: '', photos: [], approvalStatus: 'approved' }))
    const player = t.withIdentity({ subject: ownerId })
    await expect(player.query(api.admin.listAllVenues, {})).rejects.toThrow('Superadmin role required')
    const admin = t.withIdentity({ subject: adminId })
    expect((await admin.query(api.admin.listAllVenues, {})).map((venue) => venue._id)).toEqual(expect.arrayContaining([venueId, approvedId]))
    await admin.mutation(api.admin.setVenueSuspended, { venueId: approvedId, suspended: true })
    expect((await t.query(api.venues.listApprovedVenues, {})).map((venue) => venue._id)).not.toContain(approvedId)
  })

  it('returns only the minimal user moderation shape and rejects non-admins', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => ({
      admin: await ctx.db.insert('users', { email: 'users-admin@example.com', role: 'superadmin', name: 'Admin Name', phone: '123' }),
      player: await ctx.db.insert('users', { email: 'users-player@example.com', role: 'player', name: 'Player Name', phone: '456', suspended: true }),
    }))
    await expect(t.withIdentity({ subject: ids.player }).query(api.admin.listUsers, {})).rejects.toThrow('Superadmin role required')
    await expect(t.withIdentity({ subject: ids.player }).mutation(api.admin.setUserSuspended, { userId: ids.player, suspended: false })).rejects.toThrow('Superadmin role required')
    const listed = await t.withIdentity({ subject: ids.admin }).query(api.admin.listUsers, {})
    const player = listed.find((user) => user._id === ids.player)
    expect(player).toEqual({ _id: ids.player, email: 'users-player@example.com', role: 'player', suspended: true })
    expect(Object.keys(player ?? {}).sort()).toEqual(['_id', 'email', 'role', 'suspended'])
    await t.withIdentity({ subject: ids.admin }).mutation(api.admin.setUserSuspended, { userId: ids.player, suspended: true })
    await expect(t.withIdentity({ subject: ids.player }).query(api.bookings.listMyBookings, {})).rejects.toThrow('suspended')
  })

  it('rejects a superadmin attempting to suspend their own account', async () => {
    const t = convexTest(schema, modules)
    const adminId = await t.run((ctx) => ctx.db.insert('users', { email: 'self-suspend-admin@example.com', role: 'superadmin' }))
    await expect(t.withIdentity({ subject: adminId }).mutation(api.admin.setUserSuspended, { userId: adminId, suspended: true })).rejects.toThrow('cannot suspend their own account')
  })
})
