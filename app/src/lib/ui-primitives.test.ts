import { describe, expect, it } from 'vitest'

const buttonSource = await import('../components/ui/Button?raw').then((module) => module.default)
const authSource = await import('../components/AuthPanel?raw').then((module) => module.default)
const ownerSource = await import('../components/VenueOwnerPanel?raw').then((module) => module.default)
const playerSource = await import('../components/PlayerBrowsePanel?raw').then((module) => module.default)

describe('Task 17 shared UI primitives', () => {
  it('provides visible disabled styling and focus styling', () => {
    expect(buttonSource).toContain('disabled:opacity-50')
    expect(buttonSource).toContain('focus-visible:outline')
    expect(buttonSource).toContain("variant?: 'primary' | 'secondary' | 'danger'")
  })

  it('uses shared controls and labels in every targeted panel', () => {
    for (const source of [authSource, ownerSource, playerSource]) {
      expect(source).toContain("from './ui/")
      expect(source).not.toMatch(/<input\s/)
      expect(source).not.toMatch(/<select\s/)
    }
    expect(authSource).toContain('TextField')
    expect(ownerSource).toContain('Card')
    expect(playerSource).toContain('Select')
  })
})
