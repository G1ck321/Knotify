import React from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import AboutSection from './AboutSection';

interface AboutPageProps {
  onBackToShop: () => void;
}

export default function AboutPage({ onBackToShop }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-brand-bg" id="about-page">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pb-5 pt-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBackToShop}
          className="inline-flex items-center  gap-2 text-xs font-bold uppercase tracking-widest text-brand-primary hover:text-brand-secondary"
        >
          <ArrowLeft size={15} />
          Back to Shop
        </button>
        <span className="hidden items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-brand-secondary sm:flex">
          <Users size={13} />
          Built for Covenant students
        </span>
      </div>

      <section className="border-y border-brand-border/30 bg-brand-secondary px-4 py-16 text-center text-brand-bg sm:px-6 sm:py-24">
        <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-brand-bg/70">Our mission</p>
        <h1 className="mx-auto mt-4 max-w-4xl font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">
          Prepare with confidence.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-brand-bg/80 sm:text-base">
          Knotify helps Covenant University students secure compliant neckwear & during resumption, with clear stock, trusted payment, and simple hall delivery.
        </p>
        <div className="mt-10 inline-flex flex-col items-center gap-1">
          <span className="font-display text-5xl font-black sm:text-7xl">1,850+</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-brand-bg/65">Students serving capacity</span>
        </div>
      </section>

      <AboutSection />
    </div>
  );
}
