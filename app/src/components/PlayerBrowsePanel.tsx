import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import { addWibDays, formatWibTime, wibDayStartMs, WIB_TIME_ZONE } from '../lib/wib'
import Button from './ui/Button'
import Card from './ui/Card'
import Select from './ui/Select'

export default function PlayerBrowsePanel() {
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.roles.getCurrentUser)
  const venues = useQuery(api.venues.listApprovedVenues)
  const [venueId, setVenueId] = useState<string>('')
  const selectedVenue = useQuery(api.venues.getApprovedVenue, venueId ? { venueId: venueId as never } : 'skip')
  const [courtId, setCourtId] = useState<string>('')
  const [dayOffset, setDayOffset] = useState(0)
  const dayStart = addWibDays(wibDayStartMs(), dayOffset)
  const availability = useQuery(api.bookings.getCourtAvailability, courtId ? { courtId: courtId as never, dayStart, dayEnd: dayStart + 86400000 } : 'skip')
  const createBooking = useMutation(api.bookings.createBooking)
  const bookings = useQuery(api.bookings.listMyBookings, user?.role === 'player' ? {} : 'skip')
  const [pendingBooking, setPendingBooking] = useState<number | null>(null)
  async function book(start: number) {
    setPendingBooking(start)
    try { await createBooking({ courtId: courtId as never, startTime: start, endTime: start + 3600000 }) } finally { setPendingBooking(null) }
  }
  if (!isAuthenticated || user?.role !== 'player') return null
  return <Card className="w-full max-w-2xl border-brand-accent/30 text-left">
    <h2 className="text-xl font-semibold text-brand-primary">Browse venues</h2>
    <div className="mt-4">{venues === undefined ? <div className="animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading approved venues…</div> : venues.length ? <Select id="browse-venue" label="Approved venue" value={venueId} onChange={(event) => { setVenueId(event.target.value); setCourtId('') }}><option value="">Select an approved venue</option>{venues.map((venue) => <option key={venue._id} value={venue._id}>{venue.name} — {venue.address}</option>)}</Select> : <div className="rounded-lg border border-dashed border-neutral-300 p-4"><p className="text-neutral-600">No approved venues are available yet.</p><a className="mt-2 inline-block font-semibold text-brand-primary underline" href="/">Return to the home page</a></div>}</div>
    {selectedVenue && <><h3 className="mt-5 font-semibold">{selectedVenue.name} courts</h3><div className="mt-2"><Select id="browse-court" label="Court" value={courtId} onChange={(event) => setCourtId(event.target.value)}><option value="">Select a court</option>{selectedVenue.courts.map((court) => <option key={court._id} value={court._id}>{court.name} — IDR {court.pricePerHour}/hour</option>)}</Select></div></>}
    {courtId && <div className="mt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Availability ({WIB_TIME_ZONE})</h3><p className="text-sm text-neutral-600">{new Intl.DateTimeFormat('id-ID', { timeZone: WIB_TIME_ZONE, dateStyle: 'full' }).format(dayStart)}</p></div><div className="flex gap-2"><Button variant="secondary" disabled={dayOffset === 0} onClick={() => setDayOffset((offset) => Math.max(0, offset - 1))}>Previous day</Button><Button variant="secondary" disabled={dayOffset >= 3} onClick={() => setDayOffset((offset) => Math.min(3, offset + 1))}>Next day</Button></div></div><p className="mt-3 text-sm text-neutral-600">{availability?.length ? `${availability.length} confirmed booking(s) on this day.` : 'No confirmed bookings — this court is open.'}</p><div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="rounded-lg bg-brand-success/10 p-3 text-sm text-brand-success">Open slots</div><div className="rounded-lg bg-brand-danger/10 p-3 text-sm text-brand-danger">Booked slots</div>{Array.from({ length: 14 }, (_, index) => { const start = dayStart + (8 + index) * 3600000; const booked = availability?.some((booking) => booking.startTime < start + 3600000 && booking.endTime > start); return <div className={`rounded-lg border p-3 ${booked ? 'border-brand-danger/40 bg-brand-danger/5' : 'border-brand-success/40 bg-brand-success/5'}`} key={start}><div className="flex items-center justify-between gap-2"><span className="font-semibold">{formatWibTime(start)}</span>{booked ? <span className="text-brand-danger">Booked</span> : <Button disabled={pendingBooking !== null} className="px-3 py-1 text-sm" onClick={() => void book(start)}>{pendingBooking === start ? 'Booking…' : 'Book'}</Button>}</div></div> })}</div></div>}
    <div className="w-full"><h3 className="mt-6 font-semibold">My bookings</h3>{bookings === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading your bookings…</div> : bookings.length ? bookings.map((booking) => <p className="mt-2 text-sm" key={booking._id}>{new Date(booking.startTime).toLocaleString()} — {booking.status}</p>) : <div className="mt-2 rounded-lg border border-dashed border-neutral-300 p-4"><p className="text-neutral-600">No bookings yet.</p><a className="mt-2 inline-block font-semibold text-brand-primary underline" href="#browse-venue">Browse venues to book a court</a></div>}</div>
  </Card>
}
