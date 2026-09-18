import { useEffect, useRef, useState, type ReactNode } from 'react'
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

const roleNav: Record<Role, { label: string; href: string }[]> = {
  player: [{ label: 'Browse courts', href: '/player' }],
  venueOwner: [{ label: 'Venue overview', href: '/venue-owner' }, { label: 'Bookings', href: '/venue-owner/bookings' }, { label: 'Stats', href: '/venue-owner/stats' }],
  superadmin: [{ label: 'Approval queue', href: '/admin' }, { label: 'Metrics', href: '/admin/metrics' }],
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

  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isUserMenuOpen) return
    function closeMenu(event: KeyboardEvent | PointerEvent) {
      if (event instanceof KeyboardEvent && event.key === 'Escape') setIsUserMenuOpen(false)
      if (event instanceof PointerEvent && userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false)
    }
    window.addEventListener('keydown', closeMenu)
    window.addEventListener('pointerdown', closeMenu)
    return () => { window.removeEventListener('keydown', closeMenu); window.removeEventListener('pointerdown', closeMenu) }
  }, [isUserMenuOpen])

  return <div className="min-h-screen bg-brand-bg"><div className="flex min-h-screen"><aside className={`${isNavOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-72 border-r border-neutral-200 bg-white px-5 py-6 shadow-xl transition-transform duration-200 lg:static lg:translate-x-0 lg:shadow-none`} aria-label="Dashboard navigation" aria-hidden={!isNavOpen}><div className="flex items-center justify-between"><a className="text-xl font-extrabold tracking-tight text-neutral-900" href={roleRoutes[role]}>badmintul<span className="text-brand-primary">.</span></a><button type="button" className="rounded-control px-2 py-1 text-xl text-neutral-600 focus-visible:outline-focus-ring lg:hidden" aria-label="Close dashboard navigation" onClick={() => setIsNavOpen(false)}>×</button></div><p className="mt-10 text-xs font-bold uppercase tracking-[.18em] text-content-muted">{roleLabels[role]}</p><nav className="mt-3 space-y-1" aria-label={`${roleLabels[role]} sections`}>{roleNav[role].map((item) => <a className={`block rounded-control px-3 py-2.5 text-sm font-bold focus-visible:outline-focus-ring ${window.location.pathname === item.href ? 'bg-brand-primary/10 text-brand-primary' : 'text-neutral-700 hover:bg-surface-subtle'}`} href={item.href} aria-current={window.location.pathname === item.href ? 'page' : undefined} key={item.href} onClick={() => setIsNavOpen(false)}>{item.label}</a>)}</nav></aside>{isNavOpen && <button type="button" className="fixed inset-0 z-30 bg-neutral-950/30 lg:hidden" aria-label="Close dashboard navigation overlay" onClick={() => setIsNavOpen(false)} /> }<div className="min-w-0 flex-1"><header className="sticky top-0 z-20 border-b border-neutral-200/70 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-md sm:px-8"><div className="content-container flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><button type="button" className="rounded-control border border-border-strong px-3 py-2 text-sm font-bold text-neutral-700 focus-visible:outline-focus-ring lg:hidden" aria-label="Open dashboard navigation" aria-expanded={isNavOpen} onClick={() => setIsNavOpen(true)}>☰</button><div><p className="text-xs font-bold uppercase tracking-[.16em] text-content-muted">Dashboard</p><h1 className="truncate text-lg font-extrabold text-neutral-900 sm:text-xl">{roleLabels[role]}</h1></div></div><div ref={userMenuRef} className="relative flex shrink-0 items-center"><button type="button" className="rounded-control border border-border-strong px-3 py-2 text-sm font-bold text-neutral-700 focus-visible:outline-focus-ring" aria-haspopup="menu" aria-expanded={isUserMenuOpen} aria-label="Open user menu" onClick={() => setIsUserMenuOpen((open) => !open)}>{roleLabels[role]} <span aria-hidden="true">▾</span></button>{isUserMenuOpen && <div className="absolute right-0 top-full z-30 mt-2 w-52 max-w-[calc(100vw-2rem)] rounded-card border border-border-subtle bg-surface p-2 shadow-card-hover" role="menu"><p className="px-3 py-2 text-xs font-bold uppercase tracking-[.16em] text-content-muted">Signed in as</p><p className="px-3 pb-2 text-sm font-bold text-neutral-900">{roleLabels[role]}</p><Button className="w-full justify-start" variant="secondary" disabled={isSigningOut} role="menuitem" onClick={() => void signOutAndReturnHome()}>{isSigningOut ? 'Signing out…' : 'Sign out'}</Button></div>}</div></div></header>{children}</div></div></div>
}







