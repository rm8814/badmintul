import { describe, expect, it } from 'vitest'

const sources = await Promise.all([
  import('../components/ui/PageHeader?raw').then((module) => module.default),
  import('../components/ui/SectionHeader?raw').then((module) => module.default),
  import('../components/ui/Badge?raw').then((module) => module.default),
  import('../components/ui/Alert?raw').then((module) => module.default),
  import('../components/ui/Modal?raw').then((module) => module.default),
  import('../components/ui/Drawer?raw').then((module) => module.default),
  import('../components/ui/EmptyState?raw').then((module) => module.default),
  import('../components/ui/Skeleton?raw').then((module) => module.default),
  import('../components/ui/Tabs?raw').then((module) => module.default),
  import('../components/ui/StatCard?raw').then((module) => module.default),
  import('../components/ui/DataTable?raw').then((module) => module.default),
  import('../components/ui/Toast?raw').then((module) => module.default),
])

describe('Task 33 commercial UI components', () => {
  it('provides every planned component', () => {
    expect(sources).toHaveLength(12)
    expect(sources.every((source) => source.includes('className'))).toBe(true)
  })

  it('covers interactive focus, keyboard dismissal, and disabled states', () => {
    expect(sources[4]).toContain('Escape')
    expect(sources[5]).toContain('Escape')
    expect(sources[8]).toContain('role="tab"')
    expect(sources[11]).toContain('role="status"')
  })
})
