import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'

export default function PlayerBrowsePanel() {
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.roles.getCurrentUser)
  const venues = useQuery(api.venues.listApprovedVenues)
  const [venueId, setVenueId] = useState<string>('')
  const selectedVenue = useQuery(api.venues.getApprovedVenue, venueId ? { venueId: venueId as never } : 'skip')
  const [courtId, setCourtId] = useState<string>('')
  const today = new Date()
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const availability = useQuery(api.bookings.getCourtAvailability, courtId ? { courtId: courtId as never, dayStart, dayEnd: dayStart + 86400000 } : 'skip')
  const createBooking = useMutation(api.bookings.createBooking)
  const bookings = useQuery(api.bookings.listMyBookings, user?.role === 'player' ? {} : 'skip')
  if (!isAuthenticated || user?.role !== 'player') return null
  return <section className="w-full max-w-2xl rounded-xl border border-brand-accent/30 bg-white p-6 text-left shadow-sm">
    <h2 className="text-xl font-semibold text-brand-primary">Browse venues</h2>
    <select className="mt-4 w-full" value={venueId} onChange={(event) => { setVenueId(event.target.value); setCourtId('') }}><option value="">Select an approved venue</option>{venues?.map((venue) => <option key={venue._id} value={venue._id}>{venue.name} — {venue.address}</option>)}</select>
    {selectedVenue && <><h3 className="mt-5 font-semibold">{selectedVenue.name} courts</h3><select className="mt-2 w-full" value={courtId} onChange={(event) => setCourtId(event.target.value)}><option value="">Select a court</option>{selectedVenue.courts.map((court) => <option key={court._id} value={court._id}>{court.name} — IDR {court.pricePerHour}/hour</option>)}</select></>}
    {courtId && <div className="mt-5"><h3 className="font-semibold">Today’s availability</h3><p className="mt-2 text-sm text-neutral-600">{availability?.length ? `${availability.length} confirmed booking(s) today.` : 'No confirmed bookings today — this court is open.'}</p>{Array.from({ length: 14 }, (_, index) => { const start = dayStart + (8 + index) * 3600000; const booked = availability?.some((booking) => booking.startTime < start + 3600000 && booking.endTime > start); return <div className="mt-2 flex items-center justify-between rounded border p-2" key={start}><span>{new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>{booked ? <span className="text-brand-danger">Booked</span> : <button className="rounded bg-brand-primary px-3 py-1 text-white" onClick={() => void createBooking({ courtId: courtId as never, startTime: start, endTime: start + 3600000 })}>Book</button>}</div> })}</div>}
    <div className="w-full"><h3 className="mt-6 font-semibold">My bookings</h3>{bookings?.map((booking) => <p className="mt-2 text-sm" key={booking._id}>{new Date(booking.startTime).toLocaleString()} — {booking.status}</p>)}</div>
  </section>
}
