import { describe, expect, it } from 'vitest'

const source = await import('../components/AppShell?raw').then((module) => module.default)

describe('Task 45 dashboard shell visual and accessibility QA', () => {
  it('gives every shell control a visible focus treatment and accessible state', () => {
    expect(source).toContain('focus-visible:outline-focus-ring')
    expect(source).toContain('aria-expanded={isNavOpen}')
    expect(source).toContain('aria-expanded={isUserMenuOpen}')
    expect(source).toContain('aria-current')
    expect(source).toContain('role="menuitem"')
  })

  it('keeps the shell bounded at narrow widths', () => {
    expect(source).toContain('min-w-0 flex-1')
    expect(source).toContain('flex flex-wrap items-center')
    expect(source).toContain('max-w-[calc(100vw-2rem)]')
    expect(source).not.toContain('w-screen')
  })

  it('uses existing contrast-safe tokens for shell surfaces and text', () => {
    expect(source).toContain('bg-white')
    expect(source).toContain('text-neutral-700')
    expect(source).toContain('bg-brand-primary/10 text-brand-primary')
    expect(source).toContain('focus-visible:outline-focus-ring')
  })
})
