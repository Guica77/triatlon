'use client';

import * as React from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { deleteOwnAccount } from '@/app/(app)/settings/actions';

export function DeleteAccountCard() {
  const [open, setOpen] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function removeAccount() {
    if (confirmation !== 'ELIMINAR') return;
    setPending(true);
    setError(null);
    const result = await deleteOwnAccount();
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    window.location.assign('/login?accountDeleted=1');
  }

  return (
    <div className="rounded-xl border border-danger/25 bg-bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Eliminar cuenta</h3>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-text-muted">
            Borra definitivamente tu perfil, chats, entrenamientos y datos asociados.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="shrink-0 rounded-lg border border-danger/40 px-3 py-2 text-xs font-bold text-danger transition-colors hover:bg-danger/10">
          Eliminar
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center" role="presentation">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title" className="w-full max-w-md rounded-2xl border border-border-default bg-bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger"><AlertTriangle className="h-5 w-5" /></div>
              <button type="button" aria-label="Cerrar" disabled={pending} onClick={() => setOpen(false)} className="rounded-lg p-2 text-text-muted hover:bg-surface-hover"><X className="h-4 w-4" /></button>
            </div>
            <h2 id="delete-account-title" className="mt-4 text-lg font-extrabold text-text-primary">¿Eliminar tu cuenta definitivamente?</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">Esta acción no se puede deshacer. Se eliminarán todos tus datos de Triatlon Pro.</p>
            <label className="mt-5 block text-xs font-bold text-text-secondary" htmlFor="delete-confirmation">Escribe ELIMINAR para confirmar</label>
            <input id="delete-confirmation" autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="mt-2 w-full rounded-lg border border-border-default bg-surface-hover px-3 py-3 text-sm text-text-primary outline-none focus:border-danger" />
            {error && <p role="alert" className="mt-3 text-xs text-danger">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button type="button" disabled={pending} onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-border-default px-4 py-3 text-sm font-bold text-text-secondary">Cancelar</button>
              <button type="button" disabled={pending || confirmation !== 'ELIMINAR'} onClick={removeAccount} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Eliminar cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
