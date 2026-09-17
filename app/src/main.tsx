import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { convex } from './lib/convex'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}><App /></ConvexAuthProvider>
  </StrictMode>,
)
