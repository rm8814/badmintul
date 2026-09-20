import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import Button from './ui/Button'
import Card from './ui/Card'
import TextField from './ui/TextField'
import Select from './ui/Select'

export default function VenueOwnerPanel({ view = 'overview', asUserId, onExitViewAs }: { view?: 'overview' | 'bookings' | 'availability' | 'stats'; asUserId?: string; onExitViewAs?: () => void }) {
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.roles.getCurrentUser)
  const impersonationArgs = asUserId ? { asUserId: asUserId as never } : {}
  const canQuery = user?.role === 'venueOwner' || !!asUserId
  const venues = useQuery(api.venues.listMyVenues, canQuery ? impersonationArgs : 'skip')
  const incomingBookings = useQuery(api.bookings.listBookingsForMyVenues, canQuery ? impersonationArgs : 'skip')
  const venueStats = useQuery(api.bookings.getMyVenueStats, canQuery ? impersonationArgs : 'skip')
  const blocks = useQuery(api.venues.listBlocksForMyVenues, canQuery ? impersonationArgs : 'skip')
  const createBlock = useMutation(api.venues.createCourtBlock)
  const removeBlock = useMutation(api.venues.removeCourtBlock)
  const createVenue = useMutation(api.venues.createVenueWithCourts)
  const settings = useQuery(api.settings.getPlatformSettings, canQuery ? {} : 'skip')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [courtName, setCourtName] = useState('Court 1')
  const [price, setPrice] = useState('100000')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCourtId, setSelectedCourtId] = useState('')
  const [blockDate, setBlockDate] = useState('')
  const [blockStart, setBlockStart] = useState('08:00')
  const [blockEnd, setBlockEnd] = useState('09:00')
  const [blockReason, setBlockReason] = useState('Maintenance')
  const [blockError, setBlockError] = useState('')
  const [blockPending, setBlockPending] = useState(false)
  const [removingBlockId, setRemovingBlockId] = useState<string | null>(null)

  async function submitBlock(event: React.FormEvent) {
    event.preventDefault()
    setBlockError('')
    setBlockPending(true)
    try {
      const startTime = new Date(`${blockDate}T${blockStart}:00+07:00`).getTime()
      const endTime = new Date(`${blockDate}T${blockEnd}:00+07:00`).getTime()
      await createBlock({ courtId: selectedCourtId as never, startTime, endTime, reason: blockReason, ...impersonationArgs })
    } catch (caught) {
      setBlockError(caught instanceof Error ? caught.message : 'Could not create maintenance block')
    } finally { setBlockPending(false) }
  }

  async function deleteBlock(blockId: string) {
    setRemovingBlockId(blockId)
    try { await removeBlock({ blockId: blockId as never, ...impersonationArgs }) } catch (caught) { setBlockError(caught instanceof Error ? caught.message : 'Could not remove maintenance block') } finally { setRemovingBlockId(null) }
  }
  if (!asUserId && (!isAuthenticated || user?.role !== 'venueOwner')) return null

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSaved(false)
    setIsSubmitting(true)
    try {
      await createVenue({ name, address, description: '', photos: [], city, courts: [{ name: courtName, pricePerHour: Number(price), operatingHours: { open: '08:00', close: '22:00' } }], ...impersonationArgs })
      setSaved(true)
      setName('')
      setAddress('')
      setCity('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not submit venue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <Card className="w-full max-w-xl border-brand-primary/20 text-left">
    {asUserId && <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-warning/40 bg-brand-warning/10 p-3 text-sm text-brand-warning"><span>Viewing as this venue owner. Actions here affect their real account.</span>{onExitViewAs && <Button variant="secondary" className="px-3 py-1 text-sm" onClick={onExitViewAs}>Exit</Button>}</div>}
    <h2 className="text-xl font-semibold text-brand-primary">Venue owner dashboard</h2>
    {view === 'overview' && <>
    <form id="venue-submission" className="mt-4 flex flex-col gap-3" onSubmit={submit}>
      <TextField id="venue-name" label="Venue name" required value={name} onChange={(event) => setName(event.target.value)} />
      <TextField id="venue-address" label="Address" required value={address} onChange={(event) => setAddress(event.target.value)} />
      {settings && settings.supportedCities.length > 0 ? <Select id="venue-city" label="City" required value={city} onChange={(event) => setCity(event.target.value)}><option value="">Select a city</option>{settings.supportedCities.map((cityOption) => <option key={cityOption} value={cityOption}>{cityOption}</option>)}</Select> : <TextField id="venue-city" label="City" required value={city} onChange={(event) => setCity(event.target.value)} />}
      <TextField id="court-name" label="First court name" required value={courtName} onChange={(event) => setCourtName(event.target.value)} />
      <TextField id="court-price" label="Price per hour" required min="1" type="number" value={price} onChange={(event) => setPrice(event.target.value)} />
      {error && <p className="text-sm text-brand-danger">{error}</p>}
      {saved && <p className="text-sm text-brand-success">Venue submitted for approval.</p>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit venue'}</Button>
    </form>
    <div className="mt-6"><h3 className="font-semibold">My venues</h3>{venues === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading your venues…</div> : venues.length ? venues.map((venue) => <p className="mt-2" key={venue._id}>{venue.name} — <span className="text-brand-warning">{venue.approvalStatus === 'pending' ? 'Pending approval' : venue.approvalStatus}</span></p>) : <div className="mt-2 rounded-lg border border-dashed border-neutral-300 p-4"><p className="text-neutral-600">No venues submitted yet.</p><a className="mt-2 inline-block font-semibold text-brand-primary underline" href="#venue-submission">Submit your first venue</a></div>}</div>
    </>}
    {view === 'availability' && <>
    <form className="mt-4 flex flex-col gap-3" onSubmit={submitBlock}>
      <Select id="block-court" label="Court" required value={selectedCourtId} onChange={(event) => setSelectedCourtId(event.target.value)}><option value="">Select your court</option>{venues?.flatMap((venue) => (venue.courts || []).map((court) => <option key={court._id} value={court._id}>{venue.name} · {court.name}</option>))}</Select>
      <p className="text-xs text-content-muted">Court selection is loaded from your owned venues.</p>
      <TextField id="block-date" label="Date" required type="date" value={blockDate} onChange={(event) => setBlockDate(event.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2"><TextField id="block-start" label="Start time" required type="time" value={blockStart} onChange={(event) => setBlockStart(event.target.value)} /><TextField id="block-end" label="End time" required type="time" value={blockEnd} onChange={(event) => setBlockEnd(event.target.value)} /></div>
      <TextField id="block-reason" label="Reason" value={blockReason} onChange={(event) => setBlockReason(event.target.value)} />
      {blockError && <p className="text-sm text-brand-danger" role="alert">{blockError}</p>}
      <Button type="submit" disabled={blockPending || !selectedCourtId}>{blockPending ? 'Saving…' : 'Block availability'}</Button>
    </form>
    <div className="mt-6"><h3 className="font-semibold">Existing maintenance blocks</h3>{blocks === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading blocks…</div> : blocks.length ? blocks.map((block) => <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3 text-sm" key={block._id}><div><p className="font-semibold">{block.venueName} · {block.courtName}</p><p>{formatVenueBookingTime(block.startTime)} — {block.reason || 'Maintenance'}</p></div><Button variant="danger" disabled={removingBlockId !== null} onClick={() => void deleteBlock(block._id)}>{removingBlockId === block._id ? 'Removing…' : 'Remove'}</Button></div>) : <p className="mt-2 text-neutral-600">No maintenance blocks yet.</p>}</div>
    </>}
    {view === 'stats' && <>
    <div className="mt-6"><h3 className="font-semibold">Venue stats</h3>{venueStats === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading venue stats…</div> : venueStats.length ? <div className="mt-2 grid gap-3 sm:grid-cols-2">{venueStats.map((stats) => <div className="rounded-lg border border-neutral-200 p-3" key={stats.venueId}><p className="font-semibold">{stats.venueName}</p><p className="mt-1 text-sm">Revenue: IDR {stats.revenue.toLocaleString('id-ID')}</p><p className="text-sm">Utilization: {(stats.utilization * 100).toFixed(1)}%</p></div>)}</div> : <p className="mt-2 text-neutral-600">Stats will appear after you submit a venue.</p>}</div>
    </>}
    {view === 'bookings' && <>
    <div className="mt-6"><h3 className="font-semibold">Incoming bookings</h3>{incomingBookings === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading incoming bookings…</div> : incomingBookings.length ? incomingBookings.map((booking) => <div className="mt-2 rounded-lg border border-neutral-200 p-3 text-sm" key={booking._id}><p className="font-semibold">{booking.venueName} · {booking.courtName}</p><p>{formatVenueBookingTime(booking.startTime)} — {booking.status}</p></div>) : <div className="mt-2 rounded-lg border border-dashed border-neutral-300 p-4"><p className="text-neutral-600">No incoming bookings yet.</p><p className="mt-1 text-sm text-neutral-500">Bookings for your courts will appear here.</p></div>}</div>
    </>}
  </Card>
}

function formatVenueBookingTime(value: number) {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }).format(value)
}
