export function isAuthorizedCronRequest(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  const secret = process.env.CRON_SECRET?.trim()
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}
