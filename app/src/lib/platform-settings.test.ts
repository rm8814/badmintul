import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api } from '../../convex/_generated/api'
import schema from '../../convex/schema'

const modules = import.meta.glob('../../convex/**/*.{ts,js}')

describe('Task 50 all bookings query', () => {
  it('rejects non-superadmins and enriches bookings with court, venue, and player context', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => {
      const owner = await ctx.db.insert('users', { email: 'ab-owner@example.com', role: 'venueOwner' })
      const player = await ctx.db.insert('users', { email: 'ab-player@example.com', role: 'player' })
      const admin = await ctx.db.insert('users', { email: 'ab-admin@example.com', role: 'superadmin' })
      const venue = await ctx.db.insert('venues', { ownerId: owner, name: 'AB Venue', address: 'Addr', description: '', photos: [], approvalStatus: 'approved', city: 'Jakarta' })
      const court = await ctx.db.insert('courts', { venueId: venue, name: 'Court A', pricePerHour: 100, operatingHours: { open: '08:00', close: '22:00' } })
      const booking = await ctx.db.insert('bookings', { courtId: court, playerId: player, startTime: 1000, endTime: 2000, status: 'confirmed' })
      return { owner, player, admin, venue, court, booking }
    })
    await expect(t.withIdentity({ subject: ids.player }).query(api.admin.listAllBookings, {})).rejects.toThrow('Superadmin role required')
    const result = await t.withIdentity({ subject: ids.admin }).query(api.admin.listAllBookings, {})
    const found = result.find((b) => b._id === ids.booking)
    expect(found).toEqual({ _id: ids.booking, startTime: 1000, endTime: 2000, status: 'confirmed', courtName: 'Court A', venueName: 'AB Venue', playerEmail: 'ab-player@example.com' })
  })
})

describe('Task 51 platform settings', () => {
  it('returns defaults when unset and requires authentication', async () => {
    const t = convexTest(schema, modules)
    await expect(t.query(api.settings.getPlatformSettings, {})).rejects.toThrow('Authentication required')
    const playerId = await t.run((ctx) => ctx.db.insert('users', { email: 'settings-player@example.com', role: 'player' }))
    const defaults = await t.withIdentity({ subject: playerId }).query(api.settings.getPlatformSettings, {})
    expect(defaults).toEqual({ cancellationWindowHours: 2, bookingLeadTimeDays: 3, supportedCities: [] })
  })

  it('rejects non-superadmins from updating settings and validates input', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => ({
      admin: await ctx.db.insert('users', { email: 'settings-admin@example.com', role: 'superadmin' }),
      player: await ctx.db.insert('users', { email: 'settings-player2@example.com', role: 'player' }),
    }))
    await expect(t.withIdentity({ subject: ids.player }).mutation(api.settings.updatePlatformSettings, { cancellationWindowHours: 5, bookingLeadTimeDays: 5, supportedCities: [] })).rejects.toThrow('Superadmin role required')
    await expect(t.withIdentity({ subject: ids.admin }).mutation(api.settings.updatePlatformSettings, { cancellationWindowHours: 0, bookingLeadTimeDays: 5, supportedCities: [] })).rejects.toThrow('Cancellation window must be greater than zero')
    await t.withIdentity({ subject: ids.admin }).mutation(api.settings.updatePlatformSettings, { cancellationWindowHours: 4, bookingLeadTimeDays: 7, supportedCities: [' Jakarta ', 'Bandung', ''] })
    const updated = await t.withIdentity({ subject: ids.admin }).query(api.settings.getPlatformSettings, {})
    expect(updated).toMatchObject({ cancellationWindowHours: 4, bookingLeadTimeDays: 7, supportedCities: ['Jakarta', 'Bandung'] })
  })
})

