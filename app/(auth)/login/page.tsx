'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { loginAthlete, loginCoach, getOAuthUrl } from '../actions';
import {
  Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Mail,
  Waves, Bike, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Role = 'athlete' | 'coach';

const ROLE_CONFIG = {
  athlete: {
    label: 'Atleta',
    icon: Waves,
    redirectPath: '/dashboard',
    placeholder: 'atleta@triatlonpro.com',
    registerPath: '/athlete/register',
  },
  coach: {
    label: 'Entrenador',
    icon: Bike,
    redirectPath: '/coach/dashboard',
    placeholder: 'coach@triatlonpro.com',
    registerPath: '/coach/register',
  },
} as const;

function UnifiedLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = React.useState<Role>(
    (searchParams.get('role') as Role) || 'athlete'
  );
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState<string | null>(null);

  const cfg = ROLE_CONFIG[role];

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
    const action = role === 'athlete' ? loginAthlete : loginCoach;
    const result = await action(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push(cfg.redirectPath), 800);
    }
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    setLoading(true);
    setError(null);
    const result = await getOAuthUrl(provider, role);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.url) {
      window.location.href = result.url;
    }
  }

  return (
    <AuthLayout title="Triatlon Pro" subtitle="Inicia sesión en tu cuenta">
      <div className="space-y-6">

        {/* Role Toggle — with smooth micro-interaction */}
        <div className="relative grid grid-cols-2 gap-2 p-1.5 bg-surface-hover rounded-lg border border-border-subtle/50">
          {(['athlete', 'coach'] as const).map(r => {
            const Icon = ROLE_CONFIG[r].icon;
            const isActive = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setError(null); }}
                className={`relative flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer select-none ${
                  isActive ? 'text-white' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="role-bg"
                    className="absolute inset-0 bg-coral-500 rounded-md shadow-button"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? '' : ''}`} />
                  {ROLE_CONFIG[r].label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 space-y-3"
            >
              <div className="w-14 h-14 rounded-full bg-coral-500/15 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-coral-500" />
              </div>
              <p className="text-base font-semibold text-text-primary">Bienvenido</p>
              <p className="text-sm text-text-muted">Redirigiendo...</p>
            </motion.div>
          ) : (
            <motion.form
              key={`form-${role}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Error state */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-run/10 border border-run/20 text-run text-xs font-medium"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); validateEmail(e.target.value); }}
                    placeholder={cfg.placeholder}
                    required
                    className={`w-full bg-surface-hover border rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors ${
                      emailError ? 'border-run/50' : 'border-border-default focus:border-coral-500/50'
                    }`}
                  />
                </div>
                {emailError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-run font-medium">
                    {emailError}
                  </motion.p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-text-primary">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="text-[10px] text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
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
                    className="w-full bg-surface-hover border border-border-default rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-coral-500/50 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-coral-500 hover:bg-coral-600 transition-colors shadow-button flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-1"
                type="submit"
                disabled={loading || !!emailError}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Verificando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Iniciar sesión
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-3 text-[11px] text-text-muted">
          <div className="flex-1 h-px bg-border-subtle" />
          <span>o continúa con</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {/* OAuth */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface-hover border border-border-default hover:border-border-default/80 transition-colors text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface-hover border border-border-default hover:border-border-default/80 transition-colors text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Apple
          </button>
        </div>

        {/* Register */}
        <p className="text-center text-xs text-text-muted">
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            onClick={() => router.push(cfg.registerPath)}
            className="font-semibold text-coral-500 hover:text-coral-400 transition-colors cursor-pointer"
          >
            Regístrate
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function UnifiedLoginPage() {
  return (
    <Suspense fallback={
      <AuthLayout title="Triatlon Pro" subtitle="Cargando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
        </div>
      </AuthLayout>
    }>
      <UnifiedLoginForm />
    </Suspense>
  );
}
