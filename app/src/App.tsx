import Home from './pages/Home'
import Landing from './pages/Landing'
import RoleDashboard from './components/RoleDashboard'
import PlayerBrowsePanel from './components/PlayerBrowsePanel'
import VenueOwnerPanel from './components/VenueOwnerPanel'
import SuperadminPanel from './components/SuperadminPanel'

function App() {
  const path = window.location.pathname
  if (path === '/') return <Landing />
  if (path === '/login') return <Home authMode="signIn" />
  if (path === '/player') return <RoleDashboard role="player"><PlayerBrowsePanel /></RoleDashboard>
  if (path === '/venue-owner') return <RoleDashboard role="venueOwner"><VenueOwnerPanel /></RoleDashboard>
  if (path === '/admin') return <RoleDashboard role="superadmin"><SuperadminPanel /></RoleDashboard>
  return <Home authMode="signUp" />
}

export default App
