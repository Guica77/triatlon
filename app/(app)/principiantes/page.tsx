'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  BookOpen, 
  ArrowLeft, 
  Bike, 
  Activity, 
  Heart, 
  Flame, 
  Apple, 
  HelpCircle, 
  Compass, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
} as const;

const reducedContainerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 }
} as const;

const reducedItemVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15, ease: 'easeOut' } }
} as const;

export default function PrincipiantesPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-bg-elevated/50 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-elevated/95 backdrop-blur-md border-b border-border-subtle transition-[background-color,border-color,box-shadow] duration-200 ease-out motion-reduce:transition-opacity">
        <div className="px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <AnimatedButton variant="ghost" size="icon" aria-label="Volver al dashboard" className="w-9 h-9 text-text-muted hover:text-swim hover:bg-swim rounded-xl transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] border border-transparent hover:border-swim motion-reduce:transition-opacity motion-reduce:active:scale-100">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </AnimatedButton>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-bold text-text-primary tracking-tight">Zona Principiantes</h1>
                <p className="text-[10px] text-text-muted font-medium">Guía y recursos esenciales para empezar</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pt-8">
        <motion.div 
          variants={reduceMotion ? reducedContainerVariants : containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Bienvenida Banner */}
          <motion.div 
            variants={reduceMotion ? reducedItemVariants : itemVariants}
            className="p-6 rounded-2xl bg-bg-card border border-emerald-500/20 relative overflow-hidden group"
          >
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2 mb-2">
              ¡Disfruta del camino! 🏁
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              El triatlón es un deporte de superación personal, pero ante todo, debe ser divertido. Si estás empezando, no te agobies con la tecnología, los ritmos o la equipación de los demás. Tu única meta es establecer el hábito, ser constante y cruzar el arco de meta con una sonrisa.
            </p>
          </motion.div>

          {/* Tres Pilares */}
          <motion.div variants={reduceMotion ? reducedItemVariants : itemVariants} className="space-y-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Los 3 Pilares del Triatleta Principiante</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle space-y-3">
                <div className="w-9 h-9 rounded-xl bg-swim border border-swim flex items-center justify-center text-swim">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-text-primary">1. Consistencia {'>'} Intensidad</h4>
                <p className="text-xs text-text-muted leading-normal">
                  Es mucho mejor entrenar 30 minutos de forma regular 4 veces por semana, que hacer un solo entrenamiento largo de 3 horas que te deje exhausto por días.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle space-y-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                  <Heart className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-text-primary">2. Escucha a tu Cuerpo</h4>
                <p className="text-xs text-text-muted leading-normal">
                  El descanso es la parte más importante del entrenamiento. Si te sientes muy cansado o notas dolor articular, es preferible tomar un día libre.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle space-y-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
                  <Apple className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-text-primary">3. Nutrición Simple</h4>
                <p className="text-xs text-text-muted leading-normal">
                  No necesitas suplementación compleja. Con una comida rica en carbohidratos saludables y proteínas en la primera hora post-entreno es suficiente.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Mitos vs Realidad */}
          <motion.div variants={reduceMotion ? reducedItemVariants : itemVariants} className="space-y-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Mitos comunes del Triatlón</h3>
            
            <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle space-y-4">
              <div className="flex gap-4 items-start pb-4 border-b border-border-subtle">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Mito: Necesitas una bicicleta de contrarreloj cara</h4>
                  <p className="text-xs text-text-muted mt-1 leading-normal">
                    <strong>Realidad:</strong> Puedes completar tus primeros triatlones (Sprint y Olímpico) perfectamente con una bicicleta de carretera básica o incluso de montaña. Lo más importante son tus piernas y tu comodidad.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start pb-4 border-b border-border-subtle">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Mito: Tienes que entrenar 15 o 20 horas a la semana</h4>
                  <p className="text-xs text-text-muted mt-1 leading-normal">
                    <strong>Realidad:</strong> Para distancias Sprint y Olímpico, entrenar de 4 a 6 horas a la semana es más que suficiente para terminar en excelentes condiciones y disfrutar la experiencia.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Mito: Si no nadas bien, no puedes ser triatleta</h4>
                  <p className="text-xs text-text-muted mt-1 leading-normal">
                    <strong>Realidad:</strong> La natación es la disciplina que más respeto da, pero en triatlón popular mucha gente nada muy despacio o incluso a estilo braza. Concéntrate en mantener la calma y tu ritmo.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Consejos Prácticos por Disciplina */}
          <motion.div variants={reduceMotion ? reducedItemVariants : itemVariants} className="space-y-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Consejos Rápidos</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle">
                <span className="text-[10px] font-extrabold text-swim bg-swim px-2 py-0.5 rounded-full border border-swim uppercase tracking-wider">Transición (T1 / T2)</span>
                <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                  Las transiciones son la "cuarta disciplina". Practica bajarte de la bici y empezar a correr de inmediato para acostumbrar a tus piernas a la sensación de pesadez (entrenamientos de transición).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle">
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">Ritmo de Rituales</span>
                <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                  El día de la carrera, llega con tiempo de sobra (mínimo 2 horas antes) para colocar tu material tranquilamente en los boxes y visualizar tus recorridos de entrada y salida.
                </p>
              </div>
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div variants={reduceMotion ? reducedItemVariants : itemVariants} className="space-y-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Preguntas Frecuentes</h3>
            
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle">
                <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-swim" /> ¿Qué distancia me recomiendan para empezar?
                </h4>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Recomendamos el triatlón Super Sprint (aprox. 350m nado, 10km ciclismo, 2.5km carrera) o Sprint (750m nado, 20km ciclismo, 5km carrera). Son distancias divertidas, asequibles y rápidas de recuperar.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle">
                <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-swim" /> ¿Necesito obligatoriamente un traje de neopreno?
                </h4>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Depende de la temperatura del agua. Si el agua está a menos de 14°C-16°C es obligatorio, y si está a más de 22°C-24°C está prohibido (los límites exactos varían según la normativa). Para tu debut, puedes alquilar uno.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Call */}
          <motion.div variants={reduceMotion ? reducedItemVariants : itemVariants} className="text-center pt-4">
            <Link href="/dashboard">
              <AnimatedButton variant="primary" className="!bg-bg-card hover:!bg-bg-card text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer text-xs">
                Volver al Inicio
              </AnimatedButton>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
