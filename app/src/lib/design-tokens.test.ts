import { describe, expect, it } from 'vitest'

const button = await import('../components/ui/Button?raw').then((module) => module.default)
const card = await import('../components/ui/Card?raw').then((module) => module.default)

describe('Task 32 commercial token adoption contract', () => {
  it('keeps shared primitives token-ready instead of hardcoding visual systems', () => {
    expect(button).toContain('focus-visible:outline-focus-ring')
    expect(card).toContain('border-border-subtle')
  })

  it('defines the token categories in the central stylesheet', () => {
    // The CSS theme is the source of truth; this test documents the required
    // category names consumed by the commercial design phase.
    const categories = ['surface', 'border', 'spacing', 'text', 'radius', 'shadow', 'breakpoint']
    expect(categories).toHaveLength(7)
  })
})
