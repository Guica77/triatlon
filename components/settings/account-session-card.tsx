'use client';

import { LogOut } from 'lucide-react';
import { useState } from 'react';

export function AccountSessionCard() {
  const [open, setOpen] = useState(false);
  return <section className="rounded-2xl border border-border-default bg-surface-card p-5"><div className="flex items-start gap-3"><LogOut className="mt-0.5 h-5 w-5 text-text-secondary" /><div><h2 className="font-semibold text-text-primary">Cerrar sesión</h2><p className="mt-1 text-sm text-text-secondary">Tus datos y entrenamientos se conservarán.</p></div></div><button type="button" onClick={() => setOpen(true)} className="mt-4 min-h-11 rounded-xl border border-border-default px-4 text-sm font-semibold text-text-primary">Cerrar sesión</button>{open && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4"><div role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-surface-card p-5 shadow-2xl"><h2 className="text-lg font-bold text-text-primary">¿Cerrar sesión?</h2><p className="mt-2 text-sm text-text-secondary">Podrás volver a entrar cuando quieras.</p><div className="mt-5 flex gap-3"><button onClick={() => setOpen(false)} className="min-h-11 flex-1 rounded-xl border border-border-default font-semibold">Cancelar</button><form action="/auth/signout" method="post" className="flex-1"><button className="min-h-11 w-full rounded-xl bg-danger font-semibold text-white">Cerrar sesión</button></form></div></div></div>}</section>;
}
