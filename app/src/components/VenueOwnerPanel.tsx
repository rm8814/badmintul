import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import Button from './ui/Button'
import Card from './ui/Card'
import TextField from './ui/TextField'

export default function VenueOwnerPanel() {
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.roles.getCurrentUser)
  const venues = useQuery(api.venues.listMyVenues, user?.role === 'venueOwner' ? {} : 'skip')
  const incomingBookings = useQuery(api.bookings.listBookingsForMyVenues, user?.role === 'venueOwner' ? {} : 'skip')
  const venueStats = useQuery(api.bookings.getMyVenueStats, user?.role === 'venueOwner' ? {} : 'skip')
  const createVenue = useMutation(api.venues.createVenueWithCourts)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [courtName, setCourtName] = useState('Court 1')
  const [price, setPrice] = useState('100000')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isAuthenticated || user?.role !== 'venueOwner') return null

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSaved(false)
    setIsSubmitting(true)
    try {
      await createVenue({ name, address, description: '', photos: [], courts: [{ name: courtName, pricePerHour: Number(price), operatingHours: { open: '08:00', close: '22:00' } }] })
      setSaved(true)
      setName('')
      setAddress('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not submit venue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <Card className="w-full max-w-xl border-brand-primary/20 text-left">
    <h2 className="text-xl font-semibold text-brand-primary">Venue owner dashboard</h2>
    <form id="venue-submission" className="mt-4 flex flex-col gap-3" onSubmit={submit}>
      <TextField id="venue-name" label="Venue name" required value={name} onChange={(event) => setName(event.target.value)} />
      <TextField id="venue-address" label="Address" required value={address} onChange={(event) => setAddress(event.target.value)} />
      <TextField id="court-name" label="First court name" required value={courtName} onChange={(event) => setCourtName(event.target.value)} />
      <TextField id="court-price" label="Price per hour" required min="1" type="number" value={price} onChange={(event) => setPrice(event.target.value)} />
      {error && <p className="text-sm text-brand-danger">{error}</p>}
      {saved && <p className="text-sm text-brand-success">Venue submitted for approval.</p>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit venue'}</Button>
    </form>
    <div className="mt-6"><h3 className="font-semibold">My venues</h3>{venues === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading your venues…</div> : venues.length ? venues.map((venue) => <p className="mt-2" key={venue._id}>{venue.name} — <span className="text-brand-warning">{venue.approvalStatus === 'pending' ? 'Pending approval' : venue.approvalStatus}</span></p>) : <div className="mt-2 rounded-lg border border-dashed border-neutral-300 p-4"><p className="text-neutral-600">No venues submitted yet.</p><a className="mt-2 inline-block font-semibold text-brand-primary underline" href="#venue-submission">Submit your first venue</a></div>}</div>
    <div className="mt-6"><h3 className="font-semibold">Venue stats</h3>{venueStats === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading venue stats…</div> : venueStats.length ? <div className="mt-2 grid gap-3 sm:grid-cols-2">{venueStats.map((stats) => <div className="rounded-lg border border-neutral-200 p-3" key={stats.venueId}><p className="font-semibold">{stats.venueName}</p><p className="mt-1 text-sm">Revenue: IDR {stats.revenue.toLocaleString('id-ID')}</p><p className="text-sm">Utilization: {(stats.utilization * 100).toFixed(1)}%</p></div>)}</div> : <p className="mt-2 text-neutral-600">Stats will appear after you submit a venue.</p>}</div>
    <div className="mt-6"><h3 className="font-semibold">Incoming bookings</h3>{incomingBookings === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading incoming bookings…</div> : incomingBookings.length ? incomingBookings.map((booking) => <div className="mt-2 rounded-lg border border-neutral-200 p-3 text-sm" key={booking._id}><p className="font-semibold">{booking.venueName} · {booking.courtName}</p><p>{formatVenueBookingTime(booking.startTime)} — {booking.status}</p></div>) : <div className="mt-2 rounded-lg border border-dashed border-neutral-300 p-4"><p className="text-neutral-600">No incoming bookings yet.</p><p className="mt-1 text-sm text-neutral-500">Bookings for your courts will appear here.</p></div>}</div>
  </Card>
}

function formatVenueBookingTime(value: number) {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }).format(value)
}
