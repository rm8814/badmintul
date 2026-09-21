import { describe, expect, it } from 'vitest'

const ownerSource = await import('../components/VenueOwnerPanel?raw').then((module) => module.default)
const adminSource = await import('../components/SuperadminPanel?raw').then((module) => module.default)
const convexAdminSource = await import('../../convex/admin?raw').then((module) => module.default)

describe('Task 47a and 49a moderation safeguards', () => {
  it('adds pending states to remove and moderation controls', () => {
    expect(ownerSource).toContain('removingBlockId !== null')
    expect(ownerSource).toContain('Removing…')
    expect(adminSource).toContain('moderationAction !== null')
    expect(adminSource).toContain('moderationAction === `user:${listedUser._id}`')
    expect(adminSource).toContain('Saving…')
    const venuesView = adminSource.match(/\{view === 'venues'[\s\S]*?\{view === 'users'/)?.[0] ?? ''
    expect(venuesView).toContain('disabled={moderationAction !== null}')
    expect(venuesView).toContain('moderationAction === `venue:${venue._id}`')
    expect(venuesView).toContain("'Saving…'")
  })

  it('does not offer a working self-suspension control', () => {
    expect(adminSource).toContain('isCurrentUser')
    expect(adminSource).toContain('Your account')
    expect(convexAdminSource).toContain('Superadmins cannot suspend their own account')
  })
})
