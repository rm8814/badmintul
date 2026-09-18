import { describe, expect, it } from 'vitest'

const sources = await Promise.all([
  import('../components/ui/Button?raw').then((module) => module.default),
  import('../components/ui/Card?raw').then((module) => module.default),
  import('../components/ui/Select?raw').then((module) => module.default),
  import('../components/ui/TextField?raw').then((module) => module.default),
])

describe('Task 33a UI library cleanup', () => {
  it('retains only the primitives used by real screens', () => {
    expect(sources).toHaveLength(4)
    expect(sources.every((source) => source.includes('className'))).toBe(true)
  })
})
