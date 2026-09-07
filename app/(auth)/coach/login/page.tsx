'use client';

import { useAuthenticatedWelcome, WelcomeReady } from '@/components/brand/authenticated-welcome';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { loginCoach } from '../../actions';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Mail, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CoachLoginPage() {
  const router = useRouter();
  const { start: startWelcome } = useAuthenticatedWelcome();
  const submitting = React.useRef(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await loginCoach(new FormData(event.currentTarget));
      if (result.error) {
        setError(result.error);
        submitting.current = false;
        setLoading(false);
        return;
      }
      startWelcome(('destination' in result && typeof result.destination === 'string') ? result.destination : '/coach/dashboard');
    } catch {
      submitting.current = false;
      setLoading(false);
      setError('No se ha podido iniciar sesión. Inténtalo de nuevo.');
    }
  }

  return (
    <AuthLayout
      title="Acceso Entrenador"
      subtitle="Tu centro de control de alto rendimiento"
    >
      <WelcomeReady immediate />
      <div className="space-y-6 relative z-10 overflow-x-hidden w-full pb-24 sm:pb-8">
        <AnimatePresence mode="wait">
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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

              <div className="space-y-1.5">
                <label htmlFor="coach-login-email" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    id="coach-login-email"
                    name="email"
                    type="email"
                    placeholder="coach@triatlonpro.com"
                    required
                    className="w-full rounded-xl border border-border-subtle bg-bg-hover py-3 pl-10 pr-3.5 text-sm text-text-primary placeholder-zinc-600 outline-none transition-[background-color,color,border-color,box-shadow] duration-150 ease-out focus:border-bike focus:ring-1 focus:ring-bike/40 motion-reduce:transition-opacity"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="coach-login-password" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="text-[10px] text-bike hover:text-bike transition-colors font-bold uppercase tracking-wider"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="coach-login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-border-subtle bg-bg-hover py-3 pl-3.5 pr-10 text-sm font-mono text-text-primary placeholder-zinc-600 outline-none transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-150 ease-out focus:border-bike focus:ring-1 focus:ring-bike/40 active:scale-[0.99] motion-reduce:transition-opacity motion-reduce:active:scale-100"
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
              </div>

              <motion.button
                className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-bike py-3.5 text-sm font-bold text-text-primary transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-150 ease-out hover:bg-bike/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer motion-reduce:transition-opacity motion-reduce:active:scale-100"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando credenciales...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Entrar al Panel
                  </span>
                )}
              </motion.button>
            </motion.form>

        </AnimatePresence>

        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => router.push('/coach/register')}
            className="text-xs text-text-muted hover:text-bike transition-colors font-medium"
          >
            ¿No tienes cuenta? <span className="text-bike font-bold">Regístrate aquí</span>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
