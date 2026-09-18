import { describe, expect, it } from 'vitest'

const appSource = await import('../App?raw').then((module) => module.default)
const shellSource = await import('../components/AppShell?raw').then((module) => module.default)
const panelSource = await import('../components/PlayerBrowsePanel?raw').then((module) => module.default)

describe('Task 46 player bookings cancellation view', () => {
  it('routes the player bookings destination and highlights it through the shared shell', () => {
    expect(appSource).toContain("'/player/bookings'")
    expect(shellSource).toContain("{ label: 'My Bookings', href: '/player/bookings' }")
  })

  it('uses the existing cancellation mutation with pending and server-error states', () => {
    expect(panelSource).toContain('api.bookings.cancelBooking')
    expect(panelSource).toContain('pendingCancellation')
    expect(panelSource).toContain('Cancelling…')
    expect(panelSource).toContain('role="alert"')
    expect(panelSource).toContain('caught instanceof Error ? caught.message')
    expect(panelSource).toContain("booking.status === 'confirmed'")
  })
})
