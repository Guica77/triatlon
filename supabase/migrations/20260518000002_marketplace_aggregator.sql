-- Migración SQL: Tabla para el Agregador de Marketplace de Segunda Mano (AI Scraper Hub) con imágenes reales y enlaces externos

CREATE TABLE IF NOT EXISTS marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC, -- Precio nuevo estimado para calcular ahorro
  category TEXT NOT NULL, -- 'bicicletas', 'neoprenos', 'ruedas', 'potenciometros', 'cascos', 'gps', 'accesorios'
  condition TEXT NOT NULL, -- 'Como Nuevo', 'Excelente', 'Buen Estado'
  source_portal TEXT NOT NULL, -- 'Wallapop', 'Tuvalum', 'TuTriatlon', 'BuyCycle', 'ForoMTB'
  external_url TEXT NOT NULL, -- Enlace directo al anuncio original en la web del vendedor
  external_images TEXT[] NOT NULL, -- URLs de las fotos reales del anuncio
  location TEXT,
  seller_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_items_category ON marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_is_active ON marketplace_items(is_active);
