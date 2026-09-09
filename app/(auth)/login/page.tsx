'use client';

import { useAuthenticatedWelcome, WelcomeReady } from '@/components/brand/authenticated-welcome';
import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { loginAthlete, loginCoach, getOAuthUrl } from '../actions';
import {
  Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Mail,
  Waves, Bike, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

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
  const { start: startWelcome } = useAuthenticatedWelcome();
  const submitting = React.useRef(false);
  const searchParams = useSearchParams();
  const [role, setRole] = React.useState<Role>(
    searchParams.get('role') === 'coach' ? 'coach' : 'athlete'
  );
  const [error, setError] = React.useState<string | null>(
    searchParams.get('error') === 'ProfileSetupError'
      ? 'No se pudo preparar tu perfil. Vuelve a entrar con el mismo proveedor y el rol elegido.'
      : searchParams.get('error') === 'AuthCallbackError'
        ? 'No se pudo completar el acceso. Inténtalo de nuevo.'
        : null
  );
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const canHover = React.useSyncExternalStore(
    React.useCallback((onStoreChange) => {
      const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
      mediaQuery.addEventListener('change', onStoreChange);
      return () => mediaQuery.removeEventListener('change', onStoreChange);
    }, []),
    React.useCallback(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches, []),
    () => false,
  );

  const cfg = ROLE_CONFIG[role];
  const accountDeleted = searchParams.get('accountDeleted') === '1';

  const validateEmail = (value: string) => {
    if (value.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Formato de email inválido');
    } else {
      setEmailError(null);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || emailError) return;
    submitting.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await (role === 'athlete' ? loginAthlete : loginCoach)(new FormData(event.currentTarget));
      if (result.error) {
        setError(result.error);
        submitting.current = false;
        setLoading(false);
        return;
      }
      startWelcome(('destination' in result && typeof result.destination === 'string') ? result.destination : cfg.redirectPath);
    } catch {
      submitting.current = false;
      setLoading(false);
      setError('No se ha podido iniciar sesión. Inténtalo de nuevo.');
    }
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await getOAuthUrl(provider, role);
      if (result.error || !result.url) {
        setError(result.error || 'No se ha podido abrir el proveedor de acceso.');
        submitting.current = false;
        setLoading(false);
        return;
      }
      window.location.href = result.url;
    } catch {
      submitting.current = false;
      setLoading(false);
      setError('No se ha podido conectar con el proveedor de acceso. Inténtalo de nuevo.');
    }
  }

  return (
    <AuthLayout title="TriWaveX" subtitle="Entrena con un plan que se mueve contigo." lockViewport>
      <WelcomeReady immediate />
      <div className="space-y-6">

        {accountDeleted && (
          <div role="status" className="flex items-center gap-2.5 rounded-lg border border-coral-500/25 bg-coral-500/10 p-3 text-xs font-medium text-text-primary">
            <CheckCircle className="h-4 w-4 shrink-0 text-coral-500" />
            Tu cuenta y tus datos se han eliminado correctamente.
          </div>
        )}

        {/* Role Toggle — with smooth micro-interaction */}
        <div className="relative grid grid-cols-2 gap-1 rounded-[18px] border border-white/10 bg-surface-hover/70 p-1.5">
          {(['athlete', 'coach'] as const).map(r => {
            const Icon = ROLE_CONFIG[r].icon;
            const isActive = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setError(null); }}
                className={`relative flex min-h-11 items-center justify-center gap-2.5 px-4 py-2.5 rounded-[14px] text-sm font-semibold transition-[color,background-color,box-shadow] cursor-pointer select-none ${
                  isActive ? (r === 'athlete' ? 'text-[#0B1117]' : 'text-[#0B1117]') : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="role-bg"
                    className={`absolute inset-0 rounded-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_3px_rgba(0,0,0,0.28)] ${r === 'athlete' ? 'bg-swim' : 'bg-bike'}`}
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
                    className={`w-full bg-surface-hover border rounded-[14px] pl-10 pr-3.5 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors ${
                      emailError ? 'border-run/50' : 'border-border-default focus:border-accent/50'
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
                    className="w-full bg-surface-hover border border-border-default rounded-[14px] pl-3.5 pr-10 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 transition-colors font-mono"
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
                whileHover={canHover ? { scale: 1.01 } : undefined}
                whileTap={{ scale: 0.99 }}
                className={`mt-1 flex w-full items-center justify-center gap-2 rounded-[16px] border border-white/15 py-3 text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_2px_5px_rgba(0,0,0,0.28)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${role === 'athlete' ? 'bg-swim text-[#0B1117] hover:bg-swim/90' : 'bg-bike text-[#0B1117] hover:bg-bike/90'}`}
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

        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-3 text-[11px] text-text-muted">
          <div className="flex-1 h-px bg-border-subtle" />
          <span>o continúa con</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {/* OAuth */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            disabled={loading}
            aria-label="Continuar con Apple"
            className="flex h-11 w-full items-center justify-center overflow-hidden rounded-[14px] bg-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {/* Apple serves the approved artwork, localized and at the required proportions. */}
            <img
              aria-hidden="true"
              alt=""
              className="h-11 w-full object-fill"
              src="https://appleid.cdn-apple.com/appleid/button?type=continue&color=black&border=false&border_radius=8&locale=es_ES&height=44&width=375"
            />
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-surface-hover border border-border-default hover:border-border-default/80 transition-colors text-sm font-semibold text-text-secondary hover:text-text-primary disabled:opacity-40 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
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
      <AuthLayout title="TriWaveX" subtitle="Cargando..." lockViewport>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
        </div>
      </AuthLayout>
    }>
      <UnifiedLoginForm />
    </Suspense>
  );
}
