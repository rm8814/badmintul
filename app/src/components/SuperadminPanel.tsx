import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import Button from './ui/Button'
import Card from './ui/Card'

export default function SuperadminPanel({ view = 'queue' }: { view?: 'queue' | 'metrics' | 'venues' | 'users' }) {
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.roles.getCurrentUser)
  const pending = useQuery(api.admin.listPendingVenues, user?.role === 'superadmin' ? {} : 'skip')
  const metrics = useQuery(api.admin.getMetrics, user?.role === 'superadmin' ? {} : 'skip')
  const venues = useQuery(api.admin.listAllVenues, user?.role === 'superadmin' && view === 'venues' ? {} : 'skip')
  const users = useQuery(api.admin.listUsers, user?.role === 'superadmin' && view === 'users' ? {} : 'skip')
  const setApproval = useMutation(api.admin.setVenueApproval)
  const setVenueSuspended = useMutation(api.admin.setVenueSuspended)
  const setUserSuspended = useMutation(api.admin.setUserSuspended)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [moderationAction, setModerationAction] = useState<string | null>(null)
  async function approve(venueId: string, status: 'approved' | 'rejected') {
    setPendingAction(`${venueId}:${status}`)
    try { await setApproval({ venueId: venueId as never, status }) } finally { setPendingAction(null) }
  }
  async function toggleSuspended(venueId: string, suspended: boolean) {
    setModerationAction(`venue:${venueId}`)
    try { await setVenueSuspended({ venueId: venueId as never, suspended }) } finally { setModerationAction(null) }
  }
  async function toggleUserSuspended(userId: string, suspended: boolean) {
    setModerationAction(`user:${userId}`)
    try { await setUserSuspended({ userId: userId as never, suspended }) } finally { setModerationAction(null) }
  }
  if (!isAuthenticated || user?.role !== 'superadmin') return null
  return <Card className="w-full max-w-2xl border-brand-primary/20 text-left">
    <h2 className="text-xl font-semibold text-brand-primary">Superadmin dashboard</h2>
    {view === 'metrics' && <>
    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">{metrics === undefined ? <div className="col-span-full animate-pulse rounded-lg bg-neutral-100 p-4 text-neutral-500" role="status">Loading platform metrics…</div> : <><span>Pending: {metrics.venues.pending}</span><span>Approved: {metrics.venues.approved}</span><span>Rejected: {metrics.venues.rejected}</span><span>Bookings: {metrics.bookings}</span><span>Players: {metrics.players}</span></>}</div>
    </>}
    {view === 'queue' && <>
    <h3 className="mt-6 font-semibold">Approval queue</h3>
    {pending === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading approval queue…</div> : pending.length ? pending.map((venue) => <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b pb-3" key={venue._id}><span className="min-w-0 break-words">{venue.name}</span><span className="flex shrink-0 gap-2"><Button disabled={pendingAction !== null} onClick={() => void approve(venue._id, 'approved')}>{pendingAction === `${venue._id}:approved` ? 'Approving…' : 'Approve'}</Button><Button variant="danger" disabled={pendingAction !== null} onClick={() => void approve(venue._id, 'rejected')}>{pendingAction === `${venue._id}:rejected` ? 'Rejecting…' : 'Reject'}</Button></span></div>) : <div className="mt-2 rounded-lg border border-dashed border-neutral-300 p-4"><p className="text-neutral-600">No pending venues.</p><p className="mt-1 text-sm text-neutral-500">New submissions will appear here for review.</p></div>}
    </>}
    {view === 'venues' && <>
    <h3 className="mt-6 font-semibold">All venues</h3>
    {venues === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading venues…</div> : venues.length ? venues.map((venue) => <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b pb-3" key={venue._id}><div><p className="font-semibold">{venue.name}</p><p className="text-sm text-neutral-600">{venue.address} · {venue.approvalStatus}{venue.suspended ? ' · Suspended' : ''}</p></div><Button variant={venue.suspended ? 'secondary' : 'danger'} onClick={() => void toggleSuspended(venue._id, !venue.suspended)}>{venue.suspended ? 'Unsuspend' : 'Suspend'}</Button></div>) : <p className="mt-2 text-neutral-600">No venues found.</p>}
    </>}
    {view === 'users' && <>
    <h3 className="mt-6 font-semibold">All users</h3>
    {users === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading users…</div> : users.length ? users.map((listedUser) => { const isCurrentUser = listedUser._id === user._id; return <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b pb-3" key={listedUser._id}><div><p className="font-semibold">{listedUser.email}{isCurrentUser ? ' · Current account' : ''}</p><p className="text-sm text-neutral-600">{listedUser.role}{listedUser.suspended ? ' · Suspended' : ''}</p></div>{isCurrentUser ? <span className="text-sm text-neutral-500">Your account</span> : <Button variant={listedUser.suspended ? 'secondary' : 'danger'} disabled={moderationAction !== null} onClick={() => void toggleUserSuspended(listedUser._id, !listedUser.suspended)}>{moderationAction === `user:${listedUser._id}` ? 'Saving…' : listedUser.suspended ? 'Unsuspend' : 'Suspend'}</Button>}</div> }) : <p className="mt-2 text-neutral-600">No users found.</p>}
    </>}
  </Card>
}
