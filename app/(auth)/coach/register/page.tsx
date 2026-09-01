'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { registerCoach } from '../../actions';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Mail, ShieldCheck, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Débil', color: 'bg-red-500' };
  if (score <= 3) return { score, label: 'Media', color: 'bg-amber-500' };
  return { score, label: 'Fuerte', color: 'bg-emerald-500' };
}

export default function CoachRegisterPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [confirmError, setConfirmError] = React.useState<string | null>(null);

  const strength = getPasswordStrength(password);

  React.useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setConfirmError('Las contraseñas no coinciden');
    } else {
      setConfirmError(null);
    }
  }, [password, confirmPassword]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword || confirmError) return;

    setLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);

    const result = await registerCoach(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.emailConfirmRequired) {
      setSuccessMessage(
        '¡Cuenta de Entrenador creada! Te hemos enviado un correo de confirmación. Revisa tu bandeja de entrada.'
      );
      setLoading(false);
    } else {
      router.push('/coach/dashboard');
    }
  }

  return (
    <AuthLayout
      title="Registro Profesional"
      subtitle="La plataforma líder para entrenadores"
    >
      <div className="space-y-5 relative z-10 overflow-x-hidden w-full pb-24 sm:pb-8">
        <AnimatePresence mode="wait">
          {successMessage ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-sm text-text-secondary font-medium text-center leading-relaxed max-w-xs">{successMessage}</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="coach-register-first-name" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Nombre</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      id="coach-register-first-name"
                      name="firstName"
                      type="text"
                      required
                      placeholder="Nombre"
                      className="w-full rounded-xl border border-border-subtle bg-bg-hover py-3 pl-10 pr-3.5 text-sm text-text-primary placeholder-zinc-600 outline-none transition-[background-color,color,border-color,box-shadow] duration-150 ease-out focus:border-bike focus:ring-1 focus:ring-bike/40 motion-reduce:transition-opacity"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="coach-register-last-name" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Apellidos</label>
                  <input
                    id="coach-register-last-name"
                    name="lastName"
                    type="text"
                    required
                    placeholder="Apellidos"
                    className="w-full rounded-xl border border-border-subtle bg-bg-hover px-3.5 py-3 text-sm text-text-primary placeholder-zinc-600 outline-none transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-150 ease-out focus:border-bike focus:ring-1 focus:ring-bike/40 active:scale-[0.99] motion-reduce:transition-opacity motion-reduce:active:scale-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="coach-register-email" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    id="coach-register-email"
                    name="email"
                    type="email"
                    placeholder="coach@triatlonpro.com"
                    required
                    className="w-full rounded-xl border border-border-subtle bg-bg-hover py-3 pl-10 pr-3.5 text-sm text-text-primary placeholder-zinc-600 outline-none transition-[background-color,color,border-color,box-shadow] duration-150 ease-out focus:border-bike focus:ring-1 focus:ring-bike/40 motion-reduce:transition-opacity"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="coach-register-password" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Contraseña</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    id="coach-register-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-border-subtle bg-bg-hover py-3 pl-10 pr-12 text-sm font-mono text-text-primary placeholder-zinc-600 outline-none transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-150 ease-out focus:border-bike focus:ring-1 focus:ring-bike/40 active:scale-[0.99] motion-reduce:transition-opacity motion-reduce:active:scale-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-text-muted transition-[color,background-color,opacity,transform] duration-150 ease-out hover:bg-surface-hover hover:text-text-secondary active:scale-[0.97] motion-reduce:transition-opacity motion-reduce:active:scale-100"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-[background-color,opacity] duration-150 ease-out motion-reduce:transition-opacity ${i <= strength.score ? strength.color : 'bg-bg-hover'}`} />
                      ))}
                    </div>
                    <p className={`text-[10px] font-bold ${strength.score <= 1 ? 'text-red-400' : strength.score <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      Fortaleza: {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="coach-register-confirm-password" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Confirmar Contraseña</label>
                <div className="relative">
                  <input
                    id="coach-register-confirm-password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full rounded-xl border py-3 pl-3.5 pr-3.5 text-sm font-mono text-text-primary placeholder-zinc-600 outline-none transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-150 ease-out focus:ring-1 focus:ring-bike/40 active:scale-[0.99] motion-reduce:transition-opacity motion-reduce:active:scale-100 ${
                      confirmError ? 'border-red-500/50' : 'border-border-subtle focus:border-bike'
                    }`}
                  />
                </div>
                {confirmError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-red-400 font-medium">
                    {confirmError}
                  </motion.p>
                )}
              </div>

              <motion.button
                className="mt-2 flex min-h-11 w-full items-center justify-center rounded-xl bg-bike py-3.5 text-sm font-bold text-text-primary transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-150 ease-out hover:bg-bike/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer motion-reduce:transition-opacity motion-reduce:active:scale-100"
                type="submit"
                disabled={loading || !!confirmError || strength.score <= 1}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando tu panel...
                  </span>
                ) : (
                  'Crear Panel de Entrenador'
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => router.push('/login?role=coach')}
            className="text-xs text-text-muted hover:text-bike transition-colors font-medium"
          >
            ¿Ya eres miembro? <span className="text-bike font-bold">Inicia sesión</span>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
