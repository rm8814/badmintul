import AuthPanel from '../components/AuthPanel'

export default function Home({ authMode }: { authMode?: 'signIn' | 'signUp' } = {}) {
  return (
    <main className="min-h-screen bg-brand-bg px-5 py-6 sm:px-8 sm:py-8">
      <nav className="mx-auto flex max-w-6xl items-center justify-between"><a className="text-xl font-extrabold tracking-tight text-neutral-900" href="/">badmintul<span className="text-brand-primary">.</span></a><a className="text-sm font-bold text-neutral-700" href="/">Kembali ke beranda</a></nav>
      <div className="mx-auto flex max-w-6xl justify-center py-12 sm:py-16"><AuthPanel initialMode={authMode} /></div>
    </main>
  )
}
