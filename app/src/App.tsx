import Home from './pages/Home'
import Landing from './pages/Landing'

function App() {
  const path = window.location.pathname
  if (path === '/') return <Landing />
  if (path === '/login') return <Home authMode="signIn" />
  return <Home authMode="signUp" />
}

export default App
