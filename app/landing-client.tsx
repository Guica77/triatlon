'use client';

import * as React from 'react';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesBento } from '@/components/landing/features-bento';
import { PricingCalculator } from '@/components/landing/pricing-calculator';
import { PricingCards } from '@/components/landing/pricing-cards';
import { LandingFooter } from '@/components/landing/landing-footer';

export function LandingClient() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <LandingNavbar />
      <HeroSection />
      <FeaturesBento />
      <PricingCalculator />
      <PricingCards />
      <LandingFooter />
    </div>
  );
}
