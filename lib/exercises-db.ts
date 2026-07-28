/**
 * Exercise Library Database — Triatlon Pro
 *
 * Cada ejercicio tiene:
 * - id único
 * - nombre en español
 * - deporte (natacion, ciclismo, carrera, fuerza, movilidad)
 * - grupo muscular
 * - nivel (principiante, intermedio, avanzado)
 * - descripción
 * - video de YouTube (ID del video)
 * - consejos del coach
 * - equipamiento necesario
 */

export interface Exercise {
  id: string
  name: string
  sport: 'natacion' | 'ciclismo' | 'carrera' | 'fuerza' | 'movilidad' | 'brick'
  muscleGroup: string
  level: 'principiante' | 'intermedio' | 'avanzado'
  description: string
  youtubeId: string
  coachTips: string[]
  equipment: string[]
  duration?: string
  sets?: string
  externalImage?: string
  externalGif?: string
  externalSource?: boolean
}

export const EXERCISES: Exercise[] = [
  // ============================================================
  // NATACIÓN
  // ============================================================
  {
    id: 'swim-catchup',
    name: 'Catch-Up Drill',
    sport: 'natacion',
    muscleGroup: 'Técnica de brazada',
    level: 'principiante',
    description: 'Ejercicio fundamental para mejorar la fase de tracción de la brazada. Una mano espera a que la otra la alcance antes de iniciar la siguiente brazada.',
    youtubeId: 'gOuOgJvYJSE',
    coachTips: [
      'Mantén la mano extendida hasta que la otra la toque',
      'Enfócate en la fase de tracción, no en la velocidad',
      'Respira lateral cada 3 brazadas',
      'Mantén el cuerpo alineado y las caderas altas'
    ],
    equipment: ['Gafas', 'Gorro (opcional)', 'Palas (opcional)'],
    duration: '200-400m',
    sets: '4x100m con 20s descanso'
  },
  {
    id: 'swim-fingertip-drag',
    name: 'Fingertip Drag',
    sport: 'natacion',
    muscleGroup: 'Recuperación y técnica',
    level: 'principiante',
    description: 'Ejercicio de recuperación activa que mejora la recuperación de brazada y la relajación del codo alto.',
    youtubeId: 'WwMsyVFp0X0',
    coachTips: [
      'Arrastra los dedos por el agua durante la recuperación',
      'Mantén el codo alto y relajado',
      'Enfócate en la rotación del cuerpo',
      'Usa este ejercicio en calentamiento o enfriamiento'
    ],
    equipment: ['Gafas'],
    duration: '100-200m',
    sets: '4x50m con 15s descanso'
  },
  {
    id: 'swim-bilateral-breathing',
    name: 'Respiración Bilateral',
    sport: 'natacion',
    muscleGroup: 'Técnica y eficiencia',
    level: 'intermedio',
    description: 'Aprender a respirar ambos lados mejora la simetría de la brazada y reduce el riesgo de lesiones por desequilibrio.',
    youtubeId: 'oMjgI8gFvOE',
    coachTips: [
      'Respira cada 3 brazadas (alternando lados)',
      'No levantes la cabeza, rota el cuerpo',
      'Si un lado se siente incómodo, practica más ese lado',
      'Objetivo: sentirte cómodo respirando a ambos lados'
    ],
    equipment: ['Gafas', 'Tablón (opcional)'],
    duration: '300-500m',
    sets: '6x100m respiración bilateral'
  },
  {
    id: 'swim-kick-drill',
    name: 'Patada con Tablón',
    sport: 'natacion',
    muscleGroup: 'Piernas y técnica de patada',
    level: 'principiante',
    description: 'Desarrolla una patada eficiente y potente. La patada correcta en triatlón es fundamental para la fase de natación.',
    youtubeId: 'QqYlJwRCHqo',
    coachTips: [
      'Patada desde la cadera, no desde la rodilla',
      'Piernas casi extendidas con flexión ligera',
      'Pies relajados y puntas hacia dentro',
      'Mantén la cabeza baja y el cuerpo horizontal'
    ],
    equipment: ['Tablón', 'Gafas', 'Aletas (opcional)'],
    duration: '200-400m',
    sets: '8x50m patada con 15s descanso'
  },
  {
    id: 'swim-pull-buoy',
    name: 'Nado con Pull Buoy',
    sport: 'natacion',
    muscleGroup: 'Brazos y tracción',
    level: 'intermedio',
    description: 'Aísla el trabajo de brazos para desarrollar fuerza y técnica de tracción sin preocuparte por la patada.',
    youtubeId: 'F5rF8yS8Y0Q',
    coachTips: [
      'El pull buoy entre las piernas mantiene las caderas altas',
      'Enfócate en la fase de agarre y tracción',
      'Mantén los codos altos durante la brazada',
      'Respira cómodamente cada 3 brazadas'
    ],
    equipment: ['Pull buoy', 'Gafas', 'Palas (opcional)'],
    duration: '300-600m',
    sets: '4x150m con pull buoy'
  },
  // ============================================================
  // CICLISMO
  // ============================================================
  {
    id: 'bike-sweet-spot',
    name: 'Sweet Spot Training',
    sport: 'ciclismo',
    muscleGroup: 'Resistencia aeróbica',
    level: 'intermedio',
    description: 'Trabajo en zona88-93% del FTP. El punto dulce entre resistencia y tempo que maximiza la ganancia de fitness sin fatiga excesiva.',
    youtubeId: 'tKvH7FkwkOY',
    coachTips: [
      'Mantén cadencia de85-95 RPM',
      'El esfuerzo debe ser "duro pero sostenible"',
      'Si puedes hablar frases cortas, estás en zona',
      'Sesiones de20-40 minutos continuos'
    ],
    equipment: ['Bicicleta', 'Potenciómetro (recomendado)', 'Heart rate monitor'],
    duration: '60-90 min',
    sets: '2x20min Sweet Spot con 10min descanso'
  },
  {
    id: 'bike-over-under',
    name: 'Over-Under Intervals',
    sport: 'ciclismo',
    muscleGroup: 'Umbral lactato',
    level: 'avanzado',
    description: 'Alternar entre105-110% FTP (over) y85-90% FTP (under). Entrena al cuerpo a limpiar lactato mientras pedalea fuerte.',
    youtubeId: 'qKf4bHJwK8o',
    coachTips: [
      'Los "over" son30-60 segundos, los "under"60-90 segundos',
      'Transiciones suaves, no golpes de potencia',
      'Cadencia alta en ambos:90-100 RPM',
      'Máximo3-4 repeticiones por sesión'
    ],
    equipment: ['Bicicleta', 'Potenciómetro (requerido)'],
    duration: '75-90 min',
    sets: '3-4x (1min over + 2min under)'
  },
  {
    id: 'bike-climbing',
    name: 'Subidas Largas en Silla',
    sport: 'ciclismo',
    muscleGroup: 'Fuerza-resistencia',
    level: 'intermedio',
    description: 'Subidas de5-15 minutos en silla sentado, enfocando en potencia constante y técnica de pedaleo.',
    youtubeId: 'F2LPSfDjGjQ',
    coachTips: [
      'Mantén cadencia de75-85 RPM en subida',
      'Potencia constante, no picos',
      'Peso ligero en manillar, caderas estables',
      'Respiración rítmica y controlada'
    ],
    equipment: ['Bicicleta', 'Heart rate monitor'],
    duration: '90-120 min',
    sets: '3-4x8-12min subida a 90% FTP'
  },
  {
    id: 'bike-ftp-test',
    name: 'Test FTP (20min)',
    sport: 'ciclismo',
    muscleGroup: 'Evaluación',
    level: 'intermedio',
    description: 'El test estándar para determinar tu Functional Threshold Power.20 minutos al máximo esfuerzo sostenido.',
    youtubeId: '5HtFfMjLkK8',
    coachTips: [
      'Calentamiento de15-20 min progresivo',
      'Los primeros5 min no te pases — ritma',
      'Los últimos5 min es donde ganas el test',
      'FTP = potencia media de los20min x0.95'
    ],
    equipment: ['Bicicleta', 'Potenciómetro (requerido)', 'Heart rate monitor'],
    duration: '60-75 min (con calentamiento)',
    sets: '1x20min al máximo esfuerzo'
  },
  {
    id: 'bike-vo2max',
    name: 'Intervalos VO2max',
    sport: 'ciclismo',
    muscleGroup: 'Capacidad aeróbica máxima',
    level: 'avanzado',
    description: 'Intervalos de3-5 minutos al105-120% FTP. Desarrolla la potencia máxima sostenida y la capacidad de captación de oxígeno.',
    youtubeId: 'oYKkXoHFBpY',
    coachTips: [
      'Primera repetición conservadora — la fuerza viene al final',
      'Cadencia alta:95-105 RPM',
      'Descanso activo:50-60% FTP',
      'Máximo4-5 repeticiones por sesión'
    ],
    equipment: ['Bicicleta', 'Potenciómetro (requerido)'],
    duration: '75-90 min',
    sets: '4-5x4min a 110% FTP con 4min descanso'
  },
  // ============================================================
  // CARRERA
  // ============================================================
  {
    id: 'run-tempo',
    name: 'Tempo Run',
    sport: 'carrera',
    muscleGroup: 'Resistencia aeróbica',
    level: 'principiante',
    description: 'Carrera a ritmo cómodo pero "desafiante" (Z3). Desarrolla la eficiencia cardiovascular sin fatiga excesiva.',
    youtubeId: 'kE3MSDnKj8g',
    coachTips: [
      'Ritmo:30-45 seg/km más lento que tu 10K',
      'Deberías poder mantener conversación corta',
      'Mantén cadencia de170-180 pasos/min',
      'No aceleres al final — mantén ritmo constante'
    ],
    equipment: ['Zapatillas de running'],
    duration: '30-60 min',
    sets: '20-40 min continuos a ritmo tempo'
  },
  {
    id: 'run-intervals',
    name: 'Intervalos de Velocidad',
    sport: 'carrera',
    muscleGroup: 'Velocidad y potencia',
    level: 'intermedio',
    description: 'Series cortas a alta intensidad con recuperación activa. Desarrolla velocidad, economía de carrera y capacidad anaeróbica.',
    youtubeId: 'FmM5HdFfz8k',
    coachTips: [
      'Primera serie conservadora — el ritmo viene al final',
      'Recuperación activa: trote suave, no caminar',
      'Mantén buena forma técnica incluso cansado',
      '800m-1km por serie para principiantes'
    ],
    equipment: ['Zapatillas de running', 'GPS o reloj'],
    duration: '45-60 min',
    sets: '6-8x800m a 5K pace con 400m trote'
  },
  {
    id: 'run-long-run',
    name: 'Carrera Larga',
    sport: 'carrera',
    muscleGroup: 'Resistencia',
    level: 'principiante',
    description: 'La piedra angular del entrenamiento de resistencia. Desarrolla la capacidad aeróbica y la resistencia muscular.',
    youtubeId: 'GhBRGq3vFCk',
    coachTips: [
      'Primera hora a ritmo Z1-Z2 (fácil)',
      'Puedes aumentar ritmo en los últimos20 min',
      'Lleva geles/agua si superas60 min',
      'Prioriza terminar, no el ritmo'
    ],
    equipment: ['Zapatillas de running', 'Geles (si >60 min)', 'Hydration'],
    duration: '75-150 min',
    sets: '1 sesión semanal'
  },
  {
    id: 'run-strides',
    name: 'Strides (Fartlek Corto)',
    sport: 'carrera',
    muscleGroup: 'Economía de carrera',
    level: 'principiante',
    description: 'Aceleraciones cortas de8-12 segundos al90% de esfuerzo. Mejoran la economía de carrera y la coordinación neuromuscular.',
    youtubeId: 'LqjDfKfX4K8',
    coachTips: [
      'Incorpora al final de sesiones fáciles',
      '8-12 strides de8-12 segundos',
      'Recuperación:60-90 seg de trote entre cada una',
      'Enfócate en buena forma, no en velocidad máxima'
    ],
    equipment: ['Zapatillas de running'],
    duration: '5-10 min (al final de sesión)',
    sets: '6-10 strides de8-12 seg'
  },
  {
    id: 'run-hill-repeats',
    name: 'Repeticiones de Cuesta',
    sport: 'carrera',
    muscleGroup: 'Fuerza-resistencia',
    level: 'intermedio',
    description: 'Subidas cortas y pronunciadas al95-100% esfuerzo. Desarrollan fuerza de piernas, potencia y resistencia cardiovascular.',
    youtubeId: 'kE3MSDnKj8g',
    coachTips: [
      'Cuesta de45-90 segundos de duración',
      'Inclina el cuerpo ligeramente hacia adelante',
      'Brazada activa — los brazos impulsan',
      'Baja trotando para recuperación activa'
    ],
    equipment: ['Zapatillas de running'],
    duration: '50-60 min',
    sets: '6-8x90 seg subida con bajada trote'
  },
  // ============================================================
  // FUERZA
  // ============================================================
  {
    id: 'strength-squat',
    name: 'Sentadilla (Squat)',
    sport: 'fuerza',
    muscleGroup: 'Cuádriceps, glúteos',
    level: 'principiante',
    description: 'El ejercicio rey para triatletas. Desarrolla la fuerza de piernas necesaria para ciclismo y carrera.',
    youtubeId: 'aclHkVaku9U',
    coachTips: [
      'Pies a la anchura de hombros, puntas ligeramente hacia fuera',
      'Baja hasta que los muslos estén paralelos al suelo',
      'Rodillas siguen la dirección de las puntas',
      'Espalda recta, core activado'
    ],
    equipment: ['Barra con peso (o peso corporal)'],
    duration: '15-20 min',
    sets: '4x8-12 repeticiones'
  },
  {
    id: 'strength-deadlift',
    name: 'Peso Muerto (Deadlift)',
    sport: 'fuerza',
    muscleGroup: 'Posterior chain',
    level: 'intermedio',
    description: 'Fortalece toda la cadena posterior: glúteos, isquiotibiales y espalda baja. Fundamental para prevenir lesiones.',
    youtubeId: 'op9kVnSo6Wc',
    coachTips: [
      'La barra debe rozar las piernas durante todo el movimiento',
      'Espalda recta — nunca redondear',
      'Empuja con las piernas, no con la espalda',
      'Activa glúteos al subir'
    ],
    equipment: ['Barra con peso'],
    duration: '15-20 min',
    sets: '3-4x6-10 repeticiones'
  },
  {
    id: 'strength-plank',
    name: 'Plancha (Plank)',
    sport: 'fuerza',
    muscleGroup: 'Core',
    level: 'principiante',
    description: 'El ejercicio básico de core. Un core fuerte mejora la postura en bicicleta y la economía de carrera.',
    youtubeId: 'ASdvN_XEl_c',
    coachTips: [
      'Codos debajo de los hombros',
      'Cuerpo en línea recta de cabeza a talones',
      'Activa glúteos y abdomen',
      'No dejes que la cadera se caiga'
    ],
    equipment: ['Ninguno'],
    duration: '5-10 min',
    sets: '3-4x30-60 segundos'
  },
  {
    id: 'strength-single-leg',
    name: 'Sentadilla a una pierna (Pistol)',
    sport: 'fuerza',
    muscleGroup: 'Equilibrio y fuerza',
    level: 'avanzado',
    description: 'Ejercicio avanzado de equilibrio y fuerza unilateral. Corrige desequilibrios entre piernas.',
    youtubeId: 'XxWcirHIwVo',
    coachTips: [
      'Empieza con apoyo (silla o TRX)',
      'Baja controladamente — no caigas',
      'Mantén la rodilla alineada',
      'Si no puedes, usa versión asistida'
    ],
    equipment: ['Ninguno (o TRX/silla para asistencia)'],
    duration: '10-15 min',
    sets: '3x5-8 cada pierna'
  },
  {
    id: 'strength-glute-bridge',
    name: 'Puente de Glúteos',
    sport: 'fuerza',
    muscleGroup: 'Glúteos y core',
    level: 'principiante',
    description: 'Activa y fortalece los glúteos, que son el motor principal del ciclista y corredor.',
    youtubeId: 'ougsGMMx-4k',
    coachTips: [
      'Empuja con los talones, no con la espalda',
      'Aprieta los glúteos en la posición alta',
      'Mantén2-3 segundos arriba',
      'Progresión: una pierna'
    ],
    equipment: ['Ninguno (o banda elástica)'],
    duration: '10 min',
    sets: '3x15 repeticiones'
  },
  // ============================================================
  // MOVILIDAD
  // ============================================================
  {
    id: 'mobility-hip-flexor',
    name: 'Estiramiento de Flexores de Cadera',
    sport: 'movilidad',
    muscleGroup: 'Cadera',
    level: 'principiante',
    description: 'Los flexores de cadera se acortan al sentarse en bici. Mantenerlos largos previene dolor lumbar y mejora la zancada.',
    youtubeId: 'TGvLRZ2lVXo',
    coachTips: [
      'Posición de zancada baja con rodilla trasera en suelo',
      'Empuja las caderas hacia adelante suavemente',
      'Mantén30-60 segundos cada lado',
      'No arquees la espalda — mantén core activo'
    ],
    equipment: ['Alfombrilla (opcional)'],
    duration: '5-10 min',
    sets: '2x30-60 seg cada lado'
  },
  {
    id: 'mobility-thoracic',
    name: 'Rotación Torácica',
    sport: 'movilidad',
    muscleGroup: 'Espalda alta',
    level: 'principiante',
    description: 'Mejora la movilidad de la espalda alta para una mejor postura en bici y brazada en natación.',
    youtubeId: 'KfGzq0bVxY4',
    coachTips: [
      'Acostado de lado, rodillas apiladas',
      'Abre el brazo superior hacia el otro lado',
      'Sigue la mano con la mirada',
      'Respira profundamente en cada repetición'
    ],
    equipment: ['Alfombrilla'],
    duration: '5 min',
    sets: '10 repeticiones cada lado'
  },
  {
    id: 'mobility-ankle',
    name: 'Movilidad de Tobillos',
    sport: 'movilidad',
    muscleGroup: 'Tobillos',
    level: 'principiante',
    description: 'Tobillos rígidos afectan la zancada en carrera y la potencia en ciclismo. Ejercicios diarios para mantener movilidad.',
    youtubeId: 'Iikz_L4wAsw',
    coachTips: [
      'Rodilla contra pared — cuántos cm puedes alejar el pie',
      'Círculos de tobillo en ambas direcciones',
      'Estira el gemelo y el sóleo por separado',
      'Hazlo antes de cada entrenamiento'
    ],
    equipment: ['Ninguno'],
    duration: '5 min',
    sets: '10 círculos cada dirección + estiramiento 30s'
  },
  {
    id: 'mobility-foam-roll',
    name: 'Foam Roller - Piernas',
    sport: 'movilidad',
    muscleGroup: 'Recuperación',
    level: 'principiante',
    description: 'Masaje miofascial para acelerar la recuperación muscular. Reduce la tensión y mejora la circulación.',
    youtubeId: 'SsFjriYhO4k',
    coachTips: [
      'Rodar lento —30 segundos por zona',
      'Dolor tolerable, no dolor agudo',
      'Enfócate en cuádriceps, IT band, gemelos',
      'Hacer después de entrenamiento o antes de dormir'
    ],
    equipment: ['Foam roller'],
    duration: '10-15 min',
    sets: '30 seg por grupo muscular'
  },
  // ============================================================
  // EJERCICIOS AVANZADOS Y ESPECÍFICOS DE TRIATLÓN
  // ============================================================
  {
    id: 'swim-sighting',
    name: 'Sighting (Orientación en Agua)',
    sport: 'natacion',
    muscleGroup: 'Técnica de orientación',
    level: 'intermedio',
    description: 'Ejercicio para mejorar la orientación durante la natación en aguas abiertas. Elevar la cabeza para buscar boyas sin perder ritmo.',
    youtubeId: 'F5rF8yS8Y0Q',
    coachTips: [
      'Eleva la cabeza ligeramente cada 6-8 brazadas',
      'Mira hacia adelante, no hacia abajo',
      'Mantén las caderas altas al mirar',
      'Practica en piscina antes de ir al agua abierta'
    ],
    equipment: ['Gafas', 'Gorro', 'Boya de referencia'],
    duration: '20-30 min',
    sets: '8x100m con sighting cada 25m'
  },
  {
    id: 'swim-drafting',
    name: 'Nado en Grupo (Drafting)',
    sport: 'natacion',
    muscleGroup: 'Táctica de carrera',
    level: 'avanzado',
    description: 'Aprender a nadar en grupo y aprovechar el drafting para ahorrar energía durante la natación en competición.',
    youtubeId: 'oMjgI8gFvOE',
    coachTips: [
      'Posición de drafting: a los pies del nadador delante',
      'Mantén línea recta — no vadees',
      'Practica con un compañero en piscina',
      'En aguas abiertas: busca grupo de nado similar'
    ],
    equipment: ['Gafas', 'Gorro', 'Compañero de nado'],
    duration: '30-40 min',
    sets: '4x200m en grupo'
  },
  {
    id: 'bike-standing-climb',
    name: 'Subida en Pie',
    sport: 'ciclismo',
    muscleGroup: 'Fuerza y potencia',
    level: 'intermedio',
    description: 'Subidas largas de pie fuera de la silla para desarrollar potencia y resistencia muscular en subidas.',
    youtubeId: 'F2LPSfDjGjQ',
    coachTips: [
      'Levántate de la silla y pedalea de pie',
      'Mantén el cuerpo relajado, no fuerces',
      'Cadencia60-70 RPM',
      'Alterna entre sentado y de pie cada minuto'
    ],
    equipment: ['Bicicleta', 'Heart rate monitor'],
    duration: '90-120 min',
    sets: '4-5x3-5min subida de pie'
  },
  {
    id: 'bike-time-trial',
    name: 'Posición de Contrarreloj',
    sport: 'ciclismo',
    muscleGroup: 'Aerodinámica',
    level: 'avanzado',
    description: 'Practicar la posición aerodinámica de contrarreloj para mejorar la velocidad sin incrementar esfuerzo.',
    youtubeId: 'qKf4bHJwK8o',
    coachTips: [
      'Mantén los codos juntos y la espalda plana',
      'Relaja los hombros — no tensions',
      'Cadencia alta:90-100 RPM',
      'Empieza con5min y progresa a20min'
    ],
    equipment: ['Bicicleta TT o aero bars', 'Casco aero (opcional)'],
    duration: '60-90 min',
    sets: '3x10min posición TT con 5min descanso'
  },
  {
    id: 'run-aquathlon',
    name: 'Aquathlon (Natación + Carrera)',
    sport: 'carrera',
    muscleGroup: 'Transición y resistencia',
    level: 'intermedio',
    description: 'Simulación de transición T2: salir del agua y empezar a correr. Desarrolla la adaptación cardiovascular.',
    youtubeId: 'kE3MSDnKj8g',
    coachTips: [
      'Sal del agua trotando — no camines',
      'Los primeros200m son los más duros',
      'Respira profundo para recuperar el ritmo cardíaco',
      'Practica en piscina con salida de agua'
    ],
    equipment: ['Gafas', 'Zapatillas de running'],
    duration: '30-45 min',
    sets: '4x (200m nado + 400m carrera)'
  },
  {
    id: 'run-temple-run',
    name: 'Fartlek (Juego de Velocidad)',
    sport: 'carrera',
    muscleGroup: 'Variabilidad de ritmo',
    level: 'principiante',
    description: 'Juego de velocidad libre: alterna entre trote suave y sprints cortos sin ritmo fijo. Mejora la capacidad de adaptación.',
    youtubeId: 'GhBRGq3vFCk',
    coachTips: [
      'No uses reloj — ajusta por sensaciones',
      'Sprint cuando te apetezca, trote cuando necesites',
      'Dura total:30-45 minutos',
      'Diviértete — el fartlek es juego'
    ],
    equipment: ['Zapatillas de running'],
    duration: '30-45 min',
    sets: 'Continuo con cambios de ritmo'
  },
  {
    id: 'strength-lunge',
    name: 'Zancada (Lunge)',
    sport: 'fuerza',
    muscleGroup: 'Cuádriceps, glúteos, equilibrio',
    level: 'principiante',
    description: 'Ejercicio unilateral que mejora el equilibrio y la fuerza de cada pierna por separado, corrigiendo asimetrías.',
    youtubeId: 'QOVaHwm-Q6U',
    coachTips: [
      'Da un paso largo hacia adelante',
      'Baja hasta que ambas rodillas estén a90 grados',
      'Mantén el torso erguido',
      'Empuja con la pierna delantera para subir'
    ],
    equipment: ['Peso corporal o mancuernas'],
    duration: '10-15 min',
    sets: '3x12 cada pierna'
  },
  {
    id: 'strength-russian-twist',
    name: 'Russian Twist',
    sport: 'fuerza',
    muscleGroup: 'Core lateral / oblicuos',
    level: 'intermedio',
    description: 'Fortalece los oblicuos y la rotación del tronco, esencial para la brazada en natación y la estabilidad en carrera.',
    youtubeId: 'wkD8rjkodUI',
    coachTips: [
      'Siéntate con las rodillas ligeramente flexionadas',
      'Inclina el torso hacia atrás45 grados',
      'Gira el torso de lado a lado controladamente',
      'Mantén los hombros relajados y el core tenso'
    ],
    equipment: ['Ninguno (o peso ligero)'],
    duration: '5-10 min',
    sets: '3x20 rotaciones (10 cada lado)'
  },
  {
    id: 'mobility-shoulder',
    name: 'Movilidad de Hombros',
    sport: 'movilidad',
    muscleGroup: 'Hombros y espalda alta',
    level: 'principiante',
    description: 'Rango de movimiento de hombros para mejorar la brazada en natación y prevenir lesiones por sobreuso.',
    youtubeId: 'Iikz_L4wAsw',
    coachTips: [
      'Círculos de brazos hacia adelante y atrás',
      'Stretch con banda elástica detrás de la espalda',
      'Pendulums colgado de una barra',
      'No fuerces el rango — progresa gradualmente'
    ],
    equipment: ['Banda elástica (opcional)'],
    duration: '5-10 min',
    sets: '10 círculos cada dirección + 30s estiramiento'
  },
  {
    id: 'mobility-thoracic-extension',
    name: 'Extensión Torácica',
    sport: 'movilidad',
    muscleGroup: 'Espalda alta',
    level: 'intermedio',
    description: 'Mejora la extensión de la columna torácica para una mejor postura en bicicleta y brazada en natación.',
    youtubeId: 'KfGzq0bVxY4',
    coachTips: [
      'Usa un rodillo de espuma o bola de tenis',
      'Coloca el rodillo debajo de la espalda alta',
      'Inclínate hacia atrás suavemente',
      'Respira profundamente en cada repetición'
    ],
    equipment: ['Foam roller o bola de tenis'],
    duration: '5-10 min',
    sets: '10 extensiones, 30 seg cada posición'
  },
  {
    id: 'bike-trainer-intervals',
    name: 'Intervalos en Rodillo',
    sport: 'ciclismo',
    muscleGroup: 'Control de esfuerzo',
    level: 'intermedio',
    description: 'Intervalos precisos en rodillo indoor para entrenar zonas específicas sin interferencias del tráfico o clima.',
    youtubeId: 'tKvH7FkwkOY',
    coachTips: [
      'Usa potenciómetro o heart rate para control',
      'Mantén cadencia constante durante cada intervalo',
      'Ventila bien — el rodillo no tiene enfriamiento natural',
      'Al menos10min de calentamiento antes de empezar'
    ],
    equipment: ['Rodillo o trainer', 'Ventilador', 'Toalla'],
    duration: '60-90 min',
    sets: '4-6x5min a zona objetivo con 3min descanso'
  },
  {
    id: 'run-stride-analysis',
    name: 'Análisis de Zancada',
    sport: 'carrera',
    muscleGroup: 'Economía de carrera',
    level: 'intermedio',
    description: 'Graba tu carrera y analiza la zancada, cadencia y pisada para identificar mejoras en la economía de carrera.',
    youtubeId: 'FmM5HdFfz8k',
    coachTips: [
      'Graba desde el lado a cámara lenta',
      'Observa: ¿pisas con talón, mediopié o antepié?',
      'Mide la cadencia:170-180 pasos/min es óptimo',
      'Busca un fisioterapeuta deportivo para análisis completo'
    ],
    equipment: ['Móvil con cámara', 'Cinta de correr (opcional)'],
    duration: '20-30 min',
    sets: '1-2 grabaciones de30 segundos'
  },
  {
    id: 'swim-open-water',
    name: 'Nado en Aguas Abiertas',
    sport: 'natacion',
    muscleGroup: 'Resistencia y orientación',
    level: 'avanzado',
    description: 'Preparación específica para competiciones en agua abierta: corrientes, temperatura, orientación, contacto con otros nadadores.',
    youtubeId: 'gOuOgJvYJSE',
    coachTips: [
      'Nunca nades solo en aguas abiertas',
      'Usa boya de seguridad visible',
      'Practica salir del agua y trotar',
      'Aclimatación gradual a la temperatura del agua'
    ],
    equipment: ['Gafas de aguas abiertas', 'Boya de seguridad', 'Neopreno (si hace frío)'],
    duration: '30-60 min',
    sets: '1-2 sesiones semanales en temporada'
  },
  {
    id: 'brick-olympic',
    name: 'Brick Olímpico',
    sport: 'brick',
    muscleGroup: 'Adaptación multi-deporte',
    level: 'intermedio',
    description: 'Simulación completa de transición T1+T2:40km bici + 10km carrera. Esencial para preparación de competiciones olímpicas.',
    youtubeId: 'LqjDfKfX4K8',
    coachTips: [
      'Primeros1km de carrera: no fuerces — deja que las piernas se adapten',
      'Cambia de calzado rápido pero sin prisa',
      'Toma geles durante la carrera si es necesario',
      'Simula las condiciones reales de carrera'
    ],
    equipment: ['Bicicleta', 'Zapatillas de running', 'Cascos', 'Geles'],
    duration: '120-150 min',
    sets: '1 brick olímpico cada2 semanas'
  },
  {
    id: 'strength-single-leg-deadlift',
    name: 'Peso Muerto a Una Pierna',
    sport: 'fuerza',
    muscleGroup: 'Posterior chain unilateral',
    level: 'intermedio',
    description: 'Fortalece glúteos e isquiotibiales de forma unilateral, mejorando el equilibrio y previniendo lesiones.',
    youtubeId: 'op9kVnSo6Wc',
    coachTips: [
      'Inclina el torso hacia adelante mientras levantas la pierna trasera',
      'Mantén la espalda recta — no redondees',
      'Controla el movimiento — no uses impulso',
      'Progresión: añade mancuerna'
    ],
    equipment: ['Peso corporal o mancuerna'],
    duration: '10-15 min',
    sets: '3x8-10 cada pierna'
  },
  {
    id: 'run-hill-sprints',
    name: 'Sprints de Cuesta Cortos',
    sport: 'carrera',
    muscleGroup: 'Potencia y velocidad',
    level: 'avanzado',
    description: 'Sprints explosivos cortos (10-15 seg) en cuesta pronunciada. Desarrollan potencia máxima y capacidad anaeróbica.',
    youtubeId: 'kE3MSDnKj8g',
    coachTips: [
      'Cuesta pronunciada (>10% inclinación)',
      'Sprint máximo durante10-15 segundos',
      'Baja caminando — recuperación completa',
      'Solo6-8 repeticiones por sesión'
    ],
    equipment: ['Zapatillas de running'],
    duration: '40-50 min',
    sets: '6-8x10-15 seg sprint + bajada caminando'
  },
  {
    id: 'bike-caffeine-practice',
    name: 'Práctica de Nutrición en Bici',
    sport: 'ciclismo',
    muscleGroup: 'Nutrición deportiva',
    level: 'principiante',
    description: 'Practicar la toma de geles, líquidos y electrolitos durante sesiones largas para entrenar el sistema digestivo.',
    youtubeId: '5HtFjMjLkK8',
    coachTips: [
      'Empieza con pequeñas cantidades',
      'Toma geles con agua — nunca solo',
      'Practica en sesiones largas (>90 min)',
      'No pruebes cosas nuevas el día de la carrera'
    ],
    equipment: ['Geles', 'Bidón con isotónico', 'Cinturón de geles'],
    duration: '120-180 min',
    sets: '1 sesión semanal de práctica nutricional'
  },
  {
    id: 'swim-rescue-self',
    name: 'Auto-rescate en Aguas Abiertas',
    sport: 'natacion',
    muscleGroup: 'Seguridad y supervivencia',
    level: 'avanzado',
    description: 'Técnicas de auto-rescate para situaciones de fatiga o pánico en aguas abiertas. Seguridad ante todo.',
    youtubeId: 'F5rF8yS8Y0Q',
    coachTips: [
      'Si te agotas: gírate boca arriba y descansa',
      'Agarra la boya de seguridad si la tienes',
      'Respira profundo antes de continuar',
      'Nunca nades contra corriente fuerte'
    ],
    equipment: ['Boya de seguridad', 'Gafas de aguas abiertas'],
    duration: '15-20 min',
    sets: 'Práctica en cada sesión de aguas abiertas'
  }
]

// ============================================================
// Helper Functions
// ============================================================

export function getExercisesBySport(sport: Exercise['sport']): Exercise[] {
  return EXERCISES.filter(e => e.sport === sport)
}

export function getExercisesByLevel(level: Exercise['level']): Exercise[] {
  return EXERCISES.filter(e => e.level === level)
}

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find(e => e.id === id)
}

export function searchExercises(query: string): Exercise[] {
  const q = query.toLowerCase()
  return EXERCISES.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    e.muscleGroup.toLowerCase().includes(q) ||
    e.sport.toLowerCase().includes(q)
  )
}

export const SPORT_NAMES: Record<string, string> = {
  natacion: 'Natación',
  ciclismo: 'Ciclismo',
  carrera: 'Carrera',
  fuerza: 'Fuerza',
  movilidad: 'Movilidad',
  brick: 'Brick',
}

export const LEVEL_NAMES: Record<string, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}