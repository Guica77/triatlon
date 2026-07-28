'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { registerAthlete } from '../../actions';
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

export default function AthleteRegisterPage() {
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

    const result = await registerAthlete(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.emailConfirmRequired) {
      setSuccessMessage(
        '¡Cuenta creada con éxito! Te hemos enviado un correo de confirmación. Por favor, revisa tu bandeja de entrada para activar tu cuenta.'
      );
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <AuthLayout
      title="Crea tu Cuenta"
      subtitle="Elige tu plan para empezar a entrenar"
      isAthlete={true}
    >
      <div className="space-y-5 relative z-10">
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
              <p className="text-sm text-zinc-300 font-medium text-center leading-relaxed max-w-xs">{successMessage}</p>
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nombre</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      name="firstName"
                      type="text"
                      required
                      placeholder="Nombre"
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Apellidos</label>
                  <input
                    name="lastName"
                    type="text"
                    required
                    placeholder="Apellidos"
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3.5 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    name="email"
                    type="email"
                    placeholder="atleta@triatlonpro.com"
                    required
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Contraseña</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength */}
                {password.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-zinc-700'}`} />
                      ))}
                    </div>
                    <p className={`text-[10px] font-bold ${strength.score <= 1 ? 'text-red-400' : strength.score <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      Fortaleza: {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Confirmar Contraseña</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full bg-zinc-800/50 border rounded-xl pl-3.5 pr-3.5 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all font-mono ${
                      confirmError ? 'border-red-500/50' : 'border-zinc-700/50 focus:border-cyan-500/50'
                    }`}
                  />
                </div>
                {confirmError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] text-red-400 font-medium"
                  >
                    {confirmError}
                  </motion.p>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full mt-2 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                type="submit"
                disabled={loading || !!confirmError || strength.score <= 1}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando tu cuenta...
                  </span>
                ) : (
                  'Crear mi Cuenta'
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => router.push('/athlete/login')}
            className="text-xs text-zinc-500 hover:text-cyan-400 transition-colors font-medium"
          >
            ¿Ya eres miembro? <span className="text-cyan-500 font-bold">Inicia sesión</span>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}