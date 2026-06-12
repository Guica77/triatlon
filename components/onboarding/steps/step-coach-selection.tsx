'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, ChevronLeft, Search, Loader2, CheckCircle2 } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { lookupCoachByCode } from '@/app/(app)/chat/actions';

interface StepCoachSelectionProps {
  inviteCode: string;
  setInviteCode: (v: string) => void;
  onNext: () => void; // Called when confirmed
  onPrev: () => void;
  onSearchDirectory: () => void;
  loading?: boolean;
}

export function StepCoachSelection(props: StepCoachSelectionProps) {
  const [localLoading, setLocalLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [foundCoach, setFoundCoach] = React.useState<any | null>(null);

  const handleLookup = async () => {
    if (!props.inviteCode.trim()) return;
    setLocalLoading(true);
    setError(null);
    try {
      const res = await lookupCoachByCode(props.inviteCode);
      if (res.error) {
        setError(res.error);
      } else if (res.coach) {
        setFoundCoach(res.coach);
      }
    } catch (err: any) {
      setError('Error al buscar el entrenador');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <motion.div key="step-coach" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <ProCard className="space-y-6">
        <div className="border-b border-zinc-800/80 pb-4">
          <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2"><UserPlus className="w-5 h-5 text-orange-400" /> Elección de Entrenador</h2>
          <p className="text-sm text-zinc-400 mt-1">Conéctate con tu entrenador o busca uno en nuestro directorio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Option 1: Invite Code */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center text-center space-y-4 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!foundCoach ? (
                <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 flex flex-col items-center w-full">
                  <h3 className="text-sm font-bold text-zinc-100">Ya tengo un código</h3>
                  <p className="text-xs text-zinc-400">Si tu entrenador te ha dado su código de invitación (Ej: GUILLEPRO), introdúcelo aquí.</p>
                  
                  <input 
                    type="text" 
                    value={props.inviteCode} 
                    onChange={e => {
                      props.setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                      setError(null);
                    }} 
                    placeholder="CÓDIGO DE ENTRENADOR" 
                    className={`w-full max-w-[200px] bg-zinc-950 border rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all text-center font-bold tracking-widest uppercase ${error ? 'border-red-500 text-red-400' : 'border-zinc-700 text-cyan-400'}`} 
                  />
                  {error && <p className="text-[10px] text-red-400 font-medium">{error}</p>}
                  
                  <AnimatedButton 
                    variant="primary" 
                    onClick={handleLookup} 
                    disabled={!props.inviteCode.trim() || localLoading}
                    className="w-full max-w-[200px] py-3 text-xs !bg-cyan-500 hover:!bg-cyan-400 !text-black"
                  >
                    {localLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Buscar Código'}
                  </AnimatedButton>
                </motion.div>
              ) : (
                <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-5 flex flex-col items-center w-full">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Entrenador Encontrado</h3>
                  
                  <div className="flex flex-col items-center gap-2">
                    {foundCoach.avatar_url ? (
                      <img src={foundCoach.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-emerald-500/50 object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-emerald-500/50 flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-zinc-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-zinc-100">{foundCoach.first_name || 'Entrenador'} {foundCoach.last_name || ''}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{props.inviteCode}</p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 font-medium pt-2">¿Eres atleta de este entrenador?</p>

                  <div className="flex w-full gap-2 mt-2">
                    <button onClick={() => setFoundCoach(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 transition">
                      Cancelar
                    </button>
                    <AnimatedButton 
                      variant="primary" 
                      onClick={props.onNext} 
                      disabled={props.loading}
                      className="flex-1 py-2.5 text-xs !bg-emerald-500 hover:!bg-emerald-400 !text-black"
                    >
                      {props.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sí, vincular'}
                    </AnimatedButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Option 2: Search Directory */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center text-center space-y-4 justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-100">Busco un entrenador</h3>
              <p className="text-xs text-zinc-400">Entra a la aplicación y busca en nuestro directorio de entrenadores profesionales para encontrar el que mejor se adapte a ti.</p>
            </div>
            
            <AnimatedButton 
              variant="primary" 
              onClick={props.onSearchDirectory} 
              disabled={props.loading || localLoading}
              className="w-full max-w-[200px] py-3 text-xs !bg-cyan-500 hover:!bg-cyan-400 !text-black flex items-center justify-center gap-2"
            >
              {props.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                <>
                  <Search className="w-3.5 h-3.5" /> Explorar Directorio
                </>
              )}
            </AnimatedButton>
          </div>

        </div>

        <div className="flex justify-between pt-4 border-t border-zinc-800/80 mt-4">
          <button onClick={props.onPrev} className="px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white transition flex items-center"><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</button>
        </div>
      </ProCard>
    </motion.div>
  );
}
