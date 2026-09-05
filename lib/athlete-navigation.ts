export const trainingSections = [
  { href: '/dashboard', label: 'Plan' },
  { href: '/recuperacion', label: 'Recuperación' },
  { href: '/exercises', label: 'Ejercicios' },
]

export const progressSections = [
  { href: '/resumen', label: 'Resumen semanal' },
  { href: '/analytics', label: 'Análisis' },
]

export function matchesRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function athleteArea(pathname: string) {
  if (trainingSections.some(item => matchesRoute(pathname, item.href))) return '/dashboard'
  if (progressSections.some(item => matchesRoute(pathname, item.href))) return '/resumen'
  if (matchesRoute(pathname, '/chat')) return '/chat'
  if (matchesRoute(pathname, '/settings')) return '/settings'
  return null
}
