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

const generateIronmanItems = () => {
  const ironmanBikes = [
    { title: "Canyon Speedmax CF SLX 8 Di2 Ironman Edition", price: 6200, orig: 8500, cond: "Excelente" },
    { title: "Trek Speed Concept Project One Ironman", price: 5800, orig: 9000, cond: "Como Nuevo" },
    { title: "Specialized Shiv Disc Ironman Kona", price: 7100, orig: 10500, cond: "Buen Estado" },
    { title: "Cervélo P5 Disc Force eTap (Usada en Ironman Vitoria)", price: 5500, orig: 8200, cond: "Excelente" },
    { title: "Orbea Ordu M10iLTD Ironman Custom", price: 4900, orig: 7999, cond: "Como Nuevo" },
    { title: "Quintana Roo PRsix2 Disc Ironman", price: 3800, orig: 6000, cond: "Excelente" },
    { title: "Argon 18 E-119 Tri+ Disc", price: 4200, orig: 7500, cond: "Buen Estado" },
    { title: "Felt IA Advanced Ultegra Di2", price: 3100, orig: 5200, cond: "Como Nuevo" },
    { title: "BMC Timemachine 01 Disc", price: 4800, orig: 7499, cond: "Excelente" },
    { title: "Scott Plasma 6 Ironman Edition", price: 6500, orig: 9999, cond: "Como Nuevo" }
  ].map((b, i) => ({
    title: b.title,
    price: b.price,
    original_price: b.orig,
    category: "bicicletas",
    condition: b.cond,
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=ironman%20bike",
    external_images: ["https://images.unsplash.com/photo-1618886487325-f66f5087405e?auto=format&fit=crop&q=80&w=800"],
    location: ["Madrid", "Barcelona", "Valencia", "Lanzarote", "Vitoria"][i % 5] + ", España",
    seller_name: "IronmanFinisher_" + i,
    is_active: true
  }));

  const ironmanGear = [
    { title: "Neopreno Ironman ROKA Maverick Pro II", price: 450, orig: 900, cat: "neoprenos", img: "1629813200922-35dbdce3d5be" },
    { title: "Mochila Transición Ironman Vitoria", price: 45, orig: 90, cat: "accesorios", img: "1550983196-809ccb369ec2" },
    { title: "Garmin Forerunner 945 LTE (Batería para Ironman)", price: 290, orig: 600, cat: "gps", img: "1508685096489-7aacd43bd3b1" },
    { title: "Ruedas Zipp 858 NSW Carbono (Kona Edition)", price: 2100, orig: 4000, cat: "ruedas", img: "1611078519159-20f78117d69d" },
    { title: "Trisuit Castelli PR Speed Suit Ironman", price: 150, orig: 350, cat: "accesorios", img: "1560769629-975ec94e6a86" },
    { title: "Sistema Hidratación Aero XLAB Torpedo", price: 65, orig: 140, cat: "accesorios", img: "1530020302381-807c4b4d7f5f" },
    { title: "Casco Aero POC Cerebel Ironman", price: 180, orig: 350, cat: "cascos", img: "1557804506-669a67965ba0" },
    { title: "Potenciómetro Garmin Rally RS200", price: 550, orig: 1099, cat: "potenciometros", img: "1595155988182-32a243261a86" },
    { title: "Zapatillas Asics Metaspeed Edge+ Ironman", price: 120, orig: 250, cat: "accesorios", img: "1560769629-975ec94e6a86" },
    { title: "Neopreno HUUB Brownlee Agilis Ironman", price: 380, orig: 750, cat: "neoprenos", img: "1544161515-4ab6ce6db874" }
  ].map((g, i) => ({
    title: g.title,
    price: g.price,
    original_price: g.orig,
    category: g.cat,
    condition: i % 2 === 0 ? "Como Nuevo" : "Buen Estado",
    source_portal: "Wallapop",
    external_url: "https://es.wallapop.com/app/search?keywords=ironman",
    external_images: [`https://images.unsplash.com/photo-${g.img}?auto=format&fit=crop&q=80&w=800`],
    location: ["Sevilla", "Zaragoza", "Bilbao", "Alicante", "Málaga"][i % 5] + ", España",
    seller_name: "TriAtleta_" + i,
    is_active: true
  }));

  return [...ironmanBikes, ...ironmanGear];
};

const marketplaceItems = generateIronmanItems();

async function seedMarketplace() {
  console.log("Iniciando volcado masivo de Wallapop (Filtro: IRONMAN)...");

  await supabase.from('marketplace_items').delete().neq('id', 'dummy');

  const { data, error } = await supabase
    .from('marketplace_items')
    .insert(marketplaceItems);

  if (error) {
    console.error("Error al insertar items en marketplace:", error);
  } else {
    console.log(`¡Seedeo completado con éxito! Insertados ${marketplaceItems.length} anuncios de Ironman de Wallapop.`);
  }
}

seedMarketplace().catch(console.error);
