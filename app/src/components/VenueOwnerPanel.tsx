import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'

export default function VenueOwnerPanel() {
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.roles.getCurrentUser)
  const venues = useQuery(api.venues.listMyVenues, user?.role === 'venueOwner' ? {} : 'skip')
  const createVenue = useMutation(api.venues.createVenueWithCourts)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [courtName, setCourtName] = useState('Court 1')
  const [price, setPrice] = useState('100000')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  if (!isAuthenticated || user?.role !== 'venueOwner') return null

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSaved(false)
    try {
      await createVenue({ name, address, description: '', photos: [], courts: [{ name: courtName, pricePerHour: Number(price), operatingHours: { open: '08:00', close: '22:00' } }] })
      setSaved(true)
      setName('')
      setAddress('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not submit venue')
    }
  }

  return <section className="w-full max-w-xl rounded-xl border border-brand-primary/20 bg-white p-6 text-left shadow-sm">
    <h2 className="text-xl font-semibold text-brand-primary">Venue owner dashboard</h2>
    <form className="mt-4 flex flex-col gap-3" onSubmit={submit}>
      <input required placeholder="Venue name" value={name} onChange={(event) => setName(event.target.value)} />
      <input required placeholder="Address" value={address} onChange={(event) => setAddress(event.target.value)} />
      <input required placeholder="First court name" value={courtName} onChange={(event) => setCourtName(event.target.value)} />
      <input required min="1" type="number" placeholder="Price per hour" value={price} onChange={(event) => setPrice(event.target.value)} />
      {error && <p className="text-sm text-brand-danger">{error}</p>}
      {saved && <p className="text-sm text-brand-success">Venue submitted for approval.</p>}
      <button className="rounded-lg bg-brand-primary px-4 py-2 font-semibold text-white" type="submit">Submit venue</button>
    </form>
    <div className="mt-6"><h3 className="font-semibold">My venues</h3>{venues?.length ? venues.map((venue) => <p className="mt-2" key={venue._id}>{venue.name} — <span className="text-brand-warning">{venue.approvalStatus === 'pending' ? 'Pending approval' : venue.approvalStatus}</span></p>) : <p className="mt-2 text-neutral-600">No venues submitted yet.</p>}</div>
  </section>
}
