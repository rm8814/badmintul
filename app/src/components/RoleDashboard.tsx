import { useEffect, type ReactNode } from 'react'
import { useQuery } from 'convex/react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import AppShell from './AppShell'
import { signOutInProgress } from '../lib/auth-navigation'

type Role = 'player' | 'venueOwner' | 'superadmin'

export default function RoleDashboard({ role, children }: { role: Role; children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useQuery(api.roles.getCurrentUser, isAuthenticated ? {} : 'skip')

  useEffect(() => {
    if (signOutInProgress || isLoading || (isAuthenticated && user === undefined)) return
    if (!isAuthenticated) {
      window.location.replace('/login')
    } else if (!user || user.role !== role) {
      window.location.replace('/')
    }
  }, [isAuthenticated, isLoading, role, user])

  if (isLoading || (isAuthenticated && user === undefined)) return <div className="flex min-h-screen items-center justify-center text-neutral-500">Memuat dashboard...</div>
  if (!isAuthenticated || !user || user.role !== role) return null
  if (user.suspended === true) return <AppShell role={role}><main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4"><section className="w-full max-w-md rounded-xl border border-brand-danger/30 bg-white p-6 text-center shadow-sm"><h1 className="text-xl font-semibold text-brand-danger">Your account has been suspended</h1><p className="mt-2 text-neutral-600">Please contact support if you believe this was a mistake.</p></section></main></AppShell>
  return <AppShell role={role}><main className="px-4 py-8 sm:px-8 sm:py-10"><div className="mx-auto flex w-full max-w-6xl flex-col items-stretch justify-start gap-8">{children}</div></main></AppShell>
}
