import { describe, expect, it } from 'vitest'

const source = await import('../pages/Landing?raw').then((module) => module.default)

describe('Task 38 trust and product proof sections', () => {
  it('explains factual booking expectations and availability', () => {
    expect(source).toContain('Booking 1 jam')
    expect(source).toContain('Setiap booking saat ini berlaku untuk satu slot satu jam.')
    expect(source).toContain('Slot live')
    expect(source).toContain('waktu WIB')
  })

  it('includes approval, support, and coverage messaging without unsupported proof', () => {
    expect(source).toContain('Venue ditinjau')
    expect(source).toContain('sudah melewati proses approval')
    expect(source).toContain('Butuh bantuan?')
    expect(source).toContain('Hubungi tim badmintul')
    expect(source).toContain('area yang tercantum di platform')
    expect(source).not.toMatch(/\b(testimoni|rating|pelanggan|pengguna)\b/i)
  })

  it('uses a responsive trust-card layout', () => {
    expect(source).toContain('grid gap-4 sm:grid-cols-2 lg:grid-cols-4')
  })
})
