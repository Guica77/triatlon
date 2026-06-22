export type MultisportModality = 'triatlon' | 'duatlon' | 'acuatlon' | 'acuabike' | 'cross' | 'carrera';

export interface RaceCatalogItem {
  id: string;
  name: string;
  country: string;
  city: string;
  modality: MultisportModality;
  distance: 'sprint' | 'olimpico' | 'half' | 'full';
  month: string;
  estimatedDate: string; // YYYY-MM-DD
  logoBg: string; // Color semántico para la tarjeta
}

export const RACES_CATALOG: RaceCatalogItem[] = [
  // Franquicia Ironman 70.3 (Media Distancia)
  {
    id: 'im-703-valencia',
    name: 'Ironman 70.3 Valencia',
    country: 'España',
    city: 'Valencia',
    modality: 'triatlon',
    distance: 'half',
    month: 'Abril',
    estimatedDate: '2027-04-18',
    logoBg: '#f59e0b'
  },
  {
    id: 'im-703-marbella',
    name: 'Ironman 70.3 Marbella',
    country: 'España',
    city: 'Marbella',
    modality: 'triatlon',
    distance: 'half',
    month: 'Octubre',
    estimatedDate: '2027-10-24',
    logoBg: '#f59e0b'
  },
  {
    id: 'im-703-mallorca',
    name: 'Ironman 70.3 Alcúdia-Mallorca',
    country: 'España',
    city: 'Alcúdia',
    modality: 'triatlon',
    distance: 'half',
    month: 'Mayo',
    estimatedDate: '2027-05-09',
    logoBg: '#f59e0b'
  },
  {
    id: 'im-703-cascais',
    name: 'Ironman 70.3 Cascais',
    country: 'Portugal',
    city: 'Cascais',
    modality: 'triatlon',
    distance: 'half',
    month: 'Octubre',
    estimatedDate: '2027-10-17',
    logoBg: '#f59e0b'
  },

  // Franquicia Ironman (Larga Distancia)
  {
    id: 'im-vitoria',
    name: 'Ironman Vitoria-Gasteiz',
    country: 'España',
    city: 'Vitoria',
    modality: 'triatlon',
    distance: 'full',
    month: 'Julio',
    estimatedDate: '2027-07-11',
    logoBg: '#dc2626'
  },
  {
    id: 'im-lanzarote',
    name: 'Ironman Lanzarote',
    country: 'España',
    city: 'Puerto del Carmen',
    modality: 'triatlon',
    distance: 'full',
    month: 'Mayo',
    estimatedDate: '2027-05-15',
    logoBg: '#dc2626'
  },
  {
    id: 'im-barcelona',
    name: 'Ironman Barcelona',
    country: 'España',
    city: 'Calella',
    modality: 'triatlon',
    distance: 'full',
    month: 'Octubre',
    estimatedDate: '2027-10-03',
    logoBg: '#dc2626'
  },

  // Franquicia Challenge Family
  {
    id: 'challenge-roth',
    name: 'DATEV Challenge Roth',
    country: 'Alemania',
    city: 'Roth',
    modality: 'triatlon',
    distance: 'full',
    month: 'Julio',
    estimatedDate: '2027-07-04',
    logoBg: '#ea580c'
  },
  {
    id: 'challenge-peguera',
    name: 'Challenge Peguera-Mallorca',
    country: 'España',
    city: 'Peguera',
    modality: 'triatlon',
    distance: 'half',
    month: 'Octubre',
    estimatedDate: '2027-10-16',
    logoBg: '#ea580c'
  },

  // Pruebas ITU / World Series & Locales Icónicas
  {
    id: 'tri-madrid-olimpico',
    name: 'Triatlón de Madrid (Olímpico)',
    country: 'España',
    city: 'Madrid',
    modality: 'triatlon',
    distance: 'olimpico',
    month: 'Junio',
    estimatedDate: '2027-06-13',
    logoBg: '#38bdf8'
  },
  {
    id: 'tri-zarautz',
    name: 'Zarauzko Triatloia (Zarautz)',
    country: 'España',
    city: 'Zarautz',
    modality: 'triatlon',
    distance: 'half',
    month: 'Junio',
    estimatedDate: '2027-06-12',
    logoBg: '#f59e0b'
  },

  // --- NUEVAS MODALIDADES MULTISPORT ---

  // Acuabike (Natación + Ciclismo - Sin carrera)
  {
    id: 'aquabike-world-championship',
    name: 'ITU World Aquabike Championship',
    country: 'España',
    city: 'Pontevedra',
    modality: 'acuabike',
    distance: 'full', // Distancia larga de acuabike (3k swim / 120k bike)
    month: 'Septiembre',
    estimatedDate: '2027-09-25',
    logoBg: '#06b6d4' // Cyan Acuabike
  },
  {
    id: 'aquabike-madrid',
    name: 'Aquabike de Madrid',
    country: 'España',
    city: 'Madrid',
    modality: 'acuabike',
    distance: 'olimpico',
    month: 'Junio',
    estimatedDate: '2027-06-13',
    logoBg: '#06b6d4'
  },

  // Duatlón (Carrera + Ciclismo + Carrera - Sin natación)
  {
    id: 'duatlon-zuia',
    name: 'Duatlón de Zuia (Media Distancia)',
    country: 'España',
    city: 'Murgia',
    modality: 'duatlon',
    distance: 'half',
    month: 'Abril',
    estimatedDate: '2027-04-10',
    logoBg: '#10b981' // Verde Duatlón
  },
  {
    id: 'duatlon-aviles',
    name: 'Campeonato de España de Duatlón',
    country: 'España',
    city: 'Avilés',
    modality: 'duatlon',
    distance: 'sprint',
    month: 'Abril',
    estimatedDate: '2027-04-03',
    logoBg: '#10b981'
  },

  // Acuatlón (Natación + Carrera - Sin ciclismo)
  {
    id: 'aquathlon-santander',
    name: 'Acuatlón Ciudad de Santander',
    country: 'España',
    city: 'Santander',
    modality: 'acuatlon',
    distance: 'sprint',
    month: 'Agosto',
    estimatedDate: '2027-08-15',
    logoBg: '#3b82f6' // Azul Acuatlón
  },

  // Triatlón Cross / XTERRA (Off-road BTT + Trail)
  {
    id: 'xterra-costa-brava',
    name: 'XTERRA Costa Brava',
    country: 'España',
    city: 'Sant Antoni de Calonge',
    modality: 'cross',
    distance: 'olimpico',
    month: 'Junio',
    estimatedDate: '2027-06-05',
    logoBg: '#84cc16' // Lima XTERRA
  }
];
