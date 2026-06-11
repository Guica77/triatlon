'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { login, signup, signInWithOAuth, sendResetPasswordEmail } from './actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';

function LoginForm() {
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [isForgotPassword, setIsForgotPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [roleSelection, setRoleSelection] = React.useState<'athlete' | 'coach'>('athlete');

  async function handleDemoLogin(role: 'athlete' | 'coach') {
    setLoading(true);
    setError(null);
    setInfoMessage(`Cargando demostración de ${role === 'coach' ? 'Entrenador' : 'Atleta'}... Conectando sesión de prueba.`);
    
    const email = role === 'coach' ? 'coach-demo@triatlonpro.com' : 'demo@triatlonpro.com';
    const password = 'demo123456';
    const firstName = 'Demo';
    const lastName = role === 'coach' ? 'Entrenador' : 'Atleta';

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      const result = await login(formData) as { error?: string; emailConfirmRequired?: boolean };
      if (result && result.error) {
        setError(`El modo demo no está disponible en este momento: ${result.error}`);
        setLoading(false);
      }
    } catch (err: any) {
      if (err?.message === 'NEXT_REDIRECT') {
        throw err;
      }
      console.error(err);
      setError('Error al iniciar el modo demostración.');
      setLoading(false);
    }
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const mode = searchParams.get('mode');
      const message = searchParams.get('message');
      const plan = searchParams.get('plan');
      if (mode === 'signup') {
        setIsSignUp(true);
      setIsForgotPassword(false);
      if (plan === 'coach') {
        setRoleSelection('coach');
      } else {
        setRoleSelection('athlete');
      }
    } else if (mode === 'demo') {
      if (plan === 'coach') {
        handleDemoLogin('coach');
      } else {
        handleDemoLogin('athlete');
      }
    } else if (mode === 'forgot') {
      setIsForgotPassword(true);
      setIsSignUp(false);
    }
      if (message === 'auth_required') {
        setInfoMessage('Es necesario iniciar sesión o crear una cuenta para poder configurar tu plan.');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    const formData = new FormData(event.currentTarget);

    if (isForgotPassword) {
      const result = await sendResetPasswordEmail(formData) as { error?: string };
      if (result && result.error) {
        setError(result.error);
      } else {
        setSuccessMessage(
          '¡Enlace de recuperación enviado con éxito! Revisa tu bandeja de entrada para continuar.'
        );
      }
      setLoading(false);
      return;
    }

    const result = (isSignUp ? await signup(formData) : await login(formData)) as { error?: string; emailConfirmRequired?: boolean };
    if (result) {
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else if (result.emailConfirmRequired) {
        setSuccessMessage(
          '¡Cuenta creada con éxito! Te hemos enviado un correo de confirmación. Por favor, revisa tu bandeja de entrada (y la carpeta de spam o correo no deseado) para activar tu cuenta antes de iniciar sesión.'
        );
        setIsSignUp(false);
        setLoading(false);
      }
    }
  }

  return (
    <div className="relative min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 overflow-hidden font-sans">
      
      {/* Ambient Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse [animation-duration:8s]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse [animation-duration:10s] [animation-delay:2s]" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-orange-500/10 rounded-full blur-[100px] mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      <div className="relative w-full max-w-md space-y-8 z-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 shadow-2xl mb-2 backdrop-blur-xl">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#cyan-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="cyan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">
            {isForgotPassword 
              ? 'Recuperar Acceso' 
              : isSignUp 
              ? 'Crear tu Legado' 
              : 'Bienvenido de Nuevo'}
          </h1>
          <p className="text-sm text-zinc-400 font-medium tracking-wide">
            {isForgotPassword
              ? 'Te enviaremos un enlace cuántico de recuperación'
              : isSignUp 
              ? 'La plataforma definitiva de alto rendimiento' 
              : 'Tu plan de entrenamiento personalizado te espera'}
          </p>
        </div>

        <div className="p-8 rounded-[2rem] bg-zinc-950/40 border border-zinc-800/60 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle card inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />

          {/* Premium Demo Buttons for Presentation */}
          {!isForgotPassword && !isSignUp && (
            <div className="mb-8 space-y-3 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent flex-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Modo Presentación</span>
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent flex-1" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDemoLogin('athlete')}
                  disabled={loading}
                  className="relative group overflow-hidden rounded-2xl p-[1px]"
                >
                  <span className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative h-full bg-zinc-950 px-4 py-3 rounded-[15px] flex flex-col items-center justify-center gap-1 transition-transform duration-300 group-hover:scale-[0.98]">
                    <span className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">🏃‍♂️ Atleta</span>
                    <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider">Demo Interactiva</span>
                  </div>
                </button>

                <button
                  onClick={() => handleDemoLogin('coach')}
                  disabled={loading}
                  className="relative group overflow-hidden rounded-2xl p-[1px]"
                >
                  <span className="absolute inset-0 bg-gradient-to-br from-orange-500 to-rose-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative h-full bg-zinc-950 px-4 py-3 rounded-[15px] flex flex-col items-center justify-center gap-1 transition-transform duration-300 group-hover:scale-[0.98]">
                    <span className="text-sm font-black text-white group-hover:text-orange-300 transition-colors">📋 Coach</span>
                    <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider">Panel Avanzado</span>
                  </div>
                </button>
              </div>
              
              <div className="flex items-center gap-3 mt-8 mb-2">
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent flex-1" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Acceso Estándar</span>
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent flex-1" />
              </div>
            </div>
          )}

          {/* Social Logins */}
          {!isForgotPassword && (
            <div className="space-y-3 relative z-10 mb-6">
              <button 
                onClick={() => signInWithOAuth('google', roleSelection)}
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium py-3.5 rounded-xl border border-zinc-800 transition-all hover:border-zinc-700 shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium shadow-inner">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center leading-relaxed font-medium shadow-inner">
                {successMessage}
              </div>
            )}

            {infoMessage && !error && !successMessage && (
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs text-center leading-relaxed font-medium shadow-inner">
                {infoMessage}
              </div>
            )}

            {isSignUp && !isForgotPassword && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nombre</label>
                    <input 
                      id="firstName"
                      name="firstName" 
                      type="text" 
                      required 
                      placeholder="Nombre"
                      title="Nombre"
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 focus:bg-zinc-900 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Apellidos</label>
                    <input 
                      id="lastName"
                      name="lastName" 
                      type="text" 
                      required 
                      placeholder="Apellidos"
                      title="Apellidos"
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 focus:bg-zinc-900 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tipo de Cuenta</label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setRoleSelection('athlete')}
                      className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        roleSelection === 'athlete' 
                          ? 'bg-zinc-800 text-white shadow-md ring-1 ring-zinc-700' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <span>🏃‍♂️ Atleta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleSelection('coach')}
                      className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        roleSelection === 'coach' 
                          ? 'bg-zinc-800 text-white shadow-md ring-1 ring-zinc-700' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <span>📋 Entrenador</span>
                    </button>
                  </div>
                  <input type="hidden" name="role" value={roleSelection} />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Correo Electrónico</label>
              <input 
                name="email" 
                type="email" 
                placeholder="atleta@triatlonpro.com" 
                required 
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 focus:bg-zinc-900 transition-all"
              />
            </div>

            {!isForgotPassword && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(null); setSuccessMessage(null); }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors font-bold uppercase tracking-wider"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <input 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 focus:bg-zinc-900 transition-all font-mono"
                />
              </div>
            )}

            <button 
              className="w-full mt-4 py-4 rounded-xl text-sm font-black text-black bg-white hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center disabled:opacity-50" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                  Procesando...
                </span>
              ) : isForgotPassword ? 'Enviar Enlace de Recuperación' : (isSignUp ? 'Crear mi Cuenta' : 'Entrar a la Plataforma')}
            </button>

          </form>

          {/* Toggle mode */}
          <div className="text-center pt-6 relative z-10">
            {isForgotPassword ? (
              <button 
                type="button" 
                onClick={() => { setIsForgotPassword(false); setError(null); setSuccessMessage(null); }}
                className="text-xs text-zinc-400 hover:text-white transition-colors font-semibold"
              >
                ← Volver a Iniciar Sesión
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMessage(null); }}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
              >
                {isSignUp 
                  ? '¿Ya eres miembro? Inicia sesión aquí' 
                  : '¿No tienes cuenta? Solicita acceso'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6">
        <div className="text-zinc-400 text-sm">Cargando...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
