'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { loginAthlete, loginCoach, getOAuthUrl } from '../actions';
import {
  Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Mail,
  Activity, Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Role = 'athlete' | 'coach';

const ROLE_CONFIG = {
  athlete: {
    label: 'Atleta',
    icon: Activity,
    accentToken: 'sport-swim',
    redirectPath: '/dashboard',
    placeholder: 'atleta@triatlonpro.com',
    registerPath: '/athlete/register',
  },
  coach: {
    label: 'Entrenador',
    icon: Users,
    accentToken: 'sport-bike',
    redirectPath: '/coach/dashboard',
    placeholder: 'coach@triatlonpro.com',
    registerPath: '/coach/register',
  },
} as const;

const PHRASES = [
  'Tu plan de entrenamiento personalizado te espera',
  'Transforma tu rendimiento con IA',
  'Conecta Garmin y Strava en segundos',
  'Periodización avanzada sin complicaciones',
  '1,324+ ejercicios con video incluidos',
  'Análisis de recuperación inteligente',
];

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
  const [phraseIdx, setPhraseIdx] = React.useState(0);
  const [email, setEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState<string | null>(null);

  const cfg = ROLE_CONFIG[role];

  React.useEffect(() => {
    const interval = setInterval(() => setPhraseIdx(i => (i + 1) % PHRASES.length), 4000);
    return () => clearInterval(interval);
  }, []);

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
    <AuthLayout
      title="Triatlon Pro"
      subtitle={role === 'athlete' ? 'Tu plan de entrenamiento personalizado' : 'Tu centro de control de alto rendimiento'}
    >
      <div className="space-y-6">
        {/* Rotating phrase */}
        <motion.p
          key={phraseIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-xs text-text-secondary font-medium text-center leading-relaxed h-8"
        >
          {PHRASES[phraseIdx]}
        </motion.p>

        {/* Role Toggle */}
        <div className="flex justify-center">
          <div className="relative inline-flex p-1 rounded-full bg-bg-hover border border-border-subtle">
            {(['athlete', 'coach'] as const).map(r => {
              const Icon = ROLE_CONFIG[r].icon;
              const isActive = role === r;
              const accent = r === 'athlete' ? 'sport-swim' : 'sport-bike';
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setError(null); }}
                  className={`relative z-10 flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
                    isActive ? 'text-white' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {ROLE_CONFIG[r].label}
                </button>
              );
            })}
            {/* Sliding indicator */}
            <motion.div
              layoutId="role-toggle-indicator"
              className={`absolute top-1 bottom-1 rounded-full ${
                role === 'athlete'
                  ? 'bg-sport-swim/20 border border-sport-swim/30'
                  : 'bg-sport-bike/20 border border-sport-bike/30'
              }`}
              initial={false}
              animate={{
                left: role === 'athlete' ? '4px' : '50%',
                right: role === 'athlete' ? '50%' : '4px',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          </div>
        </div>

        {/* Login Form */}
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-sport-swim/15 border border-sport-swim/25 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-sport-swim" />
              </div>
              <p className="text-sm text-text-primary font-medium">
                Bienvenido{role === 'coach' ? ', coach' : ''}
              </p>
              <p className="text-xs text-text-muted">Redirigiendo...</p>
            </motion.div>
          ) : (
            <motion.form
              key={`form-${role}`}
              initial={{ opacity: 0, x: role === 'athlete' ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: role === 'athlete' ? -12 : 12 }}
              transition={{ duration: 0.2 }}
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
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-sport-run/10 border border-sport-run/20 text-sport-run text-xs font-medium"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); validateEmail(e.target.value); }}
                    placeholder={cfg.placeholder}
                    required
                    className={`w-full bg-bg-hover border rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors ${
                      emailError ? 'border-sport-run/50' : 'border-border-default focus:border-sport-swim/40'
                    }`}
                  />
                </div>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-sport-run font-medium mt-1"
                  >
                    {emailError}
                  </motion.p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="text-[10px] text-text-muted hover:text-text-secondary transition-colors font-bold uppercase tracking-wider cursor-pointer"
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
                    className="w-full bg-bg-hover border border-border-default rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-sport-swim/40 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                className={`w-full mt-4 py-2.5 rounded-lg text-sm font-bold text-text-inverse bg-sport-swim hover:bg-sport-swim/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                type="submit"
                disabled={loading || !!emailError}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando credenciales...
                  </span>
                ) : (
                  <>
                    <cfg.icon className="w-4 h-4" />
                    Entrar como {cfg.label}
                  </>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-default" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-bg-card text-text-muted font-medium">o continúa con</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-bg-hover border border-border-default hover:border-border-default/60 hover:bg-bg-card transition-colors text-xs font-bold text-text-secondary hover:text-text-primary disabled:opacity-40 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-bg-hover border border-border-default hover:border-border-default/60 hover:bg-bg-card transition-colors text-xs font-bold text-text-secondary hover:text-text-primary disabled:opacity-40 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Apple
          </button>
        </div>

        {/* Register link */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => router.push(cfg.registerPath)}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors font-medium cursor-pointer"
          >
            ¿No tienes cuenta?{' '}
            <span className="text-sport-swim font-bold">
              Regístrate como {cfg.label}
            </span>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function UnifiedLoginPage() {
  return (
    <Suspense fallback={
      <AuthLayout title="Triatlon Pro" subtitle="Cargando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
        </div>
      </AuthLayout>
    }>
      <UnifiedLoginForm />
    </Suspense>
  );
}
