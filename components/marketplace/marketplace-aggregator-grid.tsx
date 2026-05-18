'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, ExternalLink, Tag, Filter, CheckCircle2, AlertTriangle, Sparkles, MapPin } from 'lucide-react';

export interface MarketplaceItem {
  id: string;
  title: string;
  price: number;
  original_price?: number | null;
  category: string;
  condition: string;
  source_portal: string;
  external_url: string;
  external_images: string[];
  location?: string | null;
  seller_name?: string | null;
  is_active: boolean;
  created_at: string;
}

interface MarketplaceGridProps {
  initialItems: MarketplaceItem[];
  initialCategory?: string;
  initialSearchQuery?: string;
  userWorkoutGearNeeded?: string[];
}

export function MarketplaceAggregatorGrid({ initialItems, initialCategory = 'todos', initialSearchQuery = '', userWorkoutGearNeeded = [] }: MarketplaceGridProps) {
  const [items, setItems] = useState<MarketplaceItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCondition, setSelectedCondition] = useState('todos');
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc' | 'discount'>('discount');
  const [reportedItems, setReportedItems] = useState<Record<string, boolean>>({});
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({});

  const categories = [
    { id: 'todos', label: '🏊‍♂️ Todo el Material' },
    { id: 'bicicletas', label: '🚴‍♂️ Bicicletas & Cabras' },
    { id: 'neoprenos', label: '🩱 Neoprenos' },
    { id: 'ruedas', label: '⭕ Ruedas Carbono' },
    { id: 'potenciometros', label: '⚡ Potenciómetros' },
    { id: 'cascos', label: '🪖 Cascos Aero' },
    { id: 'gps', label: '⌚ Relojes GPS' },
    { id: 'accesorios', label: '🎒 Accesorios' },
  ];

  const conditions = ['todos', 'Como Nuevo', 'Excelente', 'Buen Estado'];

  // Filtrado y Ordenación Memoizada
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!item.is_active || reportedItems[item.id]) return false;

      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'todos' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesCondition = selectedCondition === 'todos' || item.condition.toLowerCase() === selectedCondition.toLowerCase();

      return matchesSearch && matchesCategory && matchesCondition;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'discount') {
        const discountA = a.original_price ? ((a.original_price - a.price) / a.original_price) : 0;
        const discountB = b.original_price ? ((b.original_price - b.price) / b.original_price) : 0;
        return discountB - discountA;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [items, searchQuery, selectedCategory, selectedCondition, sortBy, reportedItems]);

  const handleNextImage = (itemId: string, maxImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndices(prev => ({
      ...prev,
      [itemId]: prev[itemId] !== undefined ? (prev[itemId] + 1) % maxImages : 1
    }));
  };

  const handlePrevImage = (itemId: string, maxImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndices(prev => ({
      ...prev,
      [itemId]: prev[itemId] !== undefined ? (prev[itemId] - 1 + maxImages) % maxImages : maxImages - 1
    }));
  };

  const handleReportLink = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm('¿Confirmas que este anuncio ya no existe o el enlace está caído? Lo ocultaremos para la comunidad.')) {
      setReportedItems(prev => ({ ...prev, [itemId]: true }));
    }
  };

  const getPortalBadgeStyle = (portal: string) => {
    const p = portal.toLowerCase();
    if (p.includes('tuvalum')) return { bg: 'bg-[#ff6b00]/20', border: 'border-[#ff6b00]/40', text: 'text-[#ff6b00]', label: 'Tuvalum • Certificado' };
    if (p.includes('wallapop')) return { bg: 'bg-[#13c1ac]/20', border: 'border-[#13c1ac]/40', text: 'text-[#13c1ac]', label: 'Wallapop • Verificado' };
    if (p.includes('buycycle')) return { bg: 'bg-[#3b82f6]/20', border: 'border-[#3b82f6]/40', text: 'text-[#3b82f6]', label: 'BuyCycle • Garantía' };
    return { bg: 'bg-zinc-800', border: 'border-zinc-700', text: 'text-zinc-300', label: `${portal} • Rastreado` };
  };

  return (
    <div className="space-y-6">
      {/* Banner de IA Contextual */}
      {userWorkoutGearNeeded.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-blue-950/40 border border-cyan-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                  IA Gear Match
                </span>
                <h3 className="text-white font-bold text-sm sm:text-base line-clamp-1">Sugerencia para tus entrenamientos</h3>
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1 line-clamp-2">
                Hemos detectado que necesitas <strong className="text-white font-semibold">{userWorkoutGearNeeded.join(', ')}</strong>. Aquí tienes los chollos locales compatibles.
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            <button 
              onClick={() => {
                setSearchQuery(userWorkoutGearNeeded[0] || '');
                setSelectedCategory('accesorios');
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 sm:py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              Filtrar Sugeridos
            </button>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('todos'); }}
              className="px-3.5 py-2.5 sm:py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs sm:text-sm transition border border-zinc-700 cursor-pointer"
            >
              Ver Todos
            </button>
          </div>
        </motion.div>
      )}

      {/* Buscador y Filtros */}
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar bicicletas Canyon, ruedas Zipp, Garmin..."
              className="w-full bg-zinc-900 border border-zinc-700/80 focus:border-cyan-500 rounded-xl pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 text-white placeholder-zinc-500 font-medium text-xs sm:text-sm focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-[11px] sm:text-xs font-bold bg-zinc-800 px-2 py-1 rounded-md cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
          
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto scrollbar-none">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 sm:px-4 py-2 shrink-0 flex-1 sm:flex-none justify-center sm:justify-start">
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
              <select 
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="bg-transparent text-white text-xs sm:text-sm font-medium focus:outline-none cursor-pointer pr-1 sm:pr-2 w-full sm:w-auto"
              >
                <option value="todos" className="bg-zinc-900">Estado: Todos</option>
                <option value="Como Nuevo" className="bg-zinc-900">Como Nuevo</option>
                <option value="Excelente" className="bg-zinc-900">Excelente</option>
                <option value="Buen Estado" className="bg-zinc-900">Buen Estado</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 sm:px-4 py-2 shrink-0 flex-1 sm:flex-none justify-center sm:justify-start">
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white text-xs sm:text-sm font-medium focus:outline-none cursor-pointer pr-1 sm:pr-2 w-full sm:w-auto"
              >
                <option value="recent" className="bg-zinc-900">Más Recientes</option>
                <option value="price-asc" className="bg-zinc-900">Precio: Menor a Mayor</option>
                <option value="price-desc" className="bg-zinc-900">Precio: Mayor a Menor</option>
                <option value="discount" className="bg-zinc-900">Mayor % Descuento</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categorías Horizontales */}
        <div className="flex gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 border ${
                  isSelected 
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105' 
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Productos Bento */}
      <AnimatePresence mode="popLayout">
        {filteredItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[#18181b] border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center space-y-4"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-500">
              <Search className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h4 className="text-white font-bold text-base sm:text-lg">No se han encontrado chollos</h4>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto">
              No hay material disponible para los filtros seleccionados. Nuestro motor de IA rastrea nuevos portales cada hora.
            </p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('todos'); setSelectedCondition('todos'); }}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-zinc-700 transition text-xs sm:text-sm cursor-pointer"
            >
              Restablecer Filtros
            </button>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredItems.map((item, index) => {
              const currentImgIdx = currentImageIndices[item.id] || 0;
              const hasMultipleImages = item.external_images.length > 1;
              const portalStyle = getPortalBadgeStyle(item.source_portal);
              const discountPercent = item.original_price ? Math.round(((item.original_price - item.price) / item.original_price) * 100) : 0;

              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  key={item.id}
                  className="bg-[#18181b] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl hover:shadow-2xl transition-all duration-300 group"
                >
                  {/* Carrusel Superior de Imágenes Reales */}
                  <div className="relative h-64 w-full bg-zinc-900 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentImgIdx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                      >
                        <img 
                          src={item.external_images[currentImgIdx] || 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=1200&auto=format&fit=crop'}
                          alt={item.title}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=1200&auto=format&fit=crop';
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Overlay de Gradiente Oscuro para Legibilidad */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-black/40" />

                    {/* Badges Superiores */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold border backdrop-blur-md shadow-lg ${portalStyle.bg} ${portalStyle.border} ${portalStyle.text} flex items-center gap-1.5`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {portalStyle.label}
                      </span>
                      {discountPercent > 0 && (
                        <span className="bg-emerald-500 text-black font-black text-xs px-2.5 py-1 rounded-lg shadow-lg border border-emerald-400">
                          -{discountPercent}%
                        </span>
                      )}
                    </div>

                    {/* Controles del Carrusel */}
                    {hasMultipleImages && (
                      <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          onClick={(e) => handlePrevImage(item.id, item.external_images.length, e)}
                          className="w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 flex items-center justify-center backdrop-blur-sm transition shadow-lg cursor-pointer"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => handleNextImage(item.id, item.external_images.length, e)}
                          className="w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 flex items-center justify-center backdrop-blur-sm transition shadow-lg cursor-pointer"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {/* Indicadores de Puntos */}
                    {hasMultipleImages && (
                      <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
                        {item.external_images.map((_, imgIdx) => (
                          <div 
                            key={imgIdx}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${imgIdx === currentImgIdx ? 'bg-cyan-400 w-4' : 'bg-white/40'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          {item.category} • {item.condition}
                        </span>
                        <div className="flex items-baseline gap-2">
                          {item.original_price && (
                            <span className="text-sm line-through text-zinc-500 font-semibold">
                              {item.original_price}€
                            </span>
                          )}
                          <span className="text-xl font-extrabold text-emerald-400">
                            {item.price}€
                          </span>
                        </div>
                      </div>

                      <h4 className="text-white font-bold text-base line-clamp-2 group-hover:text-cyan-400 transition-colors">
                        {item.title}
                      </h4>
                    </div>

                    {/* Ubicación y Vendedor */}
                    <div className="pt-4 border-t border-zinc-800/80 flex justify-between items-center text-xs text-zinc-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="truncate max-w-[120px]">{item.location || 'España'}</span>
                      </div>
                      <span className="text-zinc-500 font-semibold">{item.seller_name || 'Vendedor Verificado'}</span>
                    </div>

                    {/* Botones de Acción */}
                    <div className="space-y-2 pt-2">
                      <button 
                        onClick={() => window.open(item.external_url, '_blank')}
                        className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 cursor-pointer group/btn"
                      >
                        <span>Comprar en {item.source_portal}</span>
                        <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>

                      <div className="flex justify-center">
                        <button 
                          onClick={(e) => handleReportLink(item.id, e)}
                          className="text-zinc-600 hover:text-zinc-400 text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          ¿Enlace caído? Reportar
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
