export const WIB_TIME_ZONE = 'Asia/Jakarta'
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

function wibDateParts(value: Date | number) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: WIB_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value)
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)])) as { year: number; month: number; day: number }
}

export function wibDayStartMs(value: Date | number = new Date()) {
  const { year, month, day } = wibDateParts(value)
  return Date.UTC(year, month - 1, day) - WIB_OFFSET_MS
}

export function addWibDays(dayStartMs: number, days: number) {
  const { year, month, day } = wibDateParts(dayStartMs)
  return Date.UTC(year, month - 1, day + days) - WIB_OFFSET_MS
}

export function formatWibTime(value: Date | number) {
  return new Intl.DateTimeFormat('id-ID', { timeZone: WIB_TIME_ZONE, hour: '2-digit', minute: '2-digit' }).format(value)
}
