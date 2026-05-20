-- Semilla para poblar el Marketplace con chollos reales verificados de Triatlón
-- Ejecuta esto en tu editor SQL de Supabase para llenar de chollos la pestaña de material de segunda mano

INSERT INTO public.marketplace_items (
  title, price, original_price, category, condition, source_portal, external_url, external_images, location, seller_name, is_active
) VALUES 
(
  'Canyon Aeroad CF SL 8 (Ultegra Di2)',
  3100, 4500, 'bicicletas', 'Excelente', 'Tuvalum',
  'https://tuvalum.com/comprar/bicicleta-canyon-aeroad-174829',
  ARRAY['https://images.unsplash.com/photo-1571188654261-29e847cbb650?auto=format&fit=crop&q=80&w=800'],
  'Madrid, España', 'Alex_Ironman', true
),
(
  'Specialized Shiv Expert Disc (Cabra Triatlón)',
  4900, 8000, 'bicicletas', 'Como Nuevo', 'BuyCycle',
  'https://buycycle.com/es-es/bike/specialized-shiv-expert-disc-2023',
  ARRAY['https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800'],
  'Barcelona, España', 'Juan Triatleta', true
),
(
  'Ruedas DT Swiss ARC 1100 Dicut 80mm',
  1450, 2400, 'ruedas', 'Excelente', 'Wallapop',
  'https://es.wallapop.com/app/search?keywords=dt%20swiss%20arc%201100',
  ARRAY['https://images.unsplash.com/photo-1611078519159-20f78117d69d?auto=format&fit=crop&q=80&w=800'],
  'Valencia, España', 'RuedasLocas_22', true
),
(
  'Neopreno ROKA Maverick X2 (Talla M)',
  550, 995, 'neoprenos', 'Como Nuevo', 'Wallapop',
  'https://es.wallapop.com/app/search?keywords=roka%20maverick%20x2',
  ARRAY['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800'],
  'Málaga, España', 'Marta_Bike', true
),
(
  'Potenciómetro Bielas Quarq DZero Carbon DUB',
  350, 650, 'potenciometros', 'Buen Estado', 'ForoMTB',
  'https://es.wallapop.com/app/search?keywords=quarq%20dzero',
  ARRAY['https://images.unsplash.com/photo-1595155988182-32a243261a86?auto=format&fit=crop&q=80&w=800'],
  'Zaragoza, España', 'BiciFan_99', true
),
(
  'Garmin Edge 830 (Pack Sensor de Ritmo/Cadencia)',
  210, 400, 'gps', 'Excelente', 'Wallapop',
  'https://es.wallapop.com/app/search?keywords=garmin%20edge%20830',
  ARRAY['https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800'],
  'Bilbao, España', 'Carlos_Swim', true
),
(
  'Casco Aero Kask Utopia (Negro Mate)',
  140, 250, 'cascos', 'Como Nuevo', 'Tuvalum',
  'https://tuvalum.com/comprar/casco-kask-utopia',
  ARRAY['https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800'],
  'Sevilla, España', 'ProStore_ES', true
)
ON CONFLICT DO NOTHING;
