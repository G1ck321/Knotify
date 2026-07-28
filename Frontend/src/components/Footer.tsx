import React from 'react';
import { ShieldCheck, Award } from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: 'home' | 'marketplace' | 'sell' | 'checkout') => void;
  onOpenBecomeSeller: () => void;
}

export default function Footer({ setCurrentTab, onOpenBecomeSeller }: FooterProps) {
  return (
    <footer className="bg-brand-bg pt-20 pb-16 px-6 sm:px-12 border-t border-brand-border text-left" id="site-footer">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-start">
        
        {/* Column 1: Minimalist logo & mission summary */}
        <div className="md:col-span-5 space-y-5">
          <div className="flex items-baseline gap-1.5 cursor-pointer select-none" onClick={() => setCurrentTab('home')}>
            <span className="font-display font-black text-2xl text-brand-primary tracking-tight">
              Knotify
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary inline-block"></span>
          </div>
          <p className="text-xs text-brand-primary/65 leading-relaxed max-w-sm font-sans">
            Peer-to-peer academic neckwear exchange for Covenant University students. We make getting premium chapel-approved ties easy, affordable, and fully compliant.
          </p>
        </div>

        {/* Column 2: Navigation Links */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-primary/50 font-bold">
            Navigation
          </h4>
          <div className="flex flex-col space-y-3 text-xs font-medium text-brand-primary/80">
            <button onClick={() => setCurrentTab('home')} className="hover:text-brand-secondary text-left transition-colors cursor-pointer hover:underline underline-offset-4 decoration-brand-secondary/40">
              Home Showcase
            </button>
            <button onClick={() => setCurrentTab('marketplace')} className="hover:text-brand-secondary text-left transition-colors cursor-pointer hover:underline underline-offset-4 decoration-brand-secondary/40">
              Ties Catalog
            </button>
            <button onClick={onOpenBecomeSeller} className="hover:text-brand-secondary text-left transition-colors cursor-pointer hover:underline underline-offset-4 decoration-brand-secondary/40">
              Sell Your Tie
            </button>
          </div>
        </div>

        {/* Column 3: The Academic Standard Statement */}
        <div className="md:col-span-4 space-y-4">
          <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-primary/50 font-bold">
            Administrative Standard
          </h4>
          <p className="text-xs text-brand-primary/65 font-sans leading-relaxed">
            All listed neckwear conforms to Peter, Paul, Daniel, PG, Esther, and Lydia Hall sartorial guidelines and university chapel dress codes. Hand-verified by student coordinators before lobby delivery.
          </p>
        </div>

      </div>

      {/* Under line & Academic Motto */}
      <div className="max-w-7xl mx-auto border-t border-brand-border mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-[10px] font-mono text-brand-primary/45">
        <div className="flex items-center gap-2">
          <span>© 2026 Knotify. Designed for Covenant Scholars.</span>
        </div>
        <span className="font-display italic text-sm text-brand-secondary/70">Dignitas et Elegantia in Omnia</span>
      </div>
    </footer>
  );
}
