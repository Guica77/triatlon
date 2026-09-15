'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Activity, Calendar, Check, ChevronLeft, Clock3, Dumbbell, Flag, Loader2, LockKeyhole, Plus, Target, Trophy, UserRoundPlus, Watch } from 'lucide-react';

const DISTANCE_LABELS: Record<string, string> = {
  sprint: 'Sprint', olimpico: 'Olímpico', half: 'Media distancia (70.3)', full: 'Larga distancia',
  '5k': '5K', '10k': '10K', medio_maraton: 'Media maratón', maraton: 'Maratón', ultra: 'Ultra',
};
const MODALITY_LABELS: Record<string, string> = {
  triatlon: 'Triatlón', duatlon: 'Duatlón', acuatlon: 'Acuatlón', acuabike: 'Acuabike', cross: 'Cross', carrera: 'Running',
};
const LEVEL_LABELS: Record<string, string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };

interface StepPlanProps {
  loading: boolean;
  summary: { raceName: string; raceDate: string | null; distance: string; modality: string; level: string; totalHours: number; targetTime: string };
  inviteCode: string;
  setInviteCode: (v: string) => void;
  wantsCoach: boolean;
  setWantsCoach: (v: boolean) => void;
  onPrev: () => void;
  onSave: () => void;
  onConnect: (provider: 'strava' | 'garmin' | 'coros' | 'polar') => Promise<void>;
}

function SummaryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="min-w-0 rounded-2xl bg-surface-hover/60 px-3.5 py-3"><div className="mb-2 flex items-center gap-2 text-text-muted">{icon}<span className="text-[11px] font-semibold">{label}</span></div><p className="truncate text-sm font-semibold text-text-primary" title={value}>{value}</p></div>;
}

function ConnectionCard({ label, detail, onClick, disabled }: { label: string; detail: string; onClick: () => void; disabled: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="group flex min-h-24 w-full items-center gap-3 rounded-[20px] border border-border-default bg-surface-card px-4 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-150 hover:border-swim/45 hover:shadow-card active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-swim/10 text-swim"><Watch className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-text-primary">{label}</span><span className="mt-0.5 block text-xs leading-5 text-text-secondary">{detail}</span></span>{disabled ? <Loader2 className="size-4 animate-spin text-text-muted" /> : <Plus className="size-4 text-text-muted transition-colors group-hover:text-swim" />}</button>;
}

export function StepPlan(props: StepPlanProps) {
  const { summary } = props;
  const isCoachFlow = props.wantsCoach || props.inviteCode.trim().length > 0;
  const modalityLabel = MODALITY_LABELS[summary.modality] || summary.modality || 'Triatlón';

  return <motion.div key="step-plan" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }} className="space-y-5 motion-reduce:transition-none">
    <header className="px-1"><span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-swim/10 px-3 py-1 text-xs font-semibold text-swim"><Check className="size-3.5" /> Preparado para guardar</span><h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Revisa tu punto de partida</h1><p className="mt-2 max-w-xl text-[15px] leading-6 text-text-secondary">Tu plan se creará con estos datos. Podrás ajustar la carga y las sesiones después, cuando lo necesites.</p></header>

    <section aria-label="Resumen del plan" className="rounded-[24px] border border-border-default bg-surface-card p-4 shadow-card sm:p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-base font-semibold text-text-primary">{modalityLabel}</p><p className="mt-0.5 text-xs text-text-secondary">Perfil inicial</p></div><span className="rounded-full bg-surface-hover px-3 py-1.5 text-xs font-medium text-text-secondary">{summary.totalHours} h/semana</span></div><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"><SummaryItem icon={<Trophy className="size-3.5" />} label="Objetivo" value={summary.raceName} /><SummaryItem icon={<Calendar className="size-3.5" />} label="Fecha" value={summary.raceDate || 'Sin fecha fija'} /><SummaryItem icon={<Flag className="size-3.5" />} label="Distancia" value={DISTANCE_LABELS[summary.distance] || summary.distance} /><SummaryItem icon={<Dumbbell className="size-3.5" />} label="Nivel" value={LEVEL_LABELS[summary.level] || summary.level} /><SummaryItem icon={<Clock3 className="size-3.5" />} label="Volumen" value={`${summary.totalHours} h/semana`} /><SummaryItem icon={<Target className="size-3.5" />} label="Marca" value={summary.targetTime || 'A definir'} /></div></section>

    <section className="rounded-[24px] border border-border-default bg-surface-card p-4 shadow-card sm:p-5"><div className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-swim/10 text-swim"><Watch className="size-5" /></span><div><h2 className="text-base font-semibold text-text-primary">Conecta tus datos</h2><p className="mt-0.5 text-sm leading-5 text-text-secondary">Es opcional. Puedes hacerlo ahora o desde Ajustes cuando tengas tu reloj a mano.</p></div></div><div className="mt-4 grid gap-2.5 sm:grid-cols-3"><ConnectionCard label="Polar" detail="Sesiones y métricas" disabled={props.loading} onClick={() => props.onConnect('polar')} /><ConnectionCard label="COROS" detail="Sesiones y métricas" disabled={props.loading} onClick={() => props.onConnect('coros')} /><ConnectionCard label="Strava" detail="Actividades recientes" disabled={props.loading} onClick={() => props.onConnect('strava')} /></div><div className="mt-3 flex items-center gap-2 rounded-xl bg-surface-hover/70 px-3 py-2.5 text-xs leading-5 text-text-secondary"><LockKeyhole className="size-3.5 shrink-0 text-text-muted" /> Garmin estará disponible cuando Garmin apruebe la integración. No ocultamos ese estado ni simulamos una conexión.</div></section>

    <section className="rounded-[24px] border border-border-default bg-surface-card p-4 shadow-card sm:p-5"><div className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bike/10 text-bike"><UserRoundPlus className="size-5" /></span><div className="min-w-0 flex-1"><h2 className="text-base font-semibold text-text-primary">¿Tienes entrenador?</h2><p className="mt-0.5 text-sm leading-5 text-text-secondary">Introduce su código si quieres que gestione tu planificación.</p></div></div><label className="sr-only" htmlFor="coach-invite-code">Código de entrenador</label><input id="coach-invite-code" type="text" value={props.inviteCode} onChange={e => { const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''); props.setInviteCode(value); props.setWantsCoach(value.trim().length > 0); }} placeholder="Código de entrenador" autoCapitalize="characters" className="mt-4 min-h-12 w-full rounded-xl border border-border-default bg-surface-hover px-4 text-sm font-semibold uppercase tracking-[0.08em] text-text-primary outline-none transition-[border-color,box-shadow] placeholder:normal-case placeholder:tracking-normal placeholder:text-text-muted focus:border-swim focus:ring-4 focus:ring-swim/10" /><p className="mt-2 text-xs leading-5 text-text-muted">{isCoachFlow ? 'Tu entrenador tendrá el control del plan; la IA no modificará sus decisiones.' : 'Sin entrenador, podrás activar recomendaciones adaptativas cuando completes el perfil.'}</p></section>

    <footer className="flex items-center justify-between gap-4 pt-1"><button type="button" onClick={props.onPrev} disabled={props.loading} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50"><ChevronLeft className="size-4" /> Atrás</button><button type="button" onClick={props.onSave} disabled={props.loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-swim px-5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] hover:bg-swim/90 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100">{props.loading ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}{props.loading ? 'Guardando…' : 'Crear mi plan'}</button></footer>
  </motion.div>;
}
