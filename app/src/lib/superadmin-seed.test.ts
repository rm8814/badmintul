import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { internal } from '../../convex/_generated/api'
import schema from '../../convex/schema'

const modules = import.meta.glob('../../convex/**/*.{ts,js}')

describe('Task 14 superadmin bootstrap', () => {
  it('promotes an existing user through the internal mutation', async () => {
    const t = convexTest(schema, modules)
    const userId = await t.run((ctx) => ctx.db.insert('users', { email: 'Admin@Example.com', role: 'player' }))
    await t.mutation(internal.admin.promoteUserToSuperadmin, { email: ' admin@example.com ' })
    await expect(t.run((ctx) => ctx.db.get(userId))).resolves.toMatchObject({ role: 'superadmin' })
  })

  it('fails clearly when the email does not exist', async () => {
    const t = convexTest(schema, modules)
    await expect(t.mutation(internal.admin.promoteUserToSuperadmin, { email: 'missing@example.com' })).rejects.toThrow('No user found')
  })
})
