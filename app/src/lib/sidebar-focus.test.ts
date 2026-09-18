import { describe, expect, it } from 'vitest'
import { shouldInertSidebar } from '../components/AppShell'

describe('Task 44b sidebar focus management', () => {
  it('only makes a closed mobile sidebar inert', () => {
    expect(shouldInertSidebar(false, false)).toBe(true)
    expect(shouldInertSidebar(false, true)).toBe(false)
    expect(shouldInertSidebar(true, false)).toBe(false)
    expect(shouldInertSidebar(true, true)).toBe(false)
  })
})
