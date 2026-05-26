'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/login?mode=forgot');
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6">
      <div className="text-zinc-400 text-sm">Redirigiendo a recuperación de contraseña...</div>
    </div>
  );
}
