import AuthPanel from '../components/AuthPanel'

export default function Home({ authMode }: { authMode?: 'signIn' | 'signUp' } = {}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <AuthPanel initialMode={authMode} />
    </main>
  )
}
