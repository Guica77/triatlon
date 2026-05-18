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
      "https://images.immediate.co.uk/production/volatile/sites/21/2021/03/Canyon-Speedmax-CF-8-Disc-02-1a4b656.jpg",
      "https://cdn.bikeradar.com/image/upload/v1617188722/Canyon-Speedmax-CF-8-Disc-01-0bc07e2.jpg"
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
      "https://triathlonwetsuitstore.com/wp-content/uploads/2022/04/Orca-Apex-Flex-Mens-Triathlon-Wetsuit-1.jpg",
      "https://cdn.shopify.com/s/files/1/0554/7445/0585/files/Apex_Flex_Men_2.jpg"
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
      "https://cdn.sigmasports.com/images/products/56795/1000/zipp-404-firecrest-carbon-clincher-wheelset-1.jpg",
      "https://sram-cdn-pull-zone.sram.com/media/catalog/product/w/h/wh-404-ftub-a1-main.jpg"
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
      "https://cyclingpro.com/wp-content/uploads/2018/06/assioma_duo_pack.jpg",
      "https://cdn.shopify.com/s/files/1/0280/8404/3829/products/favero-assioma-duo-power-meter-pedals-3_1024x1024.jpg"
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
      "https://cdn.sigmasports.com/images/products/47941/1000/giro-aerohead-mips-time-trial-helmet-1.jpg",
      "https://images.immediate.co.uk/production/volatile/sites/21/2019/03/1490977226992-1k1qzz20s7s33-d9ea217.jpg"
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
      "https://cdn.swimoutlet.com/photos/options/8115682-27756-zoom.jpg",
      "https://m.media-amazon.com/images/I/61Gg29rXJPL._AC_SL1500_.jpg"
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
