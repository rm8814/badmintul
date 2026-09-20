import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import { addWibDays, formatWibTime, wibDayStartMs, WIB_TIME_ZONE } from '../lib/wib'
import Button from './ui/Button'
import Card from './ui/Card'
import Select from './ui/Select'

export default function PlayerBrowsePanel({ view = 'browse' }: { view?: 'browse' | 'bookings' }) {
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.roles.getCurrentUser)
  const venues = useQuery(api.venues.listApprovedVenues)
  const settings = useQuery(api.settings.getPlatformSettings)
  const maxDayOffset = settings ? settings.bookingLeadTimeDays : 3
  const [venueId, setVenueId] = useState<string>('')
  const selectedVenue = useQuery(api.venues.getApprovedVenue, venueId ? { venueId: venueId as never } : 'skip')
  const [courtId, setCourtId] = useState<string>('')
  const [dayOffset, setDayOffset] = useState(0)
  const dayStart = addWibDays(wibDayStartMs(), dayOffset)
  const availability = useQuery(api.bookings.getCourtAvailability, courtId ? { courtId: courtId as never, dayStart, dayEnd: dayStart + 86400000 } : 'skip')
  const blocks = useQuery(api.bookings.getCourtBlocks, courtId ? { courtId: courtId as never, dayStart, dayEnd: dayStart + 86400000 } : 'skip')
  const createBooking = useMutation(api.bookings.createBooking)
  const bookings = useQuery(api.bookings.listMyBookings, user?.role === 'player' ? {} : 'skip')
  const cancelBooking = useMutation(api.bookings.cancelBooking)
  const [pendingCancellation, setPendingCancellation] = useState<string | null>(null)
  const [cancellationError, setCancellationError] = useState('')
  async function cancel(bookingId: string) { setPendingCancellation(bookingId); setCancellationError(''); try { await cancelBooking({ bookingId: bookingId as never }) } catch (caught) { setCancellationError(caught instanceof Error ? caught.message : 'Could not cancel booking') } finally { setPendingCancellation(null) } }
  const [pendingBooking, setPendingBooking] = useState<number | null>(null)
  async function book(start: number) {
    setPendingBooking(start)
    try { await createBooking({ courtId: courtId as never, startTime: start, endTime: start + 3600000 }) } finally { setPendingBooking(null) }
  }
  if (!isAuthenticated || user?.role !== 'player') return null
  return <Card className="w-full max-w-2xl border-brand-accent/30 text-left">
{view === 'browse' ? <><h2 className="text-xl font-semibold text-brand-primary">Browse venues</h2>
    <div className="mt-4">{venues === undefined ? <div className="animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading approved venues…</div> : venues.length ? <Select id="browse-venue" label="Approved venue" value={venueId} onChange={(event) => { setVenueId(event.target.value); setCourtId('') }}><option value="">Select an approved venue</option>{venues.map((venue) => <option key={venue._id} value={venue._id}>{venue.name} — {venue.address}</option>)}</Select> : <div className="rounded-lg border border-dashed border-neutral-300 p-4"><p className="text-neutral-600">No approved venues are available yet.</p><a className="mt-2 inline-block font-semibold text-brand-primary underline" href="/">Return to the home page</a></div>}</div>
    {selectedVenue && <><h3 className="mt-5 font-semibold">{selectedVenue.name} courts</h3><div className="mt-2"><Select id="browse-court" label="Court" value={courtId} onChange={(event) => setCourtId(event.target.value)}><option value="">Select a court</option>{selectedVenue.courts.map((court) => <option key={court._id} value={court._id}>{court.name} — IDR {court.pricePerHour}/hour</option>)}</Select></div></>}
    {courtId && <div className="mt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Availability ({WIB_TIME_ZONE})</h3><p className="text-sm text-neutral-600">{new Intl.DateTimeFormat('id-ID', { timeZone: WIB_TIME_ZONE, dateStyle: 'full' }).format(dayStart)}</p></div><div className="flex gap-2"><Button variant="secondary" disabled={dayOffset === 0} onClick={() => setDayOffset((offset) => Math.max(0, offset - 1))}>Previous day</Button><Button variant="secondary" disabled={dayOffset >= maxDayOffset} onClick={() => setDayOffset((offset) => Math.min(maxDayOffset, offset + 1))}>Next day</Button></div></div><p className="mt-3 text-sm text-neutral-600">{availability?.length ? `${availability.length} confirmed booking(s) on this day.` : 'No confirmed bookings — this court is open.'}</p><div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="rounded-lg bg-brand-success/10 p-3 text-sm text-brand-success">Open slots</div><div className="rounded-lg bg-brand-danger/10 p-3 text-sm text-brand-danger">Booked slots</div><div className="rounded-lg bg-brand-warning/10 p-3 text-sm text-brand-warning">Blocked slots</div>{Array.from({ length: 14 }, (_, index) => { const start = dayStart + (8 + index) * 3600000; const booked = availability?.some((booking) => booking.startTime < start + 3600000 && booking.endTime > start); const blocked = blocks?.some((block) => block.startTime < start + 3600000 && block.endTime > start); return <div className={`rounded-lg border p-3 ${booked ? 'border-brand-danger/40 bg-brand-danger/5' : blocked ? 'border-brand-warning/40 bg-brand-warning/5' : 'border-brand-success/40 bg-brand-success/5'}`} key={start}><div className="flex items-center justify-between gap-2"><span className="font-semibold">{formatWibTime(start)}</span>{booked ? <span className="text-brand-danger">Booked</span> : blocked ? <span className="text-brand-warning">Blocked</span> : <Button disabled={pendingBooking !== null} className="px-3 py-1 text-sm" onClick={() => void book(start)}>{pendingBooking === start ? 'Booking…' : 'Book'}</Button>}</div></div> })}</div></div>}
</> : <><h2 className="text-xl font-semibold text-brand-primary">My bookings</h2>{cancellationError && <p className="mt-3 text-sm text-brand-danger" role="alert">{cancellationError}</p>}{bookings === undefined ? <div className="mt-4 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading your bookings…</div> : bookings.length ? <div className="mt-4 space-y-3">{bookings.map((booking) => <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3" key={booking._id}><div><p className="font-semibold">{formatWibTime(booking.startTime)} WIB</p><p className="text-sm text-neutral-600">{booking.status}</p></div>{booking.status === 'confirmed' && <Button variant="danger" disabled={pendingCancellation !== null} onClick={() => void cancel(booking._id)}>{pendingCancellation === booking._id ? 'Cancelling…' : 'Cancel'}</Button>}</div>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-neutral-300 p-4"><p className="text-neutral-600">No bookings yet.</p><a className="mt-2 inline-block font-semibold text-brand-primary underline" href="/player">Browse venues to book a court</a></div>}</>}
  </Card>
}
