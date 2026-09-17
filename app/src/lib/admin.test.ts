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
    const venueId = await t.withIdentity({ subject: ownerId }).mutation(api.venues.createVenueWithCourts, { name: 'Approval venue', address: 'Address', description: '', photos: [], courts: [{ name: 'Court 1', pricePerHour: 100, operatingHours: { open: '08:00', close: '22:00' } }] })
    const admin = t.withIdentity({ subject: adminId })
    expect((await admin.query(api.admin.listPendingVenues, {})).map((venue) => venue._id)).toContain(venueId)
    await admin.mutation(api.admin.setVenueApproval, { venueId, status: 'approved' })
    expect((await admin.query(api.admin.listPendingVenues, {})).map((venue) => venue._id)).not.toContain(venueId)
  })
})
