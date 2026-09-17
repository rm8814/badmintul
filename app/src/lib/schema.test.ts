import { describe, expect, it } from 'vitest'

const schemaSource = await import('../../convex/schema?raw').then((module) => module.default)

describe('Task 3 Convex schema', () => {
  it('defines every required table with validators and no v.any()', () => {
    for (const table of ['users', 'venues', 'courts', 'bookings']) {
      expect(schemaSource).toContain(`${table}: defineTable`)
    }
    expect(schemaSource).not.toContain('v.any()')
  })

  it('models approval and booking lifecycle states', () => {
    expect(schemaSource).toContain('v.literal("pending")')
    expect(schemaSource).toContain('v.literal("approved")')
    expect(schemaSource).toContain('v.literal("rejected")')
    expect(schemaSource).toContain('v.literal("confirmed")')
    expect(schemaSource).toContain('v.literal("cancelled")')
  })

  it('uses Convex ID references for domain relationships', () => {
    expect(schemaSource).toContain('ownerId: v.id("users")')
    expect(schemaSource).toContain('venueId: v.id("venues")')
    expect(schemaSource).toContain('courtId: v.id("courts")')
    expect(schemaSource).toContain('playerId: v.id("users")')
  })
})
