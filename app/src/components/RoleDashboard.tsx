import { useEffect, type ReactNode } from 'react'
import { useQuery } from 'convex/react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'

type Role = 'player' | 'venueOwner' | 'superadmin'

export default function RoleDashboard({ role, children }: { role: Role; children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useQuery(api.roles.getCurrentUser, isAuthenticated ? {} : 'skip')

  useEffect(() => {
    if (isLoading || (isAuthenticated && user === undefined)) return
    if (!isAuthenticated) {
      window.location.replace('/login')
    } else if (!user || user.role !== role) {
      window.location.replace('/')
    }
  }, [isAuthenticated, isLoading, role, user])

  if (isLoading || (isAuthenticated && user === undefined)) return <div className="flex min-h-screen items-center justify-center text-neutral-500">Memuat dashboard...</div>
  if (!isAuthenticated || !user || user.role !== role) return null
  return <main className="min-h-screen bg-brand-bg px-4 py-10"><div className="mx-auto flex max-w-4xl flex-col items-center gap-6">{children}</div></main>
}
