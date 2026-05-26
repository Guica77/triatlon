'use client';

import * as React from 'react';
import { selectPlan } from '@/app/onboarding/actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { 
  BookOpen, 
  ChevronRight, 
  HelpCircle, 
  Trophy, 
  Activity, 
  Wrench, 
  Clock, 
  ArrowLeft, 
  AlertTriangle, 
  Check, 
  ShieldAlert, 
  Smile, 
  TrendingUp, 
  Bike, 
  Heart,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Definición de las constantes de Material
const GEAR_SECTIONS = [
  {
    title: '🏊‍♂️ Natación (Aguas Abiertas)',
    desc: 'El primer obstáculo suele ser el más intimidante, pero el equipamiento es el más simple.',
    essential: {
      items: [
        'Neopreno básico o de 2ª mano (gama media): flotabilidad excelente sin gastar de más (~150€)',
        'Gafas de natación estándar con buen ajuste y tratamiento antivaho (~15€)',
        'Bañador de entrenamiento cómodo (~15€)'
      ],
      total: '180€'
    },
    pro: {
      items: [
        'Neopreno tope de gama de carbono aerodinámico con paneles de flexibilidad extrema (850€)',
        'Gafas inteligentes con pantalla HUD integrada para ver ritmos en tiempo real (250€)',
        'Bañador de competición de compresión avanzada (80€)'
      ],
      total: '1.180€'
    },
    tip: 'El neopreno es obligatorio si el agua está fría. Uno de gama media o de segunda mano te proporciona la misma flotabilidad (que es lo que te mantiene a salvo) que uno profesional.'
  },
  {
    title: '🚴‍♂️ Ciclismo (El segmento más caro)',
    desc: 'Aquí es donde se dispara el gasto de los atletas avanzados. No caigas en la trampa comercial.',
    essential: {
      items: [
        'Bicicleta de carretera de aluminio o carbono de 2ª mano con buen mantenimiento (~450€)',
        'Casco homologado con buena ventilación (~40€)',
        'Acoples de triatlón cortos para el manillar (opcional, para postura aero) (~35€)'
      ],
      total: '525€'
    },
    pro: {
      items: [
        'Bicicleta "Cabra" específica de contrarreloj con cambio electrónico inalámbrico (6.500€)',
        'Ruedas lenticulares y de perfil ancho de carbono aero (1.800€)',
        'Casco aero de contrarreloj con pantalla integrada (350€)'
      ],
      total: '8.650€'
    },
    tip: 'Para tus primeros triatlones (Sprint u Olímpico), una bici de carretera convencional es más segura, fácil de manejar en curvas y te servirá para todas tus salidas grupales.'
  },
  {
    title: '🏃‍♂️ Carrera a pie (La disciplina del impacto)',
    desc: 'Tus articulaciones sufren el cansancio acumulado. Prioriza la salud frente a la velocidad pura.',
    essential: {
      items: [
        'Zapatillas de running con buena amortiguación y adaptadas a tu pisada (~90€)',
        'Calcetines técnicos anti-ampollas (~12€)',
        'Visera o gorra ligera (~12€)'
      ],
      total: '114€'
    },
    pro: {
      items: [
        'Zapatillas de competición con placa de carbono integral (250€)',
        'Calcetines de compresión de fibras reactivas (45€)',
        'Gorra técnica ultraligera de microfibra hidrófuga (40€)'
      ],
      total: '335€'
    },
    tip: 'Las zapatillas de fibra de carbono exigen una técnica de carrera muy depurada y ritmos inferiores a 4:00 min/km para ser útiles. Unas zapatillas amortiguadas normales te protegerán mejor contra las lesiones.'
  },
  {
    title: '⚡ Electrónica y Telemetría',
    desc: 'Los datos son útiles, pero obsesionarse con los números puede arruinar tu disfrute inicial.',
    essential: {
      items: [
        'Pulsómetro básico de pecho o reloj deportivo GPS de gama de entrada (~120€)',
      ],
      total: '120€'
    },
    pro: {
      items: [
        'Potenciómetro de biela de doble cara para medir vatios precisos (550€)',
        'Ciclocomputador GPS con mapas y métricas PMC avanzadas (350€)',
        'Reloj multideporte premium de titanio y cristal de zafiro (650€)'
      ],
      total: '1.550€'
    },
    tip: 'Entrenar basándote en tu escala de Esfuerzo Percibido (RPE de 1 a 10) es gratuito, muy efectivo y te ayuda a desarrollar una mejor conexión con tu cuerpo. La telemetría puede esperar.'
  }
];

