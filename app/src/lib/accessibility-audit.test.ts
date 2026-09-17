import { describe, expect, it } from 'vitest'

const button = await import('../components/ui/Button?raw').then((module) => module.default)
const admin = await import('../components/SuperadminPanel?raw').then((module) => module.default)

describe('Task 21 accessibility and responsive audit', () => {
  it('keeps visible focus indicators for links and buttons', () => {
    expect(button).toContain('focus-visible:outline')
  })

  it('keeps narrow approval rows wrapping instead of overflowing', () => {
    expect(admin).toContain('flex flex-wrap items-center')
    expect(admin).toContain('break-words')
  })
})