describe('Task 52 cancellation window uses platform settings', () => {
  it('honors an updated cancellation window instead of the old hardcoded 2-hour constant', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => ({
      admin: await ctx.db.insert('users', { email: 'cw-admin@example.com', role: 'superadmin' }),
      owner: await ctx.db.insert('users', { email: 'cw-owner@example.com', role: 'venueOwner' }),
      player: await ctx.db.insert('users', { email: 'cw-player@example.com', role: 'player' }),
    }))
    await t.withIdentity({ subject: ids.admin }).mutation(api.settings.updatePlatformSettings, { cancellationWindowHours: 5, bookingLeadTimeDays: 3, supportedCities: [] })
    const venueId = await t.withIdentity({ subject: ids.owner }).mutation(api.venues.createVenueWithCourts, { name: 'CW Venue', address: 'Addr', description: '', photos: [], city: 'Jakarta', courts: [{ name: 'Court 1', pricePerHour: 100, operatingHours: { open: '00:00', close: '23:59' } }] })
    const venue = await t.run((ctx) => ctx.db.get(venueId))
    const courtId = (await t.run((ctx) => ctx.db.query('courts').withIndex('by_venueId', (q) => q.eq('venueId', venue!._id)).collect()))[0]._id
    const startTime = Date.now() + 4 * 3600000
    const bookingId = await t.withIdentity({ subject: ids.player }).mutation(api.bookings.createBooking, { courtId, startTime, endTime: startTime + 3600000 })
    await expect(t.withIdentity({ subject: ids.player }).mutation(api.bookings.cancelBooking, { bookingId })).rejects.toThrow('at least 5 hours')
  })
})

describe('Task 53 booking lead time uses platform settings', () => {
  it('rejects bookings past the configured lead time', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => ({
      admin: await ctx.db.insert('users', { email: 'lt-admin@example.com', role: 'superadmin' }),
      owner: await ctx.db.insert('users', { email: 'lt-owner@example.com', role: 'venueOwner' }),
      player: await ctx.db.insert('users', { email: 'lt-player@example.com', role: 'player' }),
    }))
    await t.withIdentity({ subject: ids.admin }).mutation(api.settings.updatePlatformSettings, { cancellationWindowHours: 2, bookingLeadTimeDays: 1, supportedCities: [] })
    const venueId = await t.withIdentity({ subject: ids.owner }).mutation(api.venues.createVenueWithCourts, { name: 'LT Venue', address: 'Addr', description: '', photos: [], city: 'Jakarta', courts: [{ name: 'Court 1', pricePerHour: 100, operatingHours: { open: '00:00', close: '23:59' } }] })
    const venue = await t.run((ctx) => ctx.db.get(venueId))
    const courtId = (await t.run((ctx) => ctx.db.query('courts').withIndex('by_venueId', (q) => q.eq('venueId', venue!._id)).collect()))[0]._id
    const tooFar = Date.now() + 5 * 86400000
    await expect(t.withIdentity({ subject: ids.player }).mutation(api.bookings.createBooking, { courtId, startTime: tooFar, endTime: tooFar + 3600000 })).rejects.toThrow('1 day(s) in advance')
    const soon = Date.now() + 3600000
    await expect(t.withIdentity({ subject: ids.player }).mutation(api.bookings.createBooking, { courtId, startTime: soon, endTime: soon + 3600000 })).resolves.toBeTruthy()
  })
})

describe('Task 54 venue city enforcement', () => {
  it('requires a city and rejects unsupported cities once a supported list is configured', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.run(async (ctx) => ({
      admin: await ctx.db.insert('users', { email: 'city-admin@example.com', role: 'superadmin' }),
      owner: await ctx.db.insert('users', { email: 'city-owner@example.com', role: 'venueOwner' }),
    }))
    const courts = [{ name: 'Court 1', pricePerHour: 100, operatingHours: { open: '08:00', close: '22:00' } }]
    await expect(t.withIdentity({ subject: ids.owner }).mutation(api.venues.createVenueWithCourts, { name: 'No city venue', address: 'Addr', description: '', photos: [], city: '  ', courts })).rejects.toThrow('City is required')
    await t.withIdentity({ subject: ids.admin }).mutation(api.settings.updatePlatformSettings, { cancellationWindowHours: 2, bookingLeadTimeDays: 3, supportedCities: ['Jakarta'] })
    await expect(t.withIdentity({ subject: ids.owner }).mutation(api.venues.createVenueWithCourts, { name: 'Wrong city venue', address: 'Addr', description: '', photos: [], city: 'Surabaya', courts })).rejects.toThrow('City is not currently supported')
    const venueId = await t.withIdentity({ subject: ids.owner }).mutation(api.venues.createVenueWithCourts, { name: 'Right city venue', address: 'Addr', description: '', photos: [], city: 'Jakarta', courts })
    const venue = await t.run((ctx) => ctx.db.get(venueId))
    expect(venue?.city).toBe('Jakarta')
  })
})
