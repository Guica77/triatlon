'use client';

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { UserPlus, ChevronLeft, Search, Loader2, CheckCircle2, Award, ChevronRight } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { lookupCoachByCode, getCoachDirectory } from '@/app/(app)/chat/actions';

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
  const [coaches, setCoaches] = React.useState<any[]>([]);
  const [loadingDirectory, setLoadingDirectory] = React.useState(true);
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

  React.useEffect(() => {
    async function fetchCoaches() {
      try {
        const res = await getCoachDirectory();
        if (res.coaches) {
          setCoaches(res.coaches);
        }
      } catch (err) {
        console.error('Error fetching directory:', err);
      } finally {
        setLoadingDirectory(false);
      }
    }
    fetchCoaches();
  }, []);

  const handleLookup = async (codeOverride?: string) => {
    const codeToSearch = codeOverride || props.inviteCode;
    if (!codeToSearch.trim()) return;
    
    if (codeOverride) {
      props.setInviteCode(codeOverride);
    }
    
    setLocalLoading(true);
    setError(null);
    try {
      const res = await lookupCoachByCode(codeToSearch);
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
    <motion.div
      key="step-coach"
      initial={{ opacity: 0, x: reduceMotion ? 0 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: reduceMotion ? 0 : 20 }}
      className="space-y-6"
    >
      <ProCard className="space-y-6">
        <div className="border-b border-border-default pb-4">
          <h2 className="text-xl font-medium text-text-primary flex items-center gap-2"><UserPlus className="w-5 h-5 text-coral-500" /> Elección de Entrenador</h2>
          <p className="text-sm text-text-secondary mt-1">Conéctate con tu entrenador o explora nuestro directorio de profesionales.</p>
        </div>

        <div className="flex flex-col gap-6 pt-2">
          
          {/* Option 1: Invite Code (Top area) */}
          <div className="p-5 rounded-2xl border border-border-default bg-surface-hover flex flex-col items-center text-center space-y-4 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!foundCoach ? (
                <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 flex flex-col items-center w-full max-w-md">
                  <h3 className="text-sm font-bold text-text-primary">¿Tienes un código privado?</h3>
                  <p className="text-xs text-text-secondary">Si tu entrenador te ha dado su código de invitación (Ej: GUILLEPRO), introdúcelo aquí.</p>
                  
                  <div className="flex w-full gap-2">
                    <input 
                      type="text" 
                      value={props.inviteCode} 
                      onChange={e => {
                        props.setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                        setError(null);
                      }} 
                      placeholder="CÓDIGO DE ENTRENADOR" 
                      className={`flex-1 bg-surface-card border rounded-xl px-4 py-3 text-sm focus:border-swim outline-none transition-[border-color,color] text-center font-bold tracking-widest uppercase ${error ? 'border-danger text-danger' : 'border-border-default text-swim'}`}
                    />
                    <AnimatedButton 
                      variant="primary" 
                      onClick={() => handleLookup()} 
                      disabled={!props.inviteCode.trim() || localLoading}
                      className="px-6 py-3 text-xs !bg-swim hover:!bg-swim/90 !text-white"
                    >
                      {localLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </AnimatedButton>
                  </div>
                  {error && <p className="text-[10px] text-danger font-medium">{error}</p>}
                </motion.div>
              ) : (
                <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-5 flex flex-col items-center w-full max-w-md">
                  <h3 className="text-sm font-bold text-bike flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Entrenador Encontrado</h3>
                  
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-surface-hover border-2 border-bike/50 flex items-center justify-center overflow-hidden">
                      {foundCoach.avatar_url ? (
                        <img src={foundCoach.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserPlus className="w-6 h-6 text-text-secondary" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-text-primary">{foundCoach.first_name || 'Entrenador'} {foundCoach.last_name || ''}</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider">{props.inviteCode}</p>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary font-medium pt-2">¿Eres atleta de este entrenador?</p>

                  <div className="flex w-full gap-2 mt-2">
                    <button onClick={() => setFoundCoach(null)} className="flex-1 py-2.5 rounded-xl border border-border-default text-text-secondary text-xs font-semibold hover:bg-surface-hover transition">
                      Cancelar
                    </button>
                    <AnimatedButton 
                      variant="primary" 
                      onClick={props.onNext} 
                      disabled={props.loading}
                      className="flex-1 py-2.5 text-xs !bg-bike hover:!bg-bike/90 !text-white"
                    >
                      {props.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sí, vincular'}
                    </AnimatedButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Option 2: Coach Directory Scroll */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-text-primary px-2 flex items-center justify-between">
              Entrenadores Disponibles
              {loadingDirectory && <Loader2 className="w-3 h-3 text-swim animate-spin" />}
            </h3>
            
            <div className="flex overflow-x-auto pb-4 gap-4 px-2 snap-x snap-mandatory scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none]">
              {!loadingDirectory && coaches.length === 0 && (
                <div className="w-full p-6 text-center border border-border-default rounded-2xl bg-surface-hover">
                  <p className="text-xs text-text-secondary">No hay entrenadores públicos en este momento.</p>
                </div>
              )}
              
              {coaches.map((coach) => (
                <motion.div 
                  key={coach.id}
                  whileHover={canHover ? { scale: 0.98 } : undefined}
                  className="min-w-[280px] w-[280px] flex-shrink-0 snap-center rounded-2xl border border-border-default bg-surface-card p-5 flex flex-col space-y-4 shadow-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center shrink-0 border border-border-default">
                      <UserPlus className="w-5 h-5 text-text-muted" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{coach.first_name} {coach.last_name || ''}</h4>
                      <p className="text-[10px] text-swim uppercase tracking-widest font-semibold">{coach.level || 'Entrenador PRO'}</p>
                    </div>
                  </div>
                  
                  {coach.bio && (
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                      {coach.bio}
                    </p>
                  )}
                  
                  {coach.achievements && coach.achievements.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {coach.achievements.slice(0, 3).map((ach: string, i: number) => (
                        <span key={i} className="text-[9px] px-2 py-1 rounded-md bg-surface-hover border border-border-default text-text-secondary flex items-center gap-1">
                          <Award className="w-2.5 h-2.5 text-coral-500" />
                          {ach}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-auto pt-4">
                    <AnimatedButton 
                      variant="secondary"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        handleLookup(coach.invite_code);
                      }}
                      disabled={localLoading || props.loading}
                      className="w-full py-2.5 text-xs bg-surface-card hover:bg-surface-hover text-text-primary flex items-center justify-center gap-2"
                    >
                      Seleccionar <ChevronRight className="w-3.5 h-3.5" />
                    </AnimatedButton>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>

        <div className="flex justify-between pt-4 border-t border-border-default mt-4">
          <button onClick={props.onPrev} className="px-6 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary transition flex items-center"><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</button>
          
          <AnimatedButton
            variant="secondary"
            onClick={props.onSearchDirectory}
            disabled={props.loading}
            className="px-6 py-3 text-xs !bg-surface-card hover:!bg-surface-hover !text-text-primary flex items-center gap-1.5 border border-border-default"
          >
            {props.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Omitir y continuar'} <ChevronRight className="w-3.5 h-3.5" />
          </AnimatedButton>
        </div>
      </ProCard>
    </motion.div>
  );
}
