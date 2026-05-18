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
  {
    title: "Canyon Speedmax CF 8 Di2 (2023)",
    price: 2450,
    original_price: 4199,
    category: "bicicletas",
    condition: "Excelente",
    source_portal: "Tuvalum",
    external_url: "https://tuvalum.com/bicicletas-ciclismo/canyon-speedmax",
    external_images: [
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200&auto=format&fit=crop"
    ],
    location: "Madrid, España",
    seller_name: "Tuvalum Certified",
    is_active: true
  },
  {
    title: "Neopreno Orca Apex Flex (Talla MT)",
    price: 320,
    original_price: 699,
    category: "neoprenos",
    condition: "Como Nuevo",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=orca%20apex%20flex",
    external_images: [
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1200&auto=format&fit=crop"
    ],
    location: "Barcelona, España",
    seller_name: "Carlos Tri",
    is_active: true
  },
  {
    title: "Ruedas Zipp 404 Firecrest Carbono (Zapata)",
    price: 850,
    original_price: 1900,
    category: "ruedas",
    condition: "Buen Estado",
    source_portal: "ForoMTB",
    external_url: "https://foromtb.com/threads/ruedas-zipp-404-firecrest.123456/",
    external_images: [
      "https://images.unsplash.com/photo-1576435728678-68dd0f6a0c54?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=1200&auto=format&fit=crop"
    ],
    location: "Valencia, España",
    seller_name: "Ironman77",
    is_active: true
  },
  {
    title: "Pedales Favero Assioma Duo (Potenciómetro)",
    price: 450,
    original_price: 695,
    category: "potenciometros",
    condition: "Excelente",
    source_portal: "TuTriatlon",
    external_url: "https://tutriatlon.com/favero-assioma-duo",
    external_images: [
      "https://images.unsplash.com/photo-1528629297340-d1d466945dc5?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1200&auto=format&fit=crop"
    ],
    location: "Sevilla, España",
    seller_name: "TuTriatlon Store",
    is_active: true
  },
  {
    title: "Casco Giro Aerohead MIPS (Talla M)",
    price: 180,
    original_price: 320,
    category: "cascos",
    condition: "Como Nuevo",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=giro%20aerohead",
    external_images: [
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1561037404-61cd46aa615b?q=80&w=1200&auto=format&fit=crop"
    ],
    location: "Bilbao, España",
    seller_name: "Marta_Swim",
    is_active: true
  },
  {
    title: "Palas de Natación Arena Elite + Aletas de Silicona",
    price: 25,
    original_price: 55,
    category: "accesorios",
    condition: "Como Nuevo",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=palas%20arena%20aletas",
    external_images: [
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519315901367-f34f91e36324?q=80&w=1200&auto=format&fit=crop"
    ],
    location: "Zaragoza, España",
    seller_name: "Alex_Tri",
    is_active: true
  }
];

async function seedMarketplace() {
  console.log("Iniciando seedeo de chollos de marketplace...");

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