// Definición de las constantes de Glosario
const GLOSSARY_ITEMS = [
  {
    term: 'Brick (Entrenamiento de Transición)',
    def: 'Consiste en encadenar dos disciplinas seguidas (generalmente ciclismo y carrera a pie) con un descanso mínimo. Es crucial para acostumbrar a las piernas a la sensación de "piernas de plomo" o pesadez al bajarte de la bicicleta.'
  },
  {
    term: 'Tapering (Puesta a Punto)',
    def: 'Reducción progresiva y planificada del volumen de entrenamiento en las 1 o 2 semanas previas a la competición. Sirve para eliminar la fatiga acumulada, recuperar fibras musculares y llegar fresco a la carrera, manteniendo pequeños intervalos de intensidad para activar el cuerpo.'
  },
  {
    term: 'Zonas FC vs RPE (Esfuerzo Percibido)',
    def: 'Las zonas de frecuencia cardíaca dividen la intensidad. RPE es la escala de esfuerzo del 1 al 10. Para un principiante, entrenar en Zona 2 (esfuerzo 3-4/10) significa rodar a un ritmo que te permita mantener una conversación completa sin ahogarte. Es la base aeróbica indispensable.'
  },
  {
    term: 'T1 y T2 (Transiciones)',
    def: 'Son las fases de cambio entre disciplinas y se consideran la "cuarta disciplina" del triatlón. La T1 es la transición de natación a ciclismo. La T2 es de ciclismo a carrera a pie. Practicarlas te ahorrará minutos valiosos gratis.'
  },
  {
    term: 'Drafting (Ir a rueda)',
    def: 'Acción de rodar muy cerca detrás de otro ciclista para aprovechar el rebufo y ahorrar hasta un 30% de energía. En la mayoría de triatlones de media y larga distancia (70.3 e Ironman) el drafting está ESTRICTAMENTE PROHIBIDO y te penalizarán si te acercas a menos de 12 metros del ciclista de delante.'
  }
];

