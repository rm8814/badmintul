import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api } from '../../convex/_generated/api'
import schema from '../../convex/schema'

const modules = import.meta.glob('../../convex/**/*.{ts,js}')

describe('Task 5 venue ownership', () => {
  it('requires at least one valid court server-side', async () => {
    const t = convexTest(schema, modules)
    const ownerId = await t.run((ctx) => ctx.db.insert('users', { email: 'owner@example.com', role: 'venueOwner' }))
    const owner = t.withIdentity({ subject: ownerId })
    await expect(owner.mutation(api.venues.createVenueWithCourts, { name: 'Test venue', address: 'Address', description: '', photos: [], courts: [] })).rejects.toThrow('At least one court is required')
  })

  it('rejects an owner attempting to read another owner venue', async () => {
    const t = convexTest(schema, modules)
    const ownerA = await t.run((ctx) => ctx.db.insert('users', { email: 'a@example.com', role: 'venueOwner' }))
    const ownerB = await t.run((ctx) => ctx.db.insert('users', { email: 'b@example.com', role: 'venueOwner' }))
    const venueB = await t.withIdentity({ subject: ownerB }).mutation(api.venues.createVenueWithCourts, { name: 'B venue', address: 'B address', description: '', photos: [], courts: [{ name: 'B court', pricePerHour: 100, operatingHours: { open: '08:00', close: '22:00' } }] })
    await expect(t.withIdentity({ subject: ownerA }).query(api.venues.getMyVenue, { venueId: venueB })).rejects.toThrow('does not belong')
  })
})
