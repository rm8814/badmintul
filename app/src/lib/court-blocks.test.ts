import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api } from '../../convex/_generated/api'
import schema from '../../convex/schema'

const modules = import.meta.glob('../../convex/**/*.{ts,js}')

async function setup(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const ownerA = await ctx.db.insert('users', { email: 'block-owner-a@example.com', role: 'venueOwner' })
    const ownerB = await ctx.db.insert('users', { email: 'block-owner-b@example.com', role: 'venueOwner' })
    const player = await ctx.db.insert('users', { email: 'block-player@example.com', role: 'player' })
    const venueA = await ctx.db.insert('venues', { ownerId: ownerA, name: 'A venue', address: 'A', description: '', photos: [], approvalStatus: 'approved' })
    const venueB = await ctx.db.insert('venues', { ownerId: ownerB, name: 'B venue', address: 'B', description: '', photos: [], approvalStatus: 'approved' })
    const courtA = await ctx.db.insert('courts', { venueId: venueA, name: 'A court', pricePerHour: 100, operatingHours: { open: '08:00', close: '22:00' } })
    const courtB = await ctx.db.insert('courts', { venueId: venueB, name: 'B court', pricePerHour: 100, operatingHours: { open: '08:00', close: '22:00' } })
    return { ownerA, ownerB, player, courtA, courtB }
  })
}

describe('Task 23 court availability blocks', () => {
  it('rejects a player booking a blocked slot', async () => {
    const t = convexTest(schema, modules)
    const { ownerA, player, courtA } = await setup(t)
    const start = Date.now() + 86400000
    await t.withIdentity({ subject: ownerA }).mutation(api.venues.createCourtBlock, { courtId: courtA, startTime: start, endTime: start + 3600000, reason: 'Maintenance' })
    await expect(t.withIdentity({ subject: player }).mutation(api.bookings.createBooking, { courtId: courtA, startTime: start, endTime: start + 3600000 })).rejects.toThrow('blocked by the venue')
  })

  it('rejects cross-owner block creation and removal', async () => {
    const t = convexTest(schema, modules)
    const { ownerA, ownerB, courtA, courtB } = await setup(t)
    const start = Date.now() + 86400000
    await expect(t.withIdentity({ subject: ownerB }).mutation(api.venues.createCourtBlock, { courtId: courtA, startTime: start, endTime: start + 3600000 })).rejects.toThrow('does not belong')
    const block = await t.withIdentity({ subject: ownerA }).mutation(api.venues.createCourtBlock, { courtId: courtA, startTime: start, endTime: start + 3600000 })
    await expect(t.withIdentity({ subject: ownerB }).mutation(api.venues.removeCourtBlock, { blockId: block })).rejects.toThrow('does not belong')
    await expect(t.withIdentity({ subject: ownerA }).mutation(api.venues.createCourtBlock, { courtId: courtB, startTime: start, endTime: start + 3600000 })).rejects.toThrow('does not belong')
  })

  it('rejects blocking an existing confirmed booking', async () => {
    const t = convexTest(schema, modules)
    const { ownerA, player, courtA } = await setup(t)
    const start = Date.now() + 86400000
    await t.withIdentity({ subject: player }).mutation(api.bookings.createBooking, { courtId: courtA, startTime: start, endTime: start + 3600000 })
    await expect(t.withIdentity({ subject: ownerA }).mutation(api.venues.createCourtBlock, { courtId: courtA, startTime: start, endTime: start + 3600000 })).rejects.toThrow('existing confirmed booking')
  })

  it('lists only blocks belonging to the current venue owner', async () => {
    const t = convexTest(schema, modules)
    const { ownerA, ownerB, courtA, courtB } = await setup(t)
    const start = Date.now() + 86400000
    await t.withIdentity({ subject: ownerA }).mutation(api.venues.createCourtBlock, { courtId: courtA, startTime: start, endTime: start + 3600000 })
    await t.withIdentity({ subject: ownerB }).mutation(api.venues.createCourtBlock, { courtId: courtB, startTime: start, endTime: start + 3600000 })
    const ownerABlocks = await t.withIdentity({ subject: ownerA }).query(api.venues.listBlocksForMyVenues, {})
    expect(ownerABlocks).toHaveLength(1)
    expect(ownerABlocks[0].courtId).toBe(courtA)
    expect(ownerABlocks[0]).toMatchObject({ courtName: 'A court', venueName: 'A venue' })
  })
})
