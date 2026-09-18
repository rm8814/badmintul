import { useEffect } from 'react'
import Home from './pages/Home'
import Landing from './pages/Landing'
import RoleDashboard from './components/RoleDashboard'
import PlayerBrowsePanel from './components/PlayerBrowsePanel'
import VenueOwnerPanel from './components/VenueOwnerPanel'
import SuperadminPanel from './components/SuperadminPanel'
import InfoPage from './pages/InfoPage'
import { getRouteTitle, isAuthenticatedRoute } from './lib/route-metadata'

function App() {
  const path = window.location.pathname
  useEffect(() => {
    const authenticatedRoute = isAuthenticatedRoute(path)
    const isAuthRoute = ['/login', '/signup'].includes(path)
    const title = getRouteTitle(path)
    document.title = title
    const description = document.querySelector('meta[name="description"]')
    description?.setAttribute('content', authenticatedRoute || isAuthRoute ? 'Akses akun badmintul.' : 'Temukan dan booking lapangan badminton dengan slot dan waktu yang jelas di badmintul.')
    const robots = document.querySelector('meta[name="robots"]') ?? document.createElement('meta')
    robots.setAttribute('name', 'robots')
    robots.setAttribute('content', authenticatedRoute || isAuthRoute ? 'noindex, nofollow' : 'index, follow')
    if (!robots.parentElement) document.head.appendChild(robots)
    const canonical = document.querySelector('link[rel="canonical"]')
    canonical?.setAttribute('href', `https://badmintul.com${path === '/' ? '/' : path}`)
  }, [path])
  if (path === '/') return <Landing />
  if (path === '/login') return <Home authMode="signIn" />
  if (path === '/signup') return <Home authMode="signUp" />
  if (path === '/player') return <RoleDashboard role="player"><PlayerBrowsePanel /></RoleDashboard>
  if (path === '/venue-owner') return <RoleDashboard role="venueOwner"><VenueOwnerPanel /></RoleDashboard>
  if (path === '/venue-owner/bookings') return <RoleDashboard role="venueOwner"><VenueOwnerPanel view="bookings" /></RoleDashboard>
  if (path === '/venue-owner/stats') return <RoleDashboard role="venueOwner"><VenueOwnerPanel view="stats" /></RoleDashboard>
  if (path === '/admin') return <RoleDashboard role="superadmin"><SuperadminPanel /></RoleDashboard>
  if (path === '/admin/metrics') return <RoleDashboard role="superadmin"><SuperadminPanel view="metrics" /></RoleDashboard>
  if (path === '/support') return <InfoPage eyebrow="Support" title="Bantuan badmintul" description="Temukan jawaban atau hubungi tim badmintul untuk pertanyaan tentang akun dan booking." />
  if (path === '/terms') return <InfoPage eyebrow="Informasi" title="Syarat dan ketentuan" description="Syarat dan ketentuan penggunaan badmintul akan tersedia di halaman ini." />
  if (path === '/privacy') return <InfoPage eyebrow="Informasi" title="Kebijakan privasi" description="Informasi tentang privasi dan pengelolaan data akan tersedia di halaman ini." />
  if (path === '/cancellation') return <InfoPage eyebrow="Informasi" title="Kebijakan pembatalan" description="Informasi kebijakan pembatalan booking akan tersedia di halaman ini." />
  if (path === '/venue-owner-info') return <InfoPage eyebrow="Untuk pemilik venue" title="Informasi pemilik venue" description="Informasi pendaftaran dan pengelolaan venue akan tersedia di halaman ini." />
  return <Home authMode="signUp" />
}

export default App
