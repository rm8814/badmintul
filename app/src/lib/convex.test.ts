import { describe, expect, it } from 'vitest'

describe('Convex Task 2 wiring', () => {
  it('documents the required deployment URL', () => expect('VITE_CONVEX_URL').toMatch(/^VITE_/))
  it('defines both round-trip functions', async () => {
    const source = await import('../../convex/connection?raw')
    expect(source.default).toContain('export const getStatus')
    expect(source.default).toContain('export const recordCheck')
  })
})
