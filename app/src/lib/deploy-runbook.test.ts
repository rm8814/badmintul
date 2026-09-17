import { describe, expect, it } from 'vitest'

const runbook = await import('../../../DEPLOY.md?raw').then((module) => module.default)

describe('Task 16 deployment runbook', () => {
  it('documents production build, upload, and preflight checks', () => {
    expect(runbook).toContain('npm run build -- --mode production')
    expect(runbook).toContain('public_html/')
    expect(runbook).toContain('frugal-vole-549.convex.cloud')
    expect(runbook).toContain('keen-scorpion-113.convex.cloud')
    expect(runbook).toContain('Select-String')
  })

  it('documents the explicit production origin requirement', () => {
    expect(runbook).toContain('https://badmintul.com')
    expect(runbook).toContain('Do not add `*`')
  })
})
