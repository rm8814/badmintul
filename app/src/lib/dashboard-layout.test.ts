import { describe, expect, it } from 'vitest'

const source = await import('../components/RoleDashboard?raw').then((module) => module.default)

describe('Task 31 dashboard layout', () => {
  it('uses a full-width responsive content flow below the shell', () => {
    expect(source).toContain('content-container flex')
    expect(source).toContain('items-stretch justify-start gap-8')
    expect(source).not.toContain('items-center gap-6')
  })
})
