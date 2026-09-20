import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api } from '../../convex/_generated/api'
import schema from '../../convex/schema'

const modules = import.meta.glob('../../convex/**/*.{ts,js}')

describe('Superadmin view-as (impersonation)', () => {
  it('rejects a non-superadmin trying to act as another user', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => ({
      attacker: await ctx.db.insert('users', { email: 'attacker@example.com', role: 'player' }),
      victim: await ctx.db.insert('users', { email: 'victim@example.com', role: 'player' }),
    }))
    await expect(t.withIdentity({ subject: ids.attacker }).query(api.bookings.listMyBookings, { asUserId: ids.victim })).rejects.toThrow('Only superadmins can act on behalf of another user')
  })

  it('rejects impersonating a user who does not hold the target role', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => ({
      admin: await ctx.db.insert('users', { email: 'ia-admin@example.com', role: 'superadmin' }),
      owner: await ctx.db.insert('users', { email: 'ia-owner@example.com', role: 'venueOwner' }),
    }))
    await expect(t.withIdentity({ subject: ids.admin }).query(api.bookings.listMyBookings, { asUserId: ids.owner })).rejects.toThrow('Target user is not a player')
  })

  it('rejects impersonating a suspended account', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => ({
      admin: await ctx.db.insert('users', { email: 'ia-admin2@example.com', role: 'superadmin' }),
      player: await ctx.db.insert('users', { email: 'ia-player-suspended@example.com', role: 'player', suspended: true }),
    }))
    await expect(t.withIdentity({ subject: ids.admin }).query(api.bookings.listMyBookings, { asUserId: ids.player })).rejects.toThrow('Cannot impersonate a suspended account')
  })

  it('rejects a suspended superadmin from impersonating anyone', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => ({
      admin: await ctx.db.insert('users', { email: 'ia-admin3@example.com', role: 'superadmin', suspended: true }),
      player: await ctx.db.insert('users', { email: 'ia-player3@example.com', role: 'player' }),
    }))
    await expect(t.withIdentity({ subject: ids.admin }).query(api.bookings.listMyBookings, { asUserId: ids.player })).rejects.toThrow('User account is suspended')
  })

  it('lets a superadmin create a booking on behalf of a player, attributed to the player and logged', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => {
      const admin = await ctx.db.insert('users', { email: 'ia-admin4@example.com', role: 'superadmin' })
      const player = await ctx.db.insert('users', { email: 'ia-player4@example.com', role: 'player' })
      const owner = await ctx.db.insert('users', { email: 'ia-owner4@example.com', role: 'venueOwner' })
      const venue = await ctx.db.insert('venues', { ownerId: owner, name: 'IA Venue', address: 'Addr', description: '', photos: [], approvalStatus: 'approved', city: 'Jakarta' })
      const court = await ctx.db.insert('courts', { venueId: venue, name: 'Court 1', pricePerHour: 100, operatingHours: { open: '00:00', close: '23:59' } })
      return { admin, player, owner, venue, court }
    })
    const startTime = Date.now() + 3600000
    const bookingId = await t.withIdentity({ subject: ids.admin }).mutation(api.bookings.createBooking, { courtId: ids.court, startTime, endTime: startTime + 3600000, asUserId: ids.player })
    const booking = await t.run((ctx) => ctx.db.get(bookingId))
    expect(booking?.playerId).toBe(ids.player)
    const logs = await t.run((ctx) => ctx.db.query('impersonationLogs').withIndex('by_actorId', (q) => q.eq('actorId', ids.admin)).collect())
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({ actorId: ids.admin, targetUserId: ids.player, action: 'createBooking' })
  })

  it('lets a superadmin manage venues on behalf of a venue owner', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => ({
      admin: await ctx.db.insert('users', { email: 'ia-admin5@example.com', role: 'superadmin' }),
      owner: await ctx.db.insert('users', { email: 'ia-owner5@example.com', role: 'venueOwner' }),
    }))
    const venueId = await t.withIdentity({ subject: ids.admin }).mutation(api.venues.createVenueWithCourts, { name: 'Impersonated venue', address: 'Addr', description: '', photos: [], city: 'Jakarta', asUserId: ids.owner, courts: [{ name: 'Court 1', pricePerHour: 100, operatingHours: { open: '08:00', close: '22:00' } }] })
    const venue = await t.run((ctx) => ctx.db.get(venueId))
    expect(venue?.ownerId).toBe(ids.owner)
    const listed = await t.withIdentity({ subject: ids.admin }).query(api.venues.listMyVenues, { asUserId: ids.owner })
    expect(listed.map((v) => v._id)).toContain(venueId)
  })

  it('exposes only email and id for the account picker, filtered by role and excluding suspended accounts', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => ({
      admin: await ctx.db.insert('users', { email: 'ia-admin6@example.com', role: 'superadmin' }),
      activePlayer: await ctx.db.insert('users', { email: 'ia-active@example.com', role: 'player' }),
      suspendedPlayer: await ctx.db.insert('users', { email: 'ia-suspended@example.com', role: 'player', suspended: true }),
      owner: await ctx.db.insert('users', { email: 'ia-owner6@example.com', role: 'venueOwner' }),
    }))
    const players = await t.withIdentity({ subject: ids.admin }).query(api.admin.listImpersonatableUsers, { role: 'player' })
    expect(players.map((p) => p._id)).toEqual([ids.activePlayer])
    expect(Object.keys(players[0]).sort()).toEqual(['_id', 'email'])
    await expect(t.withIdentity({ subject: ids.owner }).query(api.admin.listImpersonatableUsers, { role: 'player' })).rejects.toThrow('Superadmin role required')
  })
})
