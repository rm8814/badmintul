import { describe, expect, it } from 'vitest'

const home = await import('../pages/Home?raw').then((module) => module.default)
const auth = await import('../components/AuthPanel?raw').then((module) => module.default)

describe('Task 29 branded auth screens', () => {
  it('provides a branded header and return-home link', () => {
    expect(home).toContain('badmintul<span')
    expect(home).toContain('href="/"')
    expect(home).toContain('Kembali ke beranda')
  })

  it('visually distinguishes the active auth mode', () => {
    expect(auth).toContain("variant={mode === 'signUp' ? 'primary' : 'secondary'}")
    expect(auth).toContain("variant={mode === 'signIn' ? 'primary' : 'secondary'}")
  })
})
