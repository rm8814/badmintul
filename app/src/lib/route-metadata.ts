export function isAuthenticatedRoute(path: string) {
  return path.startsWith('/player') || path.startsWith('/venue-owner') || path.startsWith('/admin')
}

export function getRouteTitle(path: string) {
  if (path === '/') return 'badmintul — Booking lapangan badminton'
  if (isAuthenticatedRoute(path)) return 'Dashboard — badmintul'
  if (path === '/login') return 'Masuk — badmintul'
  if (path === '/signup') return 'Daftar — badmintul'
  return 'badmintul — Informasi'
}

