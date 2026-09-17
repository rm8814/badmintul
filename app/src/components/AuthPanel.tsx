import { useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import Button from './ui/Button'
import Select from './ui/Select'
import TextField from './ui/TextField'

export default function AuthPanel({ initialMode = 'signUp' }: { initialMode?: 'signIn' | 'signUp' }) {
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.roles.getCurrentUser, isAuthenticated ? {} : 'skip')
  const { signIn, signOut } = useAuthActions()
  const [mode, setMode] = useState<'signIn' | 'signUp'>(initialMode)
  const [role, setRole] = useState<'player' | 'venueOwner'>('player')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) return
    const route = user.role === 'venueOwner' ? '/venue-owner' : user.role === 'superadmin' ? '/admin' : '/player'
    window.location.replace(route)
  }, [isAuthenticated, user])

  if (isAuthenticated) return <Button variant="secondary" disabled={isSigningOut} onClick={() => void signOutAndReturnToLogin()}>{isSigningOut ? 'Signing out…' : 'Sign out'}</Button>

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await signIn('password', { flow: mode, email, password, ...(mode === 'signUp' ? { name, role } : {}) })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Authentication failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function signOutAndReturnToLogin() {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch {
      // Ignore: the local session is treated as ended either way, matching
      // the library's own signOut() behavior of swallowing server errors.
    }
    window.location.replace('/')
  }

  return <form className="flex w-full max-w-sm flex-col gap-4 text-left" onSubmit={submit}>
    <div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => setMode('signUp')}>Sign up</Button><Button type="button" variant="secondary" onClick={() => setMode('signIn')}>Log in</Button></div>
    {mode === 'signUp' && <><TextField id="auth-name" label="Name" required value={name} onChange={(event) => setName(event.target.value)} /><Select id="auth-role" label="Account type" value={role} onChange={(event) => setRole(event.target.value as typeof role)}><option value="player">Player</option><option value="venueOwner">Venue owner</option></Select></>}
    <TextField id="auth-email" label="Email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
    <TextField id="auth-password" label="Password" required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
    {error && <p className="text-sm text-brand-danger">{error}</p>}
    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : mode === 'signUp' ? 'Create account' : 'Log in'}</Button>
  </form>
}
