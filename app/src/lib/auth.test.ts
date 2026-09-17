import { describe, expect, it } from 'vitest'
import { convexTest } from 'convex-test'
import { api } from '../../convex/_generated/api'
import schema from '../../convex/schema'

const modules = import.meta.glob('../../convex/**/*.{ts,js}')

const authSource = await import('../../convex/auth?raw').then((module) => module.default)
const rolesSource = await import('../../convex/roles?raw').then((module) => module.default)

describe('Task 4 auth boundaries', () => {
  it('offers only player and venueOwner during public signup', () => {
    expect(authSource).toContain('params.role === "venueOwner" ? "venueOwner" : "player"')
    expect(authSource).not.toContain('role === "superadmin"')
  })

  it('checks venue owner role inside a Convex function', () => {
    expect(rolesSource).toContain('if (user.role !== "venueOwner") throw new Error')
    expect(rolesSource).toContain('getAuthUserId(ctx)')
  })

  it('rejects a player calling the venue-owner-only function', async () => {
    const t = convexTest(schema, modules)
    const playerId = await t.run((ctx) => ctx.db.insert('users', {
      email: 'player@example.com',
      role: 'player',
    }))
    const asPlayer = t.withIdentity({ subject: playerId })
    await expect(asPlayer.query(api.roles.getVenueOwnerArea, {})).rejects.toThrow('Venue owner role required')
  })
})
