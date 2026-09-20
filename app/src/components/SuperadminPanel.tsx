import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import Button from './ui/Button'
import Card from './ui/Card'
import Select from './ui/Select'
import PlayerBrowsePanel from './PlayerBrowsePanel'
import VenueOwnerPanel from './VenueOwnerPanel'

export default function SuperadminPanel({ view = 'queue' }: { view?: 'queue' | 'metrics' | 'venues' | 'users' | 'bookings' | 'settings' | 'viewAs' | 'impersonationLog' }) {
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.roles.getCurrentUser)
  const pending = useQuery(api.admin.listPendingVenues, user?.role === 'superadmin' ? {} : 'skip')
  const metrics = useQuery(api.admin.getMetrics, user?.role === 'superadmin' ? {} : 'skip')
  const venues = useQuery(api.admin.listAllVenues, user?.role === 'superadmin' && view === 'venues' ? {} : 'skip')
  const users = useQuery(api.admin.listUsers, user?.role === 'superadmin' && view === 'users' ? {} : 'skip')
  const allBookings = useQuery(api.admin.listAllBookings, user?.role === 'superadmin' && view === 'bookings' ? {} : 'skip')
  const settings = useQuery(api.settings.getPlatformSettings, user?.role === 'superadmin' && view === 'settings' ? {} : 'skip')
  const setApproval = useMutation(api.admin.setVenueApproval)
  const setVenueSuspended = useMutation(api.admin.setVenueSuspended)
  const setUserSuspended = useMutation(api.admin.setUserSuspended)
  const updateSettings = useMutation(api.settings.updatePlatformSettings)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [moderationAction, setModerationAction] = useState<string | null>(null)
  const [viewAsRole, setViewAsRole] = useState<'player' | 'venueOwner'>('player')
  const [viewAsUserId, setViewAsUserId] = useState('')
  const impersonatableUsers = useQuery(api.admin.listImpersonatableUsers, user?.role === 'superadmin' && view === 'viewAs' ? { role: viewAsRole } : 'skip')
  const impersonationLogs = useQuery(api.admin.listImpersonationLogs, user?.role === 'superadmin' && view === 'impersonationLog' ? {} : 'skip')
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [cancellationWindowHours, setCancellationWindowHours] = useState('')
  const [bookingLeadTimeDays, setBookingLeadTimeDays] = useState('')
  const [supportedCitiesText, setSupportedCitiesText] = useState('')
  const [settingsLoadedFor, setSettingsLoadedFor] = useState<string | null>(null)
  if (settings && settingsLoadedFor !== 'loaded') {
    setSettingsLoadedFor('loaded')
    setCancellationWindowHours(String(settings.cancellationWindowHours))
    setBookingLeadTimeDays(String(settings.bookingLeadTimeDays))
    setSupportedCitiesText(settings.supportedCities.join(', '))
  }
  async function saveSettings() {
    setSettingsError(null)
    setIsSavingSettings(true)
    try {
      await updateSettings({
        cancellationWindowHours: Number(cancellationWindowHours),
        bookingLeadTimeDays: Number(bookingLeadTimeDays),
        supportedCities: supportedCitiesText.split(',').map((city) => city.trim()).filter(Boolean),
      })
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setIsSavingSettings(false)
    }
  }
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
    {view === 'bookings' && <>
    <h3 className="mt-6 font-semibold">All bookings</h3>
    {allBookings === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading bookings…</div> : allBookings.length ? allBookings.map((booking) => <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b pb-3" key={booking._id}><div><p className="font-semibold">{booking.venueName} · {booking.courtName}</p><p className="text-sm text-neutral-600">{new Date(booking.startTime).toLocaleString()} – {new Date(booking.endTime).toLocaleString()}</p><p className="text-sm text-neutral-600">{booking.playerEmail} · {booking.status}</p></div></div>) : <p className="mt-2 text-neutral-600">No bookings found.</p>}
    </>}
    {view === 'settings' && <>
    <h3 className="mt-6 font-semibold">Platform settings</h3>
    {settings === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading settings…</div> : <form className="mt-3 space-y-4" onSubmit={(event) => { event.preventDefault(); void saveSettings() }}>
      <label className="block text-sm font-semibold">Cancellation window (hours)<input className="mt-1 block w-full rounded-lg border border-neutral-300 p-2" type="number" min="1" step="1" value={cancellationWindowHours} onChange={(event) => setCancellationWindowHours(event.target.value)} required /></label>
      <label className="block text-sm font-semibold">Booking lead time (days)<input className="mt-1 block w-full rounded-lg border border-neutral-300 p-2" type="number" min="1" step="1" value={bookingLeadTimeDays} onChange={(event) => setBookingLeadTimeDays(event.target.value)} required /></label>
      <label className="block text-sm font-semibold">Supported cities (comma-separated, empty = all allowed)<input className="mt-1 block w-full rounded-lg border border-neutral-300 p-2" type="text" value={supportedCitiesText} onChange={(event) => setSupportedCitiesText(event.target.value)} /></label>
      {settingsError && <p className="text-sm text-red-600">{settingsError}</p>}
      <Button type="submit" disabled={isSavingSettings}>{isSavingSettings ? 'Saving…' : 'Save settings'}</Button>
    </form>}
    </>}
    {view === 'viewAs' && <>
    <h3 className="mt-6 font-semibold">View as</h3>
    <p className="mt-1 text-sm text-neutral-600">See and act on the platform exactly as a specific player or venue owner sees it. Actions taken here affect their real account and are logged.</p>
    <div className="mt-3 inline-flex overflow-hidden rounded-control border border-border-strong" role="group" aria-label="Toggle between player and venue owner dashboard">
      <button type="button" aria-pressed={viewAsRole === 'player'} className={`px-4 py-2 text-sm font-bold ${viewAsRole === 'player' ? 'bg-brand-primary text-white' : 'bg-white text-neutral-700'}`} onClick={() => { setViewAsRole('player'); setViewAsUserId('') }}>Player</button>
      <button type="button" aria-pressed={viewAsRole === 'venueOwner'} className={`px-4 py-2 text-sm font-bold ${viewAsRole === 'venueOwner' ? 'bg-brand-primary text-white' : 'bg-white text-neutral-700'}`} onClick={() => { setViewAsRole('venueOwner'); setViewAsUserId('') }}>Venue owner</button>
    </div>
    <div className="mt-3 max-w-sm">{impersonatableUsers === undefined ? <div className="animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading accounts…</div> : impersonatableUsers.length ? <Select id="view-as-account" label="Account" value={viewAsUserId} onChange={(event) => setViewAsUserId(event.target.value)}><option value="">Select an account</option>{impersonatableUsers.map((candidate) => <option key={candidate._id} value={candidate._id}>{candidate.email}</option>)}</Select> : <p className="text-sm text-neutral-600">No {viewAsRole === 'player' ? 'player' : 'venue owner'} accounts available.</p>}</div>
    {viewAsUserId && <div className="mt-5">{viewAsRole === 'player' ? <PlayerBrowsePanel asUserId={viewAsUserId} onExitViewAs={() => setViewAsUserId('')} /> : <VenueOwnerPanel asUserId={viewAsUserId} onExitViewAs={() => setViewAsUserId('')} />}</div>}
    </>}
    {view === 'impersonationLog' && <>
    <h3 className="mt-6 font-semibold">View As activity log</h3>
    <p className="mt-1 text-sm text-neutral-600">Every action taken while a superadmin was viewing as another account, most recent first.</p>
    {impersonationLogs === undefined ? <div className="mt-2 animate-pulse rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500" role="status">Loading activity log…</div> : impersonationLogs.length ? <div className="mt-3 space-y-2">{impersonationLogs.map((log) => <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2 text-sm" key={log._id}><span>{log.actorEmail} acted as <span className="font-semibold">{log.targetEmail}</span> · {log.action}</span><span className="text-neutral-500">{new Date(log.createdAt).toLocaleString()}</span></div>)}</div> : <p className="mt-2 text-neutral-600">No View As activity yet.</p>}
    </>}
  </Card>
}
