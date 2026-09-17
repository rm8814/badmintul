import { useState, type ReactNode } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import Button from './ui/Button'
import { markSignOutInProgress } from '../lib/auth-navigation'

type Role = 'player' | 'venueOwner' | 'superadmin'

const roleLabels: Record<Role, string> = {
  player: 'Player',
  venueOwner: 'Venue owner',
  superadmin: 'Superadmin',
}

const roleRoutes: Record<Role, string> = {
  player: '/player',
  venueOwner: '/venue-owner',
  superadmin: '/admin',
}

export default function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const { signOut } = useAuthActions()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function signOutAndReturnHome() {
    setIsSigningOut(true)
    markSignOutInProgress()
    try {
      await signOut()
    } catch {
      // Navigation still clears the current app view if the server request fails.
    }
    window.location.replace('/')
  }

  return <div className="min-h-screen bg-brand-bg"><header className="border-b border-neutral-200/70 bg-white/90 px-5 py-4 shadow-sm backdrop-blur-md sm:px-8"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4"><a className="text-xl font-extrabold tracking-tight text-neutral-900" href={roleRoutes[role]}>badmintul<span className="text-brand-primary">.</span></a><div className="flex items-center gap-3"><span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">{roleLabels[role]}</span><Button variant="secondary" disabled={isSigningOut} onClick={() => void signOutAndReturnHome()}>{isSigningOut ? 'Signing out…' : 'Sign out'}</Button></div></div></header>{children}</div>
}
