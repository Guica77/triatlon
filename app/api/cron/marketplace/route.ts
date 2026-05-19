import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Esto es para que Vercel no cachee la ruta y la ejecute siempre
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  // 1. Verificación de seguridad de Vercel Cron
  // En producción, Vercel envía un header de autorización con el CRON_SECRET
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 2. Diccionarios de datos para generar anuncios aleatorios
  const categories = ['bicicletas', 'neoprenos', 'ruedas', 'potenciometros', 'cascos', 'gps', 'accesorios'];
  const conditions = ['Como Nuevo', 'Excelente', 'Buen Estado'];
  const portals = ['Wallapop', 'Tuvalum', 'BuyCycle', 'ForoMTB'];
  const locations = ['Madrid, España', 'Barcelona, España', 'Valencia, España', 'Sevilla, España', 'Zaragoza, España', 'Málaga, España', 'Murcia, España', 'Palma, España', 'Las Palmas, España', 'Bilbao, España'];
  const sellers = ['Juan Triatleta', 'BiciFan_99', 'Alex_Ironman', 'Carlos_Swim', 'Marta_Bike', 'ProStore_ES', 'Vendedor_Verificado', 'RuedasLocas_22', 'TriShop_Madrid'];

  // Catálogo de bases para generar items realistas
  const itemBases = [
    { cat: 'bicicletas', title: 'Canyon Aeroad CF SL 8', orig: 4500, minPrice: 2500, maxPrice: 3500, img: '1571188654261-29e847cbb650' },
    { cat: 'bicicletas', title: 'Specialized Shiv Expert Disc', orig: 8000, minPrice: 4000, maxPrice: 5500, img: '1485965120184-e220f721d03e' },
    { cat: 'bicicletas', title: 'Orbea Orca M30', orig: 2200, minPrice: 1200, maxPrice: 1600, img: '1532298229144-0ec0c57515c7' },
    { cat: 'neoprenos', title: 'Neopreno ROKA Maverick X2', orig: 995, minPrice: 500, maxPrice: 700, img: '1629813200922-35dbdce3d5be' },
    { cat: 'neoprenos', title: 'Neopreno Orca Alpha', orig: 650, minPrice: 300, maxPrice: 450, img: '1544161515-4ab6ce6db874' },
    { cat: 'ruedas', title: 'Ruedas DT Swiss ARC 1100 80mm', orig: 2400, minPrice: 1200, maxPrice: 1600, img: '1611078519159-20f78117d69d' },
    { cat: 'ruedas', title: 'Ruedas Campagnolo Bora WTO 60', orig: 2200, minPrice: 1100, maxPrice: 1500, img: '1550983196-809ccb369ec2' },
    { cat: 'potenciometros', title: 'Bielas Quarq DZero', orig: 650, minPrice: 300, maxPrice: 450, img: '1595155988182-32a243261a86' },
    { cat: 'cascos', title: 'Casco Aero Kask Utopia', orig: 250, minPrice: 120, maxPrice: 180, img: '1557804506-669a67965ba0' },
    { cat: 'gps', title: 'Garmin Edge 830', orig: 400, minPrice: 200, maxPrice: 280, img: '1517502884422-41eaead166d4' },
    { cat: 'gps', title: 'Wahoo Elemnt Roam v2', orig: 400, minPrice: 220, maxPrice: 300, img: '1508685096489-7aacd43bd3b1' },
    { cat: 'accesorios', title: 'Zapatillas Nike Alphafly NEXT% 2', orig: 300, minPrice: 120, maxPrice: 190, img: '1560769629-975ec94e6a86' }
  ];

  // Determinar número aleatorio de anuncios a generar hoy (entre 1 y 3)
  const numItems = Math.floor(Math.random() * 3) + 1;
  const newItems = [];

  for (let i = 0; i < numItems; i++) {
    // Seleccionar una base aleatoria
    const base = itemBases[Math.floor(Math.random() * itemBases.length)];
    
    // Generar precio aleatorio entre el min y max
    const price = Math.floor(Math.random() * (base.maxPrice - base.minPrice + 1)) + base.minPrice;
    
    // Generar URL de búsqueda falsa basada en el título
    const urlTitle = encodeURIComponent(base.title.split(' ').slice(0, 2).join(' '));
    const portal = portals[Math.floor(Math.random() * portals.length)];
    let external_url = `https://es.wallapop.com/app/search?keywords=${urlTitle}`;
    if (portal === 'Tuvalum') external_url = `https://tuvalum.com/bicicletas-ciclismo/${urlTitle}`;
    if (portal === 'BuyCycle') external_url = `https://buycycle.com/es-es/bike/${urlTitle}`;
    
    newItems.push({
      title: `${base.title} ${Math.random() > 0.5 ? '(Oportunidad)' : '- Muy Cuidado'}`,
      price: price,
      original_price: base.orig,
      category: base.cat,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      source_portal: portal,
      external_url: external_url,
      external_images: [`https://images.unsplash.com/photo-${base.img}?auto=format&fit=crop&q=80&w=800`],
      location: locations[Math.floor(Math.random() * locations.length)],
      seller_name: sellers[Math.floor(Math.random() * sellers.length)],
      is_active: true
    });
  }

  // 3. Insertar en base de datos
  const { data, error } = await supabase
    .from('marketplace_items')
    .insert(newItems);

  if (error) {
    console.error("Error en CRON job de marketplace:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: `Generados ${numItems} nuevos anuncios diarios.`,
    items: newItems
  });
}
