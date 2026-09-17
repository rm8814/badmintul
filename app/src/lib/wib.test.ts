import { describe, expect, it } from 'vitest'
import { addWibDays, formatWibTime, wibDayStartMs } from './wib'

describe('Task 15 WIB date handling', () => {
  it('uses the same WIB day boundary regardless of browser timezone', () => {
    const beforeMidnightUtc = new Date('2026-09-16T18:00:00.000Z')
    const afterMidnightUtc = new Date('2026-09-17T06:59:59.000Z')
    expect(wibDayStartMs(beforeMidnightUtc)).toBe(Date.parse('2026-09-16T17:00:00.000Z'))
    expect(wibDayStartMs(afterMidnightUtc)).toBe(Date.parse('2026-09-16T17:00:00.000Z'))
  })

  it('formats displayed slots explicitly in Asia/Jakarta', () => {
    expect(formatWibTime(Date.parse('2026-09-16T18:00:00.000Z'))).toMatch(/01\.00/)
  })

  it('moves availability days by calendar days in WIB', () => {
    expect(addWibDays(Date.parse('2026-09-16T17:00:00.000Z'), 1)).toBe(Date.parse('2026-09-17T17:00:00.000Z'))
  })
})
