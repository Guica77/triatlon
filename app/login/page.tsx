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
      
      const result: any = await login(formData);
      if (result && result.error) {
        setInfoMessage('Configurando cuenta de demostración por primera vez...');
        const signupData = new FormData();
        signupData.append('email', email);
        signupData.append('password', password);
        signupData.append('firstName', firstName);
        signupData.append('lastName', lastName);
        signupData.append('role', role);
        
        const signupResult: any = await signup(signupData);
        const secondLoginResult: any = await login(formData);
        if (secondLoginResult && secondLoginResult.error) {
          setError(`El modo demo no está disponible en este momento. Por favor, crea una cuenta de ${role === 'coach' ? 'entrenador' : 'atleta'} gratis.`);
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Error al iniciar el modo demostración.');
      setLoading(false);
    }
  }

  React.useEffect(() => {
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
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    const formData = new FormData(event.currentTarget);

    if (isForgotPassword) {
      const result: any = await sendResetPasswordEmail(formData);
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

    const result: any = isSignUp ? await signup(formData) : await login(formData);
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
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
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
                onClick={() => signInWithOAuth('apple')}
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium py-3.5 rounded-xl border border-zinc-800 transition-all hover:border-zinc-700"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 5.26c.61-.75 1.02-1.8 1.02-2.85 0-.09-.01-.19-.03-.28-.96.04-2.07.64-2.71 1.4-.56.66-.99 1.73-.99 2.76 0 .1.02.21.03.22 1.02-.04 2.07-.5 2.68-1.25z"/>
                </svg>
                Continuar con Apple
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
                      name="firstName" 
                      type="text" 
                      required 
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 focus:bg-zinc-900 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Apellidos</label>
                    <input 
                      name="lastName" 
                      type="text" 
                      required 
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
