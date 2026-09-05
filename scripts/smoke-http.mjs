// Test the local production server without an authenticated user or remote writes.
const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3100';
const checks = [
  ['/login', 'GET', [200]], ['/dashboard', 'GET', [307]], ['/chat', 'GET', [307]],
  ['/api/ai/chat', 'POST', [401]], ['/api/notifications/send', 'POST', [401]],
  ['/api/workouts/export-calendar', 'GET', [401]], ['/api/cron/daily-reminder', 'GET', [401, 503]],
  ['/api/exercises?page=1&pageSize=2', 'GET', [200]], ['/manifest.json', 'GET', [200]], ['/offline', 'GET', [200]],
];
for (const [path, method, expected] of checks) {
  try {
    const response = await fetch(base + path, {
      method, redirect: 'manual', signal: AbortSignal.timeout(15000),
      ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: '{}' } : {}),
    });
    const protectedPage = path === '/dashboard' || path === '/chat';
    const streamedRedirect = protectedPage && response.status === 200
      ? (await response.text()).includes('NEXT_REDIRECT;replace;/login;307;') : false;
    const passed = expected.includes(response.status) || streamedRedirect;
    console.log(JSON.stringify({ path, status: response.status, passed, redirect: response.headers.get('location') }));
    if (!passed) process.exitCode = 1;
  } catch {
    console.log(JSON.stringify({ path, passed: false, error: 'CONNECTION_FAILED' }));
    process.exitCode = 1;
  }
}
