'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { loginCoach } from '../../actions';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Mail, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CoachLoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await loginCoach(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/coach/dashboard'), 800);
    }
  }

  return (
    <AuthLayout
      title="Acceso Entrenador"
      subtitle="Tu centro de control de alto rendimiento"
    >
      <div className="space-y-6 relative z-10 overflow-x-hidden w-full pb-24 sm:pb-8">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-sm text-text-secondary font-medium">¡Bienvenido教练! Cargando tu panel...</p>
            </motion.div>
          ) : (
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
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    name="email"
                    type="email"
                    placeholder="coach@triatlonpro.com"
                    required
                    className="w-full bg-bg-hover border border-border-subtle rounded-xl pl-10 pr-3.5 py-3 text-sm text-text-primary placeholder-zinc-600 outline-none focus:border-sport-bike transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="text-[10px] text-sport-bike hover:text-sport-bike transition-colors font-bold uppercase tracking-wider"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    className="w-full bg-bg-hover border border-border-subtle rounded-xl pl-3.5 pr-10 py-3 text-sm text-text-primary placeholder-zinc-600 outline-none focus:border-sport-bike transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 py-3.5 rounded-xl text-sm font-bold text-text-primary bg-sport-bike hover:bg-sport-bike/90 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
          )}
        </AnimatePresence>

        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => router.push('/coach/register')}
            className="text-xs text-text-muted hover:text-sport-bike transition-colors font-medium"
          >
            ¿No tienes cuenta? <span className="text-sport-bike font-bold">Regístrate aquí</span>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
