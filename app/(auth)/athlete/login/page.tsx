'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { loginAthlete } from '../../actions';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AthleteLoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState<string | null>(null);

  const validateEmail = (value: string) => {
    if (value.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Formato de email inválido');
    } else {
      setEmailError(null);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (emailError) return;

    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await loginAthlete(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 800);
    }
  }

  return (
    <AuthLayout
      title="Bienvenido Atleta"
      subtitle="Tu plan de entrenamiento personalizado te espera"
      isAthlete={true}
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
              <p className="text-sm text-text-secondary font-medium">¡Bienvenido! Cargando tu dashboard...</p>
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
              {/* Error state */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label htmlFor="athlete-login-email" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    id="athlete-login-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); validateEmail(e.target.value); }}
                    placeholder="atleta@triatlonpro.com"
                    required
                    className={`w-full rounded-xl border py-3 pl-10 pr-3.5 text-sm text-text-primary placeholder-zinc-600 outline-none transition-[background-color,color,border-color,box-shadow] duration-150 ease-out motion-reduce:transition-opacity ${
                      emailError ? 'border-red-500/50 focus:border-red-500' : 'border-border-subtle focus:border-swim'
                    }`}
                  />
                </div>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-red-400 font-medium mt-1"
                  >
                    {emailError}
                  </motion.p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="athlete-login-password" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="text-[10px] text-swim hover:text-swim transition-colors font-bold uppercase tracking-wider"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="athlete-login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-border-subtle bg-bg-hover py-3 pl-3.5 pr-10 text-sm font-mono text-text-primary placeholder-zinc-600 outline-none transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-150 ease-out focus:border-swim focus:ring-1 focus:ring-swim/40 active:scale-[0.99] motion-reduce:transition-opacity motion-reduce:active:scale-100"
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
                className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-swim py-3.5 text-sm font-bold text-text-primary transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-150 ease-out hover:bg-swim/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer motion-reduce:transition-opacity motion-reduce:active:scale-100"
                type="submit"
                disabled={loading || !!emailError}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando credenciales...
                  </span>
                ) : (
                  'Entrar a la Plataforma'
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => router.push('/athlete/register')}
            className="text-xs text-text-muted hover:text-swim transition-colors font-medium"
          >
            ¿No tienes cuenta? <span className="text-swim font-bold">Regístrate aquí</span>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
