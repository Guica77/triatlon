'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Bike, Tag, MapPin, Loader2, Sparkles } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { createMarketplaceListing } from '@/app/(app)/marketplace/actions';

interface SellItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  virtualGarage: string[];
}

export function SellItemModal({ isOpen, onClose, virtualGarage }: SellItemModalProps) {
  const [title, setTitle] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [originalPrice, setOriginalPrice] = React.useState('');
  const [category, setCategory] = React.useState('accesorios');
  const [condition, setCondition] = React.useState('Excelente');
  const [location, setLocation] = React.useState('');
  // Fake image upload state for demo purposes
  const [imageUrl, setImageUrl] = React.useState('');
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleGarageSelect = (item: string) => {
    setTitle(item);
    // Try to guess category
    const lower = item.toLowerCase();
    if (lower.includes('bici') || lower.includes('cabra') || lower.includes('aero')) setCategory('bicicletas');
    else if (lower.includes('neopreno') || lower.includes('huub') || lower.includes('orca')) setCategory('neoprenos');
    else if (lower.includes('rueda') || lower.includes('zipp')) setCategory('ruedas');
    else if (lower.includes('garmin') || lower.includes('reloj') || lower.includes('wahoo')) setCategory('gps');
    else setCategory('accesorios');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !location) {
      setErrorMsg('Por favor, rellena los campos obligatorios (Título, Precio, Ubicación).');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const result = await createMarketplaceListing({
        title,
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : undefined,
        category,
        condition,
        location,
        images: imageUrl ? [imageUrl] : []
      });

      if (result.error) {
        setErrorMsg(result.error);
      } else {
        // Success
        setTitle('');
        setPrice('');
        setOriginalPrice('');
        setImageUrl('');
        setLocation('');
        onClose();
      }
    } catch (err) {
      setErrorMsg('Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-2xl bg-[#121214] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-800/80 bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Vender Material</h3>
              </div>
              <button 
                title="Cerrar Modal"
                aria-label="Cerrar Modal"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Form */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              
              {/* Virtual Garage Quick Select */}
              {virtualGarage.length > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-zinc-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Importar de tu Garaje Virtual</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {virtualGarage.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleGarageSelect(item)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 hover:text-white transition-colors border border-zinc-700"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">¿Qué vas a vender? *</label>
                  <div className="relative">
                    <Bike className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Ej. Ruedas Zipp 404 Firecrest Carbono"
                      className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl text-sm text-white placeholder-zinc-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoría</label>
                    <select
                      title="Categoría"
                      aria-label="Categoría"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl text-sm text-white outline-none"
                    >
                      <option value="bicicletas">Bicicletas & Cabras</option>
                      <option value="neoprenos">Neoprenos</option>
                      <option value="ruedas">Ruedas Carbono</option>
                      <option value="potenciometros">Potenciómetros</option>
                      <option value="cascos">Cascos Aero</option>
                      <option value="gps">Relojes GPS</option>
                      <option value="accesorios">Accesorios</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado</label>
                    <select
                      title="Estado"
                      aria-label="Estado"
                      value={condition}
                      onChange={e => setCondition(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl text-sm text-white outline-none"
                    >
                      <option value="Como Nuevo">Como Nuevo (Poco uso)</option>
                      <option value="Excelente">Excelente (Con marcas mínimas)</option>
                      <option value="Buen Estado">Buen Estado (Uso normal)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Precio de Venta (€) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">€</span>
                      <input
                        type="number"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl text-sm text-white outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Precio Original (Opcional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">€</span>
                      <input
                        type="number"
                        value={originalPrice}
                        onChange={e => setOriginalPrice(e.target.value)}
                        placeholder="Precio en tienda"
                        className="w-full pl-8 pr-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl text-sm text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ciudad / Ubicación *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Ej. Madrid, Barcelona, Envío a península"
                      className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl text-sm text-white placeholder-zinc-600 outline-none"
                    />
                  </div>
                </div>

                {/* Fake Image Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Fotos del producto</label>
                  <div className="w-full h-32 border-2 border-dashed border-zinc-700 hover:border-cyan-500/50 rounded-2xl bg-zinc-900/50 flex flex-col items-center justify-center transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                      <Upload className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200">Subir imágenes o arrastrar aquí</span>
                    <span className="text-[10px] text-zinc-600 mt-1">PNG, JPG, HEIC hasta 10MB</span>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-4 flex items-center gap-3 justify-end border-t border-zinc-800/80">
                  <AnimatedButton
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-sm font-semibold rounded-xl text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </AnimatedButton>
                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 !bg-cyan-500 hover:!bg-cyan-400 !text-black text-sm font-extrabold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      'Publicar Anuncio'
                    )}
                  </AnimatedButton>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
