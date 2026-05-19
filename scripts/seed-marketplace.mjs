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
    title: "Canyon Speedmax CF 8 Di2 (2023) - Talla M",
    price: 2450,
    original_price: 4199,
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
    title: "Neopreno Orca Apex Flex (Talla MT) - Poco Uso",
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
    title: "Garmin Forerunner 945 - Batería al 90%",
    price: 210,
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
    title: "Ruedas Zipp 404 Firecrest Carbono",
    price: 850,
    original_price: 1900,
    category: "ruedas",
    condition: "Buen Estado",
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
    title: "Casco Giro Aerohead MIPS (Talla M)",
    price: 180,
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
