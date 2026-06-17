'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from './actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await updatePassword(password);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError('Ha ocurrido un error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Establecer Nueva Contraseña
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            Elige una contraseña segura para tu cuenta
          </p>
        </div>

        <ProCard className="space-y-6 bg-white border border-zinc-200 shadow-md rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-750 text-xs text-center font-medium shadow-xs">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-750 text-xs text-center leading-relaxed font-medium shadow-xs">
                ¡Contraseña restablecida con éxito! Redirigiéndote al panel de control...
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-zinc-600 font-bold uppercase tracking-wider text-[10px]">Nueva Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                  disabled={success || loading}
                  className="w-full bg-white border border-zinc-200 rounded-xl p-3 pr-10 text-sm text-zinc-900 outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-550 hover:text-zinc-800 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-600 font-bold uppercase tracking-wider text-[10px]">Confirmar Contraseña</label>
              <input 
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••" 
                required 
                disabled={success || loading}
                className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-sm text-zinc-900 outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <AnimatedButton 
              variant="primary" 
              className="w-full mt-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-xs py-3.5 rounded-xl flex items-center justify-center disabled:opacity-50 cursor-pointer" 
              type="submit" 
              disabled={loading || success}
            >
              {loading ? 'Guardando...' : success ? '¡Guardada!' : 'Actualizar Contraseña'}
            </AnimatedButton>

          </form>

          {/* Toggle mode / Back */}
          <div className="text-center pt-2">
            <button 
              type="button" 
              onClick={() => router.push('/login')}
              className="text-xs text-zinc-500 hover:text-cyan-600 font-bold transition-colors cursor-pointer"
              disabled={loading}
            >
              Volver al inicio de sesión
            </button>
          </div>
        </ProCard>

      </div>
    </div>
  );
}
