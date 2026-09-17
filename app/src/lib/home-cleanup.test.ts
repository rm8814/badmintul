import { describe, expect, it } from 'vitest'

const source = await import('../pages/Home?raw').then((module) => module.default)

describe('Task 13a stale Home cleanup', () => {
  it('keeps Home limited to the authentication form and removes scaffold wiring', () => {
    expect(source).toContain('<AuthPanel initialMode={authMode} />')
    expect(source).not.toContain('connection.getStatus')
    expect(source).not.toContain('connection.recordCheck')
    expect(source).not.toContain('Tailwind pipeline check')
    expect(source).not.toContain('<VenueOwnerPanel')
    expect(source).not.toContain('<SuperadminPanel')
    expect(source).not.toContain('<PlayerBrowsePanel')
  })
})
