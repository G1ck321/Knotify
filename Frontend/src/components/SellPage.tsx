import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

interface SellPageProps {
  onBackToShop?: () => void;
}

export default function SellPage({ onBackToShop }: SellPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 md:py-32 text-center flex flex-col items-center justify-center min-h-[60vh]" id="sell-page-root">

      {/* BOLD BACK-TO-SHOP ANCHOR (top-left) */}
      {onBackToShop && (
        <div className="w-full mb-8 text-left">
          <button
            onClick={onBackToShop}
            className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-brand-primary hover:text-brand-secondary transition-colors cursor-pointer group"
            id="btn-back-to-shop"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Shop</span>
          </button>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="space-y-8"
      >
        <h1 className="font-display font-light text-6xl sm:text-8xl md:text-9xl text-brand-primary tracking-tight leading-none select-none">
          COMING <br />
          <span className="italic font-normal text-brand-secondary">SOON</span>
        </h1>
        
        <p className="font-sans text-xs sm:text-sm md:text-base text-brand-secondary max-w-lg mx-auto leading-relaxed font-light">
          We are making it easy to sell your old ties to other students in the hostels. Soon, you can list your extra ties here and hand them over directly to students who need them.
        </p>

        <div className="pt-8 flex flex-col items-center gap-4">
          <div className="h-px w-16 bg-brand-primary/30" />
          <span className="font-mono text-[9px] tracking-[0.2em] text-brand-secondary uppercase">
            Helping Students Dress Well
          </span>
        </div>
      </motion.div>
    </div>
  );
}
