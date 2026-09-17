import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth } from '@convex-dev/auth/react'

export default function AuthPanel({ initialMode = 'signUp' }: { initialMode?: 'signIn' | 'signUp' }) {
  const { isAuthenticated } = useConvexAuth()
  const { signIn, signOut } = useAuthActions()
  const [mode, setMode] = useState<'signIn' | 'signUp'>(initialMode)
  const [role, setRole] = useState<'player' | 'venueOwner'>('player')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated) return <button className="rounded-lg border px-4 py-2" onClick={() => void signOut()}>Sign out</button>

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await signIn('password', { flow: mode, email, password, ...(mode === 'signUp' ? { name, role } : {}) })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Authentication failed')
    }
  }

  return <form className="flex w-full max-w-sm flex-col gap-3 text-left" onSubmit={submit}>
    <div className="flex gap-2"><button type="button" className="text-brand-primary" onClick={() => setMode('signUp')}>Sign up</button><button type="button" className="text-brand-primary" onClick={() => setMode('signIn')}>Log in</button></div>
    {mode === 'signUp' && <><input required placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} /><select value={role} onChange={(event) => setRole(event.target.value as typeof role)}><option value="player">Player</option><option value="venueOwner">Venue owner</option></select></>}
    <input required type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
    <input required minLength={8} type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
    {error && <p className="text-sm text-brand-danger">{error}</p>}
    <button className="rounded-lg bg-brand-primary px-4 py-2 font-semibold text-white" type="submit">{mode === 'signUp' ? 'Create account' : 'Log in'}</button>
  </form>
}
