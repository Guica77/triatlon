'use client';

import * as React from 'react';
import { PlusCircle } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { SellItemModal } from './sell-item-modal';

export function SellItemButton({ virtualGarage }: { virtualGarage: string[] }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <AnimatedButton 
        variant="primary" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="!bg-emerald-500 hover:!bg-emerald-400 !text-black border border-transparent flex items-center gap-2 font-bold px-4 py-2"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Vender Material</span>
      </AnimatedButton>

      <SellItemModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        virtualGarage={virtualGarage}
      />
    </>
  );
}
