import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("Falta SUPABASE_SERVICE_ROLE_KEY en el entorno. No se puede hacer el seed de marketplace.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const marketplaceItems = [
  // --- BICICLETAS DE TRIATLÓN (CABRAS) ---
  {
    title: "Canyon Speedmax CF 8 Di2 (2023) - Talla M",
    price: 3450,
    original_price: 4599,
    category: "bicicletas",
    condition: "Excelente",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=canyon%20speedmax",
    external_images: [
      "https://images.unsplash.com/photo-1618886487325-f66f5087405e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Madrid, España",
    seller_name: "Alberto R.",
    is_active: true
  },
  {
    title: "Orbea Ordu M20i Team (2022) - Impecable",
    price: 2900,
    original_price: 4999,
    category: "bicicletas",
    condition: "Como Nuevo",
    source_portal: "Tuvalum",
    external_url: "https://tuvalum.com/bicicletas-ciclismo/orbea-ordu",
    external_images: [
      "https://images.unsplash.com/photo-1576435728678-68ce0b622602?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Barcelona, España",
    seller_name: "Tuvalum Certified",
    is_active: true
  },
  {
    title: "Trek Speed Concept SLR 7 - Oportunidad",
    price: 5200,
    original_price: 8999,
    category: "bicicletas",
    condition: "Excelente",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=trek%20speed%20concept",
    external_images: [
      "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Valencia, España",
    seller_name: "David Tri",
    is_active: true
  },

  // --- BICICLETAS DE CARRETERA (AERO/ESCALADORAS) ---
  {
    title: "Specialized Tarmac SL7 Expert (2022) - Ultegra Di2",
    price: 4100,
    original_price: 6200,
    category: "bicicletas",
    condition: "Como Nuevo",
    source_portal: "Tuvalum",
    external_url: "https://tuvalum.com/bicicletas-ciclismo/specialized-tarmac",
    external_images: [
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Madrid, España",
    seller_name: "Tuvalum Certified",
    is_active: true
  },
  {
    title: "Giant TCR Advanced Pro 1 Disc (Talla L)",
    price: 2150,
    original_price: 3600,
    category: "bicicletas",
    condition: "Buen Estado",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=giant%20tcr",
    external_images: [
      "https://images.unsplash.com/photo-1484920274317-87885fcbc504?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Bilbao, España",
    seller_name: "Mikel_Ciclismo",
    is_active: true
  },
  {
    title: "Merida Reacto 5000 (Aero) - Ruedas Carbono 50mm",
    price: 1850,
    original_price: 2899,
    category: "bicicletas",
    condition: "Excelente",
    source_portal: "BuyCycle",
    external_url: "https://buycycle.com/es-es/bike/merida-reacto",
    external_images: [
      "https://images.unsplash.com/photo-1571188654261-29e847cbb650?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Zaragoza, España",
    seller_name: "Jorge B.",
    is_active: true
  },

  // --- RUEDAS Y POTENCIÓMETROS ---
  {
    title: "Ruedas Zipp 404 Firecrest Carbono Disc",
    price: 950,
    original_price: 1900,
    category: "ruedas",
    condition: "Excelente",
    source_portal: "Tuvalum",
    external_url: "https://tuvalum.com/ruedas",
    external_images: [
      "https://images.unsplash.com/photo-1611078519159-20f78117d69d?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Sevilla, España",
    seller_name: "Tuvalum Certified",
    is_active: true
  },
  {
    title: "Ruedas DT Swiss ARC 1400 Dicut 62mm",
    price: 1100,
    original_price: 2100,
    category: "ruedas",
    condition: "Como Nuevo",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=dt%20swiss%20arc",
    external_images: [
      "https://images.unsplash.com/photo-1550983196-809ccb369ec2?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Málaga, España",
    seller_name: "Luis C.",
    is_active: true
  },
  {
    title: "Potenciómetro Favero Assioma Duo (Pedales)",
    price: 430,
    original_price: 695,
    category: "potenciometros",
    condition: "Como Nuevo",
    source_portal: "TuTriatlon",
    external_url: "https://tutriatlon.com/favero-assioma-duo",
    external_images: [
      "https://images.unsplash.com/photo-1595155988182-32a243261a86?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Alicante, España",
    seller_name: "BiciTech",
    is_active: true
  },

  // --- NEOPRENOS (NATACIÓN) ---
  {
    title: "Neopreno Orca Apex Flex (Talla MT) - Solo 2 usos",
    price: 320,
    original_price: 699,
    category: "neoprenos",
    condition: "Como Nuevo",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=orca%20apex%20flex",
    external_images: [
      "https://images.unsplash.com/photo-1629813200922-35dbdce3d5be?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Barcelona, España",
    seller_name: "Carlos Tri",
    is_active: true
  },
  {
    title: "Neopreno Zone3 Vanquish (Talla ML)",
    price: 250,
    original_price: 595,
    category: "neoprenos",
    condition: "Buen Estado",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=zone3%20vanquish",
    external_images: [
      "https://images.unsplash.com/photo-1590218765476-80f4f9f4477c?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Girona, España",
    seller_name: "NatacionPro",
    is_active: true
  },

  // --- RELOJES GPS ---
  {
    title: "Garmin Forerunner 945 - Batería al 90%",
    price: 195,
    original_price: 450,
    category: "gps",
    condition: "Buen Estado",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=garmin%20forerunner%20945",
    external_images: [
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Valencia, España",
    seller_name: "Ironman77",
    is_active: true
  },
  {
    title: "Garmin Fenix 7 Sapphire Solar",
    price: 520,
    original_price: 899,
    category: "gps",
    condition: "Como Nuevo",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=garmin%20fenix%207",
    external_images: [
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Murcia, España",
    seller_name: "Juan_Sport",
    is_active: true
  },

  // --- CASCOS Y ACCESORIOS ---
  {
    title: "Casco Giro Aerohead MIPS (Talla M) - Pantalla extra",
    price: 160,
    original_price: 320,
    category: "cascos",
    condition: "Como Nuevo",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=giro%20aerohead",
    external_images: [
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Bilbao, España",
    seller_name: "Marta_Swim",
    is_active: true
  },
  {
    title: "Palas de Natación Arena Elite + Aletas de Silicona (Lote)",
    price: 25,
    original_price: 55,
    category: "accesorios",
    condition: "Buen Estado",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=palas%20arena%20aletas",
    external_images: [
      "https://images.unsplash.com/photo-1530020302381-807c4b4d7f5f?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Zaragoza, España",
    seller_name: "Alex_Tri",
    is_active: true
  },
  {
    title: "Zapatillas Asics Metaspeed Sky+ (Talla 43) - Placa Carbono",
    price: 110,
    original_price: 250,
    category: "accesorios",
    condition: "Excelente",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=asics%20metaspeed",
    external_images: [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Madrid, España",
    seller_name: "RunFast",
    is_active: true
  },
  {
    title: "Gafas de Ciclismo Oakley Sutro Lite - Cristal Prizm Road",
    price: 90,
    original_price: 160,
    category: "accesorios",
    condition: "Como Nuevo",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=oakley%20sutro",
    external_images: [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Barcelona, España",
    seller_name: "PacoBike",
    is_active: true
  }
];

async function seedMarketplace() {
  console.log("Iniciando seedeo de chollos de marketplace con fotos Wallapop-style...");

  // Limpiar datos existentes
  await supabase.from('marketplace_items').delete().neq('id', 'dummy');

  const { data, error } = await supabase
    .from('marketplace_items')
    .insert(marketplaceItems);

  if (error) {
    console.error("Error al insertar items en marketplace:", error);
  } else {
    console.log(`¡Seedeo completado con éxito! Insertados ${marketplaceItems.length} chollos.`);
  }
}

seedMarketplace().catch(console.error);