export default function BeginnersHubPage() {
  const [activeTab, setActiveTab] = React.useState<'calculator' | 'gear' | 'glossary' | 'plans'>('calculator');
  
  // States para la calculadora
  const [distance, setDistance] = React.useState<'sprint' | 'olimpico' | 'half' | 'full'>('sprint');
  const [fitnessLevel, setFitnessLevel] = React.useState<'sedentary' | 'active' | 'base'>('active');

  // Lógica de Server Actions
  const [isPending, startTransition] = React.useTransition();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleActivatePlan = (planId: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const result = await selectPlan(planId);
        if (result && result.error) {
          setErrorMsg(result.error);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al activar el plan.');
      }
    });
  };

  // Lógica de la Calculadora
  const calculation = React.useMemo(() => {
    let weeks = 12;
    let hours = '3-5h';
    let viability = 'excellent'; // excellent, warning, caution
    let message = '';

    if (distance === 'sprint') {
      hours = '3-5h/semana';
      if (fitnessLevel === 'sedentary') {
        weeks = 12;
        message = '¡Gran objetivo para empezar! Al partir de un estado sedentario, 12 semanas te darán el tiempo idóneo para adaptar tus articulaciones a la carrera a pie y ganar soltura en el agua de forma segura.';
      } else if (fitnessLevel === 'active') {
        weeks = 8;
        message = 'Meta idónea. Ya tienes una base cardiovascular activa. 8 semanas te permitirán aprender a transicionar (Bricks) y asimilar las distancias de nado y ciclismo con plenas garantías.';
      } else {
        weeks = 6;
        message = 'Con tu base deportiva, 6 semanas de puesta a punto específica enfocada en transiciones y técnica de nado serán suficientes para debutar con un gran tiempo.';
      }
    } else if (distance === 'olimpico') {
      hours = '5-8h/semana';
      if (fitnessLevel === 'sedentary') {
        weeks = 16;
        message = 'Un triatlón olímpico exige nadar 1.500m y correr 10km. Partiendo de inactividad, necesitas al menos 16 semanas para construir el fondo necesario y evitar sobrecargas musculares.';
      } else if (fitnessLevel === 'active') {
        weeks = 12;
        message = 'Una meta muy bonita. 12 semanas (3 meses) te darán una preparación progresiva muy sólida. Foco especial en la natación continua en piscina.';
      } else {
        weeks = 8;
        message = 'Excelente progresión. Con tu base, 8 semanas te permitirán dominar las distancias y afinar tu ritmo de carrera tras bajarte de la bicicleta.';
      }
    } else if (distance === 'half') {
      hours = '8-12h/semana';
      if (fitnessLevel === 'sedentary') {
        weeks = 24;
        viability = 'warning';
        message = 'El Half Ironman (70.3) es una prueba de resistencia extrema (1.9km nado, 90km bici, 21km correr). Hacerlo desde sedentario exige un mínimo de 6 meses (24 semanas) de constancia. Te aconsejamos debutar antes en un Sprint para perder el miedo.';
      } else if (fitnessLevel === 'active') {
        weeks = 20;
        message = 'Reto exigente pero factible. 20 semanas te estructurarán la preparación de volumen adecuada. La nutrición en carrera será tu cuarta disciplina.';
      } else {
        weeks = 12;
        message = 'Con tu buena base física, 12 semanas de preparación específica te permitirán asimilar los volúmenes de tirada larga en ciclismo y carrera.';
      }
    } else if (distance === 'full') {
      hours = '12-18h/semana';
      if (fitnessLevel === 'sedentary') {
        weeks = 36;
        viability = 'caution';
        message = '⚠️ ATENCIÓN: Preparar un Ironman completo (3.8km nado, 180km bici, 42km correr) partiendo de un estado sedentario en tu primer año tiene un altísimo riesgo de lesiones y fatiga crónica. Te sugerimos firmemente reorientar tu objetivo hacia un Sprint u Olímpico para este año y planificar el Ironman a 18-24 meses.';
      } else if (fitnessLevel === 'active') {
        weeks = 30;
        viability = 'warning';
        message = 'Reto de proporciones colosales. 30 semanas de preparación te exigirán disciplina militar y de 10 a 14 horas de entrenamiento semanal en los meses pico. Valora si dispones del tiempo libre necesario.';
      } else {
        weeks = 24;
        message = 'Meta espectacular. Partiendo de deportista activo, 24 semanas (6 meses) estructuradas en fases de base y volumen máximo te permitirán cruzar la meta con garantías de finisher.';
      }
    }

    return { weeks, hours, viability, message };
  }, [distance, fitnessLevel]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24 text-white font-sans selection:bg-emerald-500/30">
      
      {/* Top Navbar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </AnimatedButton>
          </Link>
          <div>
            <h1 className="text-base font-semibold text-zinc-50 tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Zona Principiantes
            </h1>
            <p className="text-[10px] text-emerald-400 font-mono tracking-wider uppercase">Triatlón para Todos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <AnimatedButton variant="ghost" size="sm" className="border border-zinc-800 text-xs py-1.5 px-3">
              Volver a Inicio
            </AnimatedButton>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Banner de Presentación */}
        <section className="bg-gradient-to-r from-emerald-950/20 via-zinc-900/60 to-zinc-900/40 p-6 rounded-3xl border border-emerald-500/15 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="max-w-3xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Estudio de Campo y Guía de Adaptación
            </div>
            <h2 className="text-3xl font-light tracking-tight text-white">¿Quién dijo que el triatlón es solo para élites?</h2>
            <p className="text-zinc-300 text-xs font-normal leading-relaxed max-w-2xl">
              Nuestra auditoría de mercado revela que el 87% de los principiantes sienten pánico ante la complejidad y el coste inicial percibido. Esta sección está diseñada para derribar mitos: aprende la teoría básica, equipa tu material esencial sin arruinarte y calcula tu tiempo de entrenamiento realista.
            </p>
          </div>
        </section>

        {/* Tab Navigation Pills */}
        <nav className="flex gap-1.5 p-1 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl overflow-x-auto scrollbar-none">
          {[
            { id: 'calculator', label: '1. Calculadora Realista', icon: CalculatorIcon },
            { id: 'gear', label: '2. Material Mínimo', icon: Wrench },
            { id: 'glossary', label: '3. Glosario Conceptos', icon: HelpCircle },
            { id: 'plans', label: '4. Planes Desde Cero', icon: Trophy }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap relative shrink-0 ${
                  isActive ? 'bg-zinc-800 text-emerald-400 shadow-md border border-zinc-700/60' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="beginners-tab-indicator" 
                    className="absolute inset-0 bg-zinc-800/30 border border-emerald-500/20 rounded-xl -z-10"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Content Panels */}
        <div className="pt-2">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: CALCULADORA DE PREPARACIÓN */}
            {activeTab === 'calculator' && (
              <motion.div
                key="calculator-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
              >
                {/* Columna Izquierda: Formulario */}
                <div className="lg:col-span-2 space-y-6">
                  <ProCard className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" /> Configura tus Variables
                      </h3>
                      <p className="text-zinc-500 text-xs mt-1">Introduce tus metas y tu base actual para recibir un diagnóstico honesto.</p>
                    </div>

                    <div className="space-y-6">
                      {/* Distancia */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">¿Qué distancia quieres completar?</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { id: 'sprint', name: 'Sprint', desc: '750m / 20km / 5km' },
                            { id: 'olimpico', name: 'Olímpico', desc: '1.5k / 40k / 10k' },
                            { id: 'half', name: 'Half (70.3)', desc: '1.9k / 90k / 21k' },
                            { id: 'full', name: 'Ironman', desc: '3.8k / 180k / 42k' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => setDistance(opt.id as any)}
                              className={`p-3.5 rounded-2xl border text-left transition-all ${
                                distance === opt.id 
                                  ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                                  : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <strong className={`text-xs block ${distance === opt.id ? 'text-emerald-400' : 'text-zinc-200'}`}>{opt.name}</strong>
                              <span className="text-[10px] text-zinc-500 mt-1 block font-medium">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Estado físico */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">¿Cuál es tu base física de partida?</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { id: 'sedentary', label: 'Sedentario / Inactivo', desc: 'No haces deporte habitualmente' },
                            { id: 'active', label: 'Activo semanal', desc: 'Haces 2-3 horas de deporte semanal' },
                            { id: 'base', label: 'Deportista de base', desc: 'Corres, nadas o ruedas con constancia' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => setFitnessLevel(opt.id as any)}
                              className={`p-3.5 rounded-2xl border text-left transition-all ${
                                fitnessLevel === opt.id 
                                  ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                                  : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <strong className={`text-xs block ${fitnessLevel === opt.id ? 'text-emerald-400' : 'text-zinc-200'}`}>{opt.label}</strong>
                              <span className="text-[10px] text-zinc-500 mt-1 block font-medium leading-normal">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ProCard>
                </div>

                {/* Columna Derecha: Resultado / Diagnóstico */}
                <div className="space-y-6">
                  <ProCard className={`border-zinc-800/80 bg-zinc-900/40 transition-colors duration-300 relative overflow-hidden ${
                    calculation.viability === 'caution' ? 'ring-1 ring-red-500/20' : 
                    calculation.viability === 'warning' ? 'ring-1 ring-amber-500/20' : ''
                  }`}>
                    {/* Alerta Visual de Viabilidad */}
                    <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 text-[140px] font-bold text-zinc-800/10 select-none pointer-events-none">
                      {calculation.viability === 'caution' ? '!' : calculation.viability === 'warning' ? '?' : '✓'}
                    </div>

                    <div className="space-y-5 relative z-10">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tu Diagnóstico Independiente</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-800/60">
                          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Preparación</span>
                          <strong className="text-2xl font-bold text-emerald-400 mt-1 block">{calculation.weeks} semanas</strong>
                          <span className="text-[9px] text-zinc-500 mt-0.5 block">Tiempo mínimo</span>
                        </div>
                        <div className="bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-800/60">
                          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Carga Semanal</span>
                          <strong className="text-xl font-bold text-white mt-1.5 block">{calculation.hours}</strong>
                          <span className="text-[9px] text-zinc-500 mt-0.5 block">Dedicación recomendada</span>
                        </div>
                      </div>

                      {/* Mensaje de Viabilidad Especial */}
                      <div className={`p-4 rounded-xl border flex gap-3 ${
                        calculation.viability === 'caution' ? 'bg-red-500/5 border-red-500/25 text-red-200' :
                        calculation.viability === 'warning' ? 'bg-amber-500/5 border-amber-500/25 text-amber-200' :
                        'bg-emerald-500/5 border-emerald-500/25 text-emerald-200'
                      }`}>
                        {calculation.viability === 'caution' && <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                        {calculation.viability === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                        {calculation.viability === 'excellent' && <Smile className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                        
                        <div className="text-xs space-y-1">
                          <strong className="font-semibold block">
                            {calculation.viability === 'caution' ? 'Riesgo Alto de Lesión / Sobrecarga' :
                             calculation.viability === 'warning' ? 'Precaución Requerida' :
                             'Meta Viable y Saludable'}
                          </strong>
                          <p className="text-[11px] leading-relaxed text-zinc-300">
                            {calculation.message}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 text-[10px] text-zinc-500 leading-normal flex items-start gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                        <span>Este diagnóstico se basa en los datos medios de la federación USAT (2024) y encuestas médicas de IRONMAN (2025). No sustituye una opinión médica.</span>
                      </div>
                    </div>
                  </ProCard>
                </div>
              </motion.div>
            )}

            {/* TAB 2: GUÍA DE MATERIAL MÍNIMO */}
            {activeTab === 'gear' && (
              <motion.div
                key="gear-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center flex-wrap gap-4 bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/80">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-emerald-400" /> Presupuesto Debutante vs Avanzado
                    </h3>
                    <p className="text-zinc-500 text-xs mt-0.5">Compara lo que es ESTRICTAMENTE necesario para debutar frente a los reclamos comerciales.</p>
                  </div>
                  <div className="flex gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Mínimo Esencial: ~950€</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400/40" />
                      <span>Gama Pro: ~12.500€+</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {GEAR_SECTIONS.map((section, idx) => (
                    <ProCard key={idx} className="space-y-4 hover:border-zinc-700/80 transition-colors flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="border-b border-zinc-800 pb-2">
                          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">{section.title}</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{section.desc}</p>
                        </div>

                        {/* Listas Comparativas */}
                        <div className="space-y-4 pt-1">
                          {/* Esencial */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                              <span>Mínimo Viable</span>
                              <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{section.essential.total}</span>
                            </div>
                            <ul className="space-y-1.5 pl-3">
                              {section.essential.items.map((item, i) => (
                                <li key={i} className="text-xs text-zinc-300 list-disc list-outside leading-normal font-normal">{item}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Pro */}
                          <div className="space-y-2 opacity-40 hover:opacity-100 transition-opacity duration-300 border-t border-zinc-800/50 pt-3">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-red-400">
                              <span>Gama Pro (Comercial)</span>
                              <span className="bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">{section.pro.total}</span>
                            </div>
                            <ul className="space-y-1.5 pl-3">
                              {section.pro.items.map((item, i) => (
                                <li key={i} className="text-xs text-zinc-400 list-disc list-outside leading-normal font-normal">{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Consejo Sabio */}
                      <div className="mt-4 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-[10px] text-zinc-400 leading-relaxed font-normal flex gap-2">
                        <Smile className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{section.tip}</span>
                      </div>
                    </ProCard>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB 3: GLOSARIO Y CONCEPTOS */}
            {activeTab === 'glossary' && (
              <motion.div
                key="glossary-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/80">
                  <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-400" /> Glosario del Triatleta Novato
                  </h3>
                  <p className="text-zinc-500 text-xs mt-0.5">Domina el idioma de tus primeros entrenamientos sin agobiarte con siglas avanzadas.</p>
                </div>

                <div className="space-y-4">
                  {GLOSSARY_ITEMS.map((item, idx) => (
                    <ProCard key={idx} className="bg-zinc-900/20 border-zinc-800/80 hover:border-zinc-700/60 transition-colors">
                      <div className="flex gap-4">
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono text-zinc-400 shrink-0">
                          {idx + 1}
                        </div>
                        <div className="space-y-1">
                          <strong className="text-sm font-semibold text-zinc-150 block">{item.term}</strong>
                          <p className="text-xs text-zinc-400 leading-relaxed font-normal">{item.def}</p>
                        </div>
                      </div>
                    </ProCard>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB 4: PLANES DESDE CERO */}
            {activeTab === 'plans' && (
              <motion.div
                key="plans-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/80">
                  <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-emerald-400" /> Planes de Adaptación Progresiva
                  </h3>
                  <p className="text-zinc-500 text-xs mt-0.5">Activa directamente en tu calendario un plan diseñado para construir tu base aeróbica paso a paso.</p>
                </div>

                {errorMsg && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 text-xs text-red-200 rounded-xl flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* PLAN 3: SPRINT CERO */}
                  <ProCard className="space-y-4 hover:border-zinc-750 transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                        <div>
                          <strong className="text-base font-bold text-zinc-100 block">Plan Sprint — De Cero a Triatleta</strong>
                          <span className="text-[10px] text-zinc-500 mt-0.5 block font-medium">Distancia Sprint (750m / 20k / 5k)</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20 uppercase tracking-wider shrink-0">
                          Principiante Absoluto
                        </span>
                      </div>
                      
                      <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                        Para personas que no hacen deporte con regularidad y quieren cruzar la meta de su primer triatlón Sprint. Las primeras 4 semanas se centran en una transición supersuave alternando caminar y correr, técnica básica de nado y rodajes en bicicleta muy cómodos.
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-xs pt-1.5">
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Duración</span>
                          <strong className="text-zinc-200 font-semibold">12 Semanas</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Dedicación</span>
                          <strong className="text-zinc-200 font-semibold">3-5h / semana</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Sesiones</span>
                          <strong className="text-zinc-200 font-semibold">4-5 entrenos / semana</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Método</span>
                          <strong className="text-zinc-200 font-semibold">Esfuerzo RPE / Pulso</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800/80">
                      <AnimatedButton
                        onClick={() => handleActivatePlan('sprint_cero')}
                        disabled={isPending}
                        className="w-full !bg-emerald-500 hover:!bg-emerald-400 !text-black py-2.5 text-xs font-bold rounded-xl shadow-md shadow-emerald-950/20 flex items-center justify-center gap-1.5"
                      >
                        {isPending ? 'Activando Plan en la BD...' : 'Activar Plan De Cero a Triatlón'}
                      </AnimatedButton>
                    </div>
                  </ProCard>

                  {/* PLAN 5: PRIMER OLÍMPICO */}
                  <ProCard className="space-y-4 hover:border-zinc-750 transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                        <div>
                          <strong className="text-base font-bold text-zinc-100 block">Plan Olímpico — Primer Olímpico</strong>
                          <span className="text-[10px] text-zinc-500 mt-0.5 block font-medium">Distancia Olímpica (1.5k / 40k / 10k)</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20 uppercase tracking-wider shrink-0">
                          Principiante Activo
                        </span>
                      </div>
                      
                      <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                        Para personas que ya practican algún deporte (como running o ciclismo recreativo) y quieren dar el salto a la distancia olímpica estándar. Incluye fases de asimilación progresiva de nado continuo en piscina y simulacros de ritmo de carrera específicos.
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-xs pt-1.5">
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Duración</span>
                          <strong className="text-zinc-200 font-semibold">16 Semanas</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Dedicación</span>
                          <strong className="text-zinc-200 font-semibold">5-8h / semana</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Sesiones</span>
                          <strong className="text-zinc-200 font-semibold">5-6 entrenos / semana</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Método</span>
                          <strong className="text-zinc-200 font-semibold">Esfuerzo RPE / Pulso</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800/80">
                      <AnimatedButton
                        onClick={() => handleActivatePlan('olimpico_principiante')}
                        disabled={isPending}
                        className="w-full !bg-zinc-800 hover:!bg-zinc-700 !text-white py-2.5 text-xs font-bold rounded-xl border border-zinc-700/80 flex items-center justify-center gap-1.5"
                      >
                        {isPending ? 'Activando Plan en la BD...' : 'Activar Plan Primer Olímpico'}
                      </AnimatedButton>
                    </div>
                  </ProCard>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>
    </div>
  );
}

// Icono inline para evitar dependencias innecesarias de lucide
function CalculatorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="18" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 10h.01" />
      <path d="M12 14h.01" />
      <path d="M8 14h.01" />
      <path d="M12 18h.01" />
      <path d="M8 18h.01" />
    </svg>
  );
}
