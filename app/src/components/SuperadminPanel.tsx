import { useMutation, useQuery } from 'convex/react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'

export default function SuperadminPanel() {
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.roles.getCurrentUser)
  const pending = useQuery(api.admin.listPendingVenues, user?.role === 'superadmin' ? {} : 'skip')
  const metrics = useQuery(api.admin.getMetrics, user?.role === 'superadmin' ? {} : 'skip')
  const setApproval = useMutation(api.admin.setVenueApproval)
  if (!isAuthenticated || user?.role !== 'superadmin') return null
  return <section className="w-full max-w-2xl rounded-xl border border-brand-primary/20 bg-white p-6 text-left shadow-sm">
    <h2 className="text-xl font-semibold text-brand-primary">Superadmin dashboard</h2>
    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5"><span>Pending: {metrics?.venues.pending ?? '…'}</span><span>Approved: {metrics?.venues.approved ?? '…'}</span><span>Rejected: {metrics?.venues.rejected ?? '…'}</span><span>Bookings: {metrics?.bookings ?? '…'}</span><span>Players: {metrics?.players ?? '…'}</span></div>
    <h3 className="mt-6 font-semibold">Approval queue</h3>
    {pending?.length ? pending.map((venue) => <div className="mt-3 flex items-center justify-between gap-3 border-b pb-3" key={venue._id}><span>{venue.name}</span><span className="flex gap-2"><button className="rounded bg-brand-success px-3 py-1 text-white" onClick={() => void setApproval({ venueId: venue._id, status: 'approved' })}>Approve</button><button className="rounded bg-brand-danger px-3 py-1 text-white" onClick={() => void setApproval({ venueId: venue._id, status: 'rejected' })}>Reject</button></span></div>) : <p className="mt-2 text-neutral-600">No pending venues.</p>}
  </section>
}
