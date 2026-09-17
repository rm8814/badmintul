import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import AuthPanel from '../components/AuthPanel'
import VenueOwnerPanel from '../components/VenueOwnerPanel'
import SuperadminPanel from '../components/SuperadminPanel'
import PlayerBrowsePanel from '../components/PlayerBrowsePanel'

export default function Home({ authMode }: { authMode?: 'signIn' | 'signUp' } = {}) {
  const status = useQuery(api.connection.getStatus)
  const recordCheck = useMutation(api.connection.recordCheck)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-semibold text-neutral-900">badmintul.com</h1>
      <p className="max-w-md text-neutral-600">
        Phase 1 scaffold — Vite + React + TypeScript + Tailwind, ready for
        Convex and real screens.
      </p>
      <div className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white">
        Tailwind pipeline check
      </div>
      <div className="rounded-md border border-brand-accent px-4 py-2 text-sm font-medium text-brand-accent">
        Accent token check
      </div>
      <section className="rounded-xl border border-brand-accent/30 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-brand-primary">Backend connection</p>
        <p className="mt-2 text-neutral-700" data-testid="connection-status">{status?.message ?? 'Checking Convex…'}</p>
        <button className="mt-4 rounded-lg bg-brand-accent px-4 py-2 font-semibold text-white" onClick={() => void recordCheck({ message: `Round-trip confirmed at ${new Date().toLocaleTimeString()}.` })}>
          Test query + mutation
        </button>
      </section>
      <AuthPanel initialMode={authMode} />
      <VenueOwnerPanel />
      <SuperadminPanel />
      <PlayerBrowsePanel />
    </main>
  )
}
