import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import Button from './ui/Button'
import Card from './ui/Card'

export default function SuperadminPanel() {
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.roles.getCurrentUser)
  const pending = useQuery(api.admin.listPendingVenues, user?.role === 'superadmin' ? {} : 'skip')
  const metrics = useQuery(api.admin.getMetrics, user?.role === 'superadmin' ? {} : 'skip')
  const setApproval = useMutation(api.admin.setVenueApproval)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  async function approve(venueId: string, status: 'approved' | 'rejected') {
    setPendingAction(`${venueId}:${status}`)
    try { await setApproval({ venueId: venueId as never, status }) } finally { setPendingAction(null) }
  }
  if (!isAuthenticated || user?.role !== 'superadmin') return null
  return <Card className="w-full max-w-2xl border-brand-primary/20 text-left">
    <h2 className="text-xl font-semibold text-brand-primary">Superadmin dashboard</h2>
    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">{metrics === undefined ? <div className="col-span-full animate-pulse rounded-lg bg-neutral-100 p-4 text-neutral-500" role="status">Loading platform metrics…</div> : <><span>Pending: {metrics.venues.pending}</span><span>Approved: {metrics.venues.approved}</span><span>Rejected: {metrics.venues.rejected}</span><span>Bookings: {metrics.bookings}</span><span>Players: {metrics.players}</span></>}</div>
    <h3 className="mt-6 font-semibold">Approval queue</h3>
    {pending === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading approval queue…</div> : pending.length ? pending.map((venue) => <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b pb-3" key={venue._id}><span className="min-w-0 break-words">{venue.name}</span><span className="flex shrink-0 gap-2"><Button disabled={pendingAction !== null} onClick={() => void approve(venue._id, 'approved')}>{pendingAction === `${venue._id}:approved` ? 'Approving…' : 'Approve'}</Button><Button variant="danger" disabled={pendingAction !== null} onClick={() => void approve(venue._id, 'rejected')}>{pendingAction === `${venue._id}:rejected` ? 'Rejecting…' : 'Reject'}</Button></span></div>) : <div className="mt-2 rounded-lg border border-dashed border-neutral-300 p-4"><p className="text-neutral-600">No pending venues.</p><p className="mt-1 text-sm text-neutral-500">New submissions will appear here for review.</p></div>}
  </Card>
}
