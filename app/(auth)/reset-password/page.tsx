'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordProxyPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/auth/reset-password');
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6 overflow-x-hidden w-full pb-24 sm:pb-8">
      <div className="text-text-secondary text-sm">Redirigiendo a recuperación de contraseña...</div>
    </div>
  );
}
