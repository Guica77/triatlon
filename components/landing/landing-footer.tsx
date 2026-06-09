'use client';

import * as React from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="bg-zinc-950/60 border-t border-zinc-900/80 py-12 px-4 sm:px-8 text-center text-xs text-zinc-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />
          </div>
          <span className="font-bold text-zinc-300">TRIATLON PRO</span>
        </div>
        <p>© {new Date().getFullYear()} Triatlon Pro Inc. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <Link href="/terminos" className="hover:text-zinc-300">Términos</Link>
          <Link href="/privacidad" className="hover:text-zinc-300">Privacidad</Link>
          <Link href="/soporte" className="hover:text-zinc-300">Soporte</Link>
        </div>
      </div>
    </footer>
  );
}
