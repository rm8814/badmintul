import { describe, expect, it } from 'vitest'

const button = await import('../components/ui/Button?raw').then((module) => module.default)
const card = await import('../components/ui/Card?raw').then((module) => module.default)
const fields = await Promise.all([
  import('../components/ui/TextField?raw').then((module) => module.default),
  import('../components/ui/Select?raw').then((module) => module.default),
])
const landing = await import('../pages/Landing?raw').then((module) => module.default)
const shell = await import('../components/AppShell?raw').then((module) => module.default)

describe('Task 35 commercial visual QA', () => {
  it('uses the commercial surface, border, radius, and focus system in shared controls', () => {
    expect(button).toContain('rounded-control')
    expect(button).toContain('focus-visible:outline-focus-ring')
    expect(card).toContain('rounded-card')
    expect(card).toContain('border-border-subtle')
    for (const field of fields) expect(field).toContain('border-border-strong')
  })

  it('uses shared containers and narrow-screen-safe shell wrapping', () => {
    expect(landing).toContain('content-container')
    expect(shell).toContain('flex flex-wrap items-center')
  })
})
