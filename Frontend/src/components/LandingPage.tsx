import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  Package, 
  MapPin, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  MessageCircle,
  Send,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  MessageSquareQuote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { INITIAL_PRODUCTS, Product } from '../types';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onBrowseMarketplace: () => void;
  onBrowseWithFilter: (category: string, search: string) => void;
  products: Product[];
  featuredProducts: Product[];
  onOpenProductDetail: (product: Product) => void;
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
  isInWishlist: (productId: string) => boolean;
  onNavigateAbout?: () => void;
  inventorySummary?: {
    totalQuantity: number;
    availableTies: number;
    paidUsers: number;
  };
}

// ── Models for Hero Inspo Card Fan (Reference Image 2) ──
const HERO_MODELS = [
  { id: 1, src: '/models/model1.jpg', label: 'Classic Executive', hall: 'Peter Hall' },
  { id: 2, src: '/models/model2.jpg', label: 'Regal Stripe', hall: 'Daniel Hall' },
  { id: 3, src: '/models/model3.jpg', label: 'The Resumption Fit', hall: 'Paul Hall' },
  { id: 4, src: '/models/model4.jpg', label: 'Dapper Senior', hall: 'PG Hall' },
  { id: 5, src: '/models/model6.jpg', label: 'Chapel Standard', hall: 'Esther Hall' },
];

// ── Showcase Ties for CTA Gallery Carousel (Reference Image 1) ──
const CTA_GALLERY_TIES = [
  { id: 'cta-1', name: 'Plain Black Tie', price: '₦2,100', image: '/ties/new ties/Plain Black Tie.png' },
  { id: 'cta-2', name: 'Plain Wine Tie', price: '₦2,200', image: '/ties/new ties/Plain Wine Tie.png' },
  { id: 'cta-3', name: 'Blue Regimental White Striped', price: '₦3,500', image: '/ties/new ties/Blue Regimental White Striped Tie.png' },
  { id: 'cta-4', name: 'Navy & Wine Striped Tie', price: '₦4,000', image: '/ties/new ties/Nave and WIne Striped Tie.png' },
  { id: 'cta-5', name: 'Wine Striped Tie', price: '₦3,500', image: '/ties/new ties/Wine Striped Tie.png' },
  { id: 'cta-6', name: 'Blue Floral Corporate', price: '₦4,000', image: '/ties/Corporate Ties/Blue Floral Corporate Tie.jpg' },
  { id: 'cta-7', name: 'Floral Vintage Tie', price: '₦4,200', image: '/ties/Vintage Ties/Floral Vintage Tie.jpg' },
  { id: 'cta-8', name: 'Green Diamond Vintage Tie', price: '₦3,800', image: '/ties/Vintage Ties/Green Diamond Vintage Tie.jpg' },
];

// Fallback in case products list is short, ensuring 2 full rows (6 ties)
const FALLBACK_TIES = [
  { id: 'new-plain-black', name: 'Plain Black Tie', price: 2100, originalPrice: 2500, image: '/ties/new ties/Plain Black Tie.png', stock: 35 },
  { id: 'new-plain-wine', name: 'Plain Wine Tie', price: 2200, originalPrice: 2800, image: '/ties/new ties/Plain Wine Tie.png', stock: 22 },
  { id: 'new-blue-regimental', name: 'Blue Regimental White Striped', price: 3500, originalPrice: 4000, image: '/ties/new ties/Blue Regimental White Striped Tie.png', stock: 15 },
  { id: 'new-navy-wine-striped', name: 'Navy & Wine Striped Tie', price: 4000, originalPrice: 4500, image: '/ties/new ties/Nave and WIne Striped Tie.png', stock: 18 },
  { id: 'new-wine-striped', name: 'Wine Striped Tie', price: 3500, originalPrice: 4000, image: '/ties/new ties/Wine Striped Tie.png', stock: 12 },
  { id: 'corp-blue-floral', name: 'Blue Floral Corporate Tie', price: 4000, originalPrice: 4500, image: '/ties/Corporate Ties/Blue Floral Corporate Tie.jpg', stock: 30 },
];

export default function LandingPage({
  onBrowseMarketplace,
  featuredProducts,
  products,
  onOpenProductDetail,
  onNavigateAbout,
  inventorySummary,
}: LandingPageProps) {
  const [activeModelIndex, setActiveModelIndex] = useState(2); // Center model default
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // 4-Second Automatic Carousel Interval
  useEffect(() => {
    if (isCarouselPaused) return;
    const interval = setInterval(() => {
      setActiveModelIndex((prev) => (prev + 1) % HERO_MODELS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isCarouselPaused]);

  // ── Preload hero + catalog imagery on idle so taps feel instant even
  // on slow campus Wi-Fi (also covers the meme asset preloaded in App).
  useEffect(() => {
    const preload = () => {
      const sources = [
        ...HERO_MODELS.map((model) => model.src),
        ...CTA_GALLERY_TIES.map((tie) => tie.image),
        ...FALLBACK_TIES.map((tie) => tie.image),
        ...INITIAL_PRODUCTS.slice(0, 12).map((product) => product.image).filter(Boolean),
      ];
      sources.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    };

    const timer = window.setTimeout(preload, 600);
    return () => window.clearTimeout(timer);
  }, []);
  // GSAP Entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.hero-anim-item',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.1,
          ease: 'power3.out',
        }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const handlePrevModel = () => {
    setActiveModelIndex((prev) => (prev === 0 ? HERO_MODELS.length - 1 : prev - 1));
  };

  const handleNextModel = () => {
    setActiveModelIndex((prev) => (prev + 1) % HERO_MODELS.length);
  };

  // ── Home showcase uses the STATIC catalog (INITIAL_PRODUCTS), never the
  // Supabase-synced `products` state. Prices here are display-only and are
  // intentionally NOT live-synced; real stock/price live on the collection page.
  const baseTiesList = INITIAL_PRODUCTS;
  const sortedProducts = [...baseTiesList].sort((a, b) => {
    const aInStock = Number(a.stock) > 0;
    const bInStock = Number(b.stock) > 0;
    if (aInStock && !bInStock) return -1;
    if (!aInStock && bInStock) return 1;
    return (b.price ?? b.originalPrice ?? 0) - (a.price ?? a.originalPrice ?? 0);
  });

  // 2 rows of 3 ties = 6 ties
  const displayTies = sortedProducts.slice(0, 6);

  return (
    <div className="w-full bg-[#FFFEF2] text-brand-primary overflow-x-hidden font-sans pb-16 sm:pb-0" id="landing-page-root">
      
      {/* ── 1. HERO SECTION (High readability font, covenant tag removed, 4s auto carousel + manual controls) ── */}
      <section
        ref={heroRef}
        className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-3 sm:px-6 max-w-7xl mx-auto flex flex-col items-center justify-center text-center overflow-hidden"
        id="hero-section"
      >
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(31,62,43,0.04)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Main Headline — High Readability Sans/Bold hierarchy (Covenant tag removed) */}
        <h1 className="hero-anim-item font-sans font-black text-3xl sm:text-5xl md:text-6xl lg:text-[62px] text-brand-primary tracking-tight leading-[1.12] max-w-3xl mx-auto">
          No need to borrow ties <br className="hidden sm:inline" />
          in school anymore
          <span className="block font-sans font-extrabold text-brand-secondary mt-1.5 sm:mt-2">
            We gat you.
          </span>
        </h1>

        {/* Crisp Subtitle with tie humor */}
        <p className="hero-anim-item text-xs sm:text-sm md:text-base font-sans text-brand-primary/80 max-w-lg mx-auto mt-3.5 sm:mt-4 leading-relaxed px-2 font-medium">
          Hand-inspected, chapel-approved
          <strong id='tie-bold'>
          ties
          </strong>
          delivered right to your hall lobby or room before resumption <br></br> & <br></br> <strong>
          during school.
          </strong>
          <span className="block mt-1 font-serif italic text-brand-secondary font-semibold">
            "Knots happen. Being untidy is a choice."
          </span>
        </p>

        {/* Action Buttons */}
        <div className="hero-anim-item flex flex-wrap items-center justify-center gap-3 mt-6 sm:mt-7 z-10 w-full max-w-xs sm:max-w-none">
          <button
            onClick={onBrowseMarketplace}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] text-xs sm:text-sm font-sans font-semibold px-7 sm:px-8 py-3.5 rounded-full transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 cursor-pointer min-h-[44px]"
            id="hero-cta-shop"
          >
            <span>Shop Collection</span>
            <ArrowRight size={14} />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('bestsellers');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-[#F4F2E6] hover:bg-brand-secondary/10 text-brand-primary text-xs sm:text-sm font-sans font-medium px-6 sm:px-7 py-3.5 rounded-full border border-brand-secondary/20 transition-all duration-200 cursor-pointer min-h-[44px]"
          >
            View Top Ties
          </button>
        </div>

        {/* ── ASCENDING MODEL CARD FAN WITH MANUAL CONTROLLERS & 4s ROTATION (Reference Image 2) ── */}
        <div 
          className="hero-anim-item w-full max-w-4xl mx-auto mt-12 sm:mt-16 pt-2 relative select-none"
          onMouseEnter={() => setIsCarouselPaused(true)}
          onMouseLeave={() => setIsCarouselPaused(false)}
        >
          {/* Card Fan Display */}
          <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-5 px-1 sm:px-4">
            {HERO_MODELS.map((model, index) => {
              const isActive = index === activeModelIndex;
              const distFromCenter = Math.abs(index - activeModelIndex);
              
              let heightClass = 'h-48 sm:h-64 md:h-76';
              let widthClass = 'w-20 sm:w-36 md:w-44';
              let translateClass = 'translate-y-6 sm:translate-y-8';
              let opacityClass = 'opacity-85 hover:opacity-100';

              if (distFromCenter === 0) {
                heightClass = 'h-64 sm:h-80 md:h-96';
                widthClass = 'w-28 sm:w-48 md:w-60';
                translateClass = 'translate-y-0';
                opacityClass = 'opacity-100 ring-2 ring-brand-secondary/35 shadow-2xl';
              } else if (distFromCenter === 1) {
                heightClass = 'h-56 sm:h-72 md:h-84';
                widthClass = 'w-24 sm:w-40 md:w-48';
                translateClass = 'translate-y-3 sm:translate-y-4';
                opacityClass = 'opacity-90 hover:opacity-100';
              }

              return (
                <motion.div
                  key={model.id}
                  onClick={() => setActiveModelIndex(index)}
                  layout
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className={`shrink-0 cursor-pointer rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-lg border border-black/8 relative transition-all duration-300 ${heightClass} ${widthClass} ${translateClass} ${opacityClass}`}
                >
                  <img
                    src={model.src}
                    alt={model.label}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                  
                  {isActive && (
                    <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent text-[#FFFEF2] text-left">
                      <p className="font-serif font-bold text-[10px] sm:text-xs truncate">
                        {model.label}
                      </p>
                      <p className="font-sans text-[8px] sm:text-[9px] text-[#FFFEF2]/75">
                        {model.hall}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Manual Controller Controls Bar (Previous, Next, Timer indicator) */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6">
            <button
              onClick={handlePrevModel}
              className="w-9 h-9 rounded-full bg-[#F4F2E6] hover:bg-white border border-brand-secondary/20 flex items-center justify-center text-brand-primary transition-all hover:scale-105 cursor-pointer shadow-xs active:scale-95"
              aria-label="Previous style"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F2E6] border border-brand-secondary/15">
              {HERO_MODELS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveModelIndex(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === activeModelIndex ? 'w-5 bg-brand-secondary' : 'w-1.5 bg-brand-secondary/20 hover:bg-brand-secondary/40'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
              <span className="text-[10px] font-mono text-brand-secondary/60 ml-1.5 pl-1.5 border-l border-brand-secondary/20">
                4s
              </span>
            </div>

            <button
              onClick={handleNextModel}
              className="w-9 h-9 rounded-full bg-[#F4F2E6] hover:bg-white border border-brand-secondary/20 flex items-center justify-center text-brand-primary transition-all hover:scale-105 cursor-pointer shadow-xs active:scale-95"
              aria-label="Next style"
            >
              <ChevronRight size={16} />
            </button>
          </div>

        </div>
      </section>

      {/* ── 2. SHORT ABOUT SECTION (Summarized, clear & simple English) ── */}
      <section
        id="about-section"
        className="bg-brand-secondary text-[#FFFEF2] py-14 sm:py-18 px-3 sm:px-6 relative overflow-hidden"
      >
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-[#FFFEF2]/70 block mb-2">
              Why Knotify
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-[#FFFEF2] tracking-tight leading-snug">
              Getting your ties should
              <br/>
              Knot
              <br/>
              
              be stressful.
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#FFFEF2]/80 mt-2.5 leading-relaxed">
              We make it quick and easy to get dress-code approved ties delivered straight to your hostel lobby before you resume.
            </p>
          </div>

          {/* 3 Quick Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6">
            <div className="bg-[#FFFEF2]/10 border border-[#FFFEF2]/15 rounded-2xl p-5 text-left hover:bg-[#FFFEF2]/15 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#FFFEF2]/15 flex items-center justify-center mb-3.5">
                <ShieldCheck size={20} className="text-emerald-300" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#FFFEF2] mb-1">
                100% Chapel Approved
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#FFFEF2]/75 leading-relaxed">
                Every tie matches Covenant dress guidelines. No dress-code worries on Sunday mornings.
              </p>
            </div>

            <div className="bg-[#FFFEF2]/10 border border-[#FFFEF2]/15 rounded-2xl p-5 text-left hover:bg-[#FFFEF2]/15 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#FFFEF2]/15 flex items-center justify-center mb-3.5">
                <MapPin size={20} className="text-emerald-300" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#FFFEF2] mb-1">
                Hostel Lobby Pickup
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#FFFEF2]/75 leading-relaxed">
                Pick up your packaged tie right in your hall lobby (Peter, Paul, Daniel, PG, Esther, or Lydia).
              </p>
            </div>

            <div className="bg-[#FFFEF2]/10 border border-[#FFFEF2]/15 rounded-xl p-5 text-left hover:bg-[#FFFEF2]/15 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#FFFEF2]/15 flex items-center justify-center mb-3.5">
                <Sparkles size={20} className="text-emerald-300" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#FFFEF2] mb-1">
                Order in 60 Seconds
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#FFFEF2]/75 leading-relaxed">
                Choose your tie, pay securely online, and have it ready waiting for you when you arrive.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-[#FFFEF2]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-xs font-sans text-[#FFFEF2]/80">
              Simple, affordable, and built specifically for Covenant University students.
            </p>
            {onNavigateAbout && (
              <button
                onClick={onNavigateAbout}
                className="inline-flex items-center gap-2 text-xs font-sans font-bold text-[#FFFEF2] hover:text-[#FFFEF2]/80 border border-[#FFFEF2]/30 hover:border-[#FFFEF2]/70 px-5 py-2.5 rounded-full transition-colors cursor-pointer shrink-0"
                id="btn-about-us"
              >
                <span>Our Mission &amp; About Us</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>

        </div>
      </section>

      {/* ── 3. TIE SHOWCASE / BEST SELLERS SECTION (WHITE BACKGROUND, 2 ROWS = 6 TIES, IN-STOCK FIRST) ── */}
      <section
        id="bestsellers"
        className="bg-white text-brand-primary py-16 sm:py-24 px-3 sm:px-6 border-y border-black/8"
      >
        <div className="max-w-6xl mx-auto">
          
          {/* Centralized Heading */}
          <div className="text-center max-w-xl mx-auto mb-10 sm:mb-14">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-brand-secondary font-semibold block mb-2">
              Hall Favorites
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-brand-primary tracking-tight">
              Best Sellers
            </h2>
            <p className="font-sans text-xs sm:text-sm text-brand-primary/65 mt-2">
              Curated university-approved neckwear in stock for resumption week.
            </p>
          </div>

          {/* Live counter strip — "Be the No. {n} student" */}
          <div className="text-center mb-10 sm:mb-12 space-y-2" id="live-student-counter">
            <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.35em] text-brand-secondary">
              Live stock synced from Knotify API
            </div>
            <div className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-brand-primary tracking-tight leading-none">
              Be the{' '}
              <span className="font-serif italic font-light text-brand-secondary">
                No. {(inventorySummary?.paidUsers ?? 0) + 1}
              </span>{' '}
              student
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[10px] font-mono uppercase tracking-[0.22em] text-brand-secondary/90">
              <span>{inventorySummary?.totalQuantity ?? 0}+ ties in stock</span>
              <span>{inventorySummary?.paidUsers ?? 0}+ paid students</span>
            </div>
          </div>

          {/* 2 Full Rows of Ties (3 columns × 2 rows = 6 Ties) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {displayTies.map((tie) => {
              const currentPrice = tie.price ?? tie.originalPrice ?? 2000;
              const isAvailable = Number(tie.stock) > 0;

              return (
                <div
                  key={tie.id}
                  onClick={() => onBrowseMarketplace()}
                  className="bg-[#FBF9F3]/40 border border-black/8 hover:border-brand-secondary/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-300 group cursor-pointer"
                >
                  <div>
                    {/* Tie Image Canvas */}
                    <div className="aspect-[4/5] rounded-xl overflow-hidden bg-white border border-black/5 mb-4 relative flex items-center justify-center p-3 shadow-xs">
                      <img
                        src={tie.image}
                        alt={tie.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    {/* Tie Details */}
                    <h3 className="font-serif font-bold text-sm sm:text-base text-brand-primary mb-1 line-clamp-1 group-hover:text-brand-secondary transition-colors">
                      {tie.name}
                    </h3>
                  </div>

                  {/* 1-Click Add to Bag */}
                  <span
                    className={`w-full inline-flex items-center justify-center gap-2 font-sans font-semibold text-xs sm:text-sm py-2.5 sm:py-3 rounded-xl min-h-[42px] border transition-colors ${
                      isAvailable
                        ? 'border-brand-secondary/30 text-brand-secondary group-hover:border-brand-secondary'
                        : 'border-black/8 text-neutral-400'
                    }`}
                  >
                    <span>{isAvailable ? 'View in catalog' : 'Out of Stock'}</span>
                    {isAvailable && <ArrowRight size={14} />}
                  </span>
                </div>
              );
            })}
          </div>

          {/* View Full Catalog Button */}
          <div className="text-center mt-12">
            <button
              onClick={onBrowseMarketplace}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-sans font-medium text-brand-secondary hover:text-brand-accent border border-brand-secondary/30 hover:border-brand-secondary px-7 py-3 rounded-full transition-colors cursor-pointer"
            >
              <span>Explore full catalog</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>
      </section>

      {/* ── 4. CTA SECTION (Inspired by Image 0: CTA text + Gallery Carousel of ties + CTA button) ── */}
      <section
        id="cta-section"
        className="bg-[#FFFEF2] py-20 sm:py-28 px-3 sm:px-6 text-center relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto">
          
          {/* Eyebrow & Headline from Image 0 */}
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.35em] text-brand-secondary/70 block mb-2 font-semibold">
            JOIN THE SARTORIAL COMMUNITY
          </span>

          <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-brand-primary tracking-tight leading-tight mb-3">
            Walk into chapel with confidence.
          </h2>

          <p className="font-sans text-xs sm:text-sm md:text-base text-brand-primary/65 max-w-lg mx-auto mb-10 leading-relaxed">
            Every tie is inspected, ironed, and ready for your first Sunday service and Monday 8:00 AM presentation.
          </p>

          {/* ── TIE GALLERY CAROUSEL (Sweeping Panoramic Format from Reference Image 0) ── */}
          <div className="relative w-full overflow-hidden py-4 my-6">
            <div 
              ref={galleryRef}
              className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-4 px-4 snap-x snap-mandatory"
            >
              {CTA_GALLERY_TIES.map((tie) => (
                <div
                  key={tie.id}
                  onClick={onBrowseMarketplace}
                  className="snap-center shrink-0 w-44 sm:w-56 md:w-64 rounded-2xl sm:rounded-3xl p-3 sm:p-4 bg-white border border-black/8 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group text-left"
                >
                  <div className="aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-[#F8F6F0] p-4 flex items-center justify-center mb-3">
                    <img
                      src={tie.image}
                      alt={tie.name}
                      className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-brand-primary group-hover:text-brand-secondary transition-colors truncate">
                    {tie.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-brand-primary/45 group-hover:text-brand-secondary transition-colors">
                      View tie →
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Edge fades */}
            <div className="hidden sm:block absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#FFFEF2] to-transparent pointer-events-none" />
            <div className="hidden sm:block absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#FFFEF2] to-transparent pointer-events-none" />
          </div>

          {/* CTA Button Below Gallery Carousel leading to Store */}
          <div className="mt-8">
            <button
              onClick={onBrowseMarketplace}
              className="inline-flex items-center gap-3 bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] font-sans font-medium text-xs sm:text-sm px-9 py-4 rounded-full transition-all duration-300 shadow-md hover:shadow-2xl hover:scale-105 cursor-pointer min-h-[48px]"
              id="cta-shop-btn"
            >
              <span>Explore the Entire Store</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </section>

      {/* ── 5. REVAMPED CONTACT HUB (Rich Cards & Icons instead of plain link) ── */}
      <section
        id="contact-section"
        className="bg-[#F8F6EC] py-16 sm:py-24 px-3 sm:px-6 border-t border-brand-border/20 text-center"
      >
        <div className="max-w-4xl mx-auto">
          
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-brand-secondary font-semibold block mb-2">
            Get in Touch
          </span>

          <h2 className="font-display font-bold text-2xl sm:text-4xl text-brand-primary tracking-tight mb-3">
            Need Help or Custom Inquiries?
          </h2>

          <p className="font-sans text-xs sm:text-sm text-brand-primary/65 max-w-md mx-auto mb-8">
            Connect directly with student coordinators across all Covenant residence halls.
          </p>

          {/* Tie Quote Banner Card with Icon */}
          <div className="bg-[#FFFEF2] border border-brand-secondary/20 rounded-2xl p-4 sm:p-5 mb-8 shadow-xs max-w-xl mx-auto flex items-center gap-3.5 text-left">
            <div className="w-10 h-10 rounded-full bg-brand-secondary/10 flex items-center justify-center shrink-0 text-brand-secondary">
              <MessageSquareQuote size={20} />
            </div>
            <div>
              <p className="font-serif italic text-xs sm:text-sm text-brand-secondary font-semibold leading-relaxed">
                "If you want to Contact Knotify, please notify our Telegram channel!"
              </p>
              <p className="text-[10px] font-sans text-brand-primary/55 mt-0.5">
                Response time is typically faster than tying a Full Windsor knot.
              </p>
            </div>
          </div>

          {/* Interactive Icon Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            
            {/* Telegram Card */}
            <a
              href="https://t.me/+go-lAiSrbJ5hNGVk"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-[#FFFEF2] border border-black/8 hover:border-brand-secondary/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Send size={20} />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                    Instant Channel
                  </span>
                </div>
                <h4 className="font-serif font-bold text-base text-brand-primary group-hover:text-brand-secondary transition-colors">
                  Telegram Channel
                </h4>
                <p className="font-sans text-xs text-brand-primary/65 mt-1 leading-relaxed">
                  Real-time tie drop alerts, hall inventory updates, and live queries.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-sans font-semibold text-brand-secondary mt-4 group-hover:translate-x-0.5 transition-transform">
                <span>Join Channel</span>
                <ExternalLink size={13} />
              </div>
            </a>

            {/* WhatsApp Community Card */}
            <a
              href="https://chat.whatsapp.com/Kiwu2BWP1NuE0z0wC61to0"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-[#FFFEF2] border border-black/8 hover:border-brand-secondary/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <MessageCircle size={20} />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Active Chat
                  </span>
                </div>
                <h4 className="font-serif font-bold text-base text-brand-primary group-hover:text-brand-secondary transition-colors">
                  WhatsApp Community
                </h4>
                <p className="font-sans text-xs text-brand-primary/65 mt-1 leading-relaxed">
                  Direct hostel coordinators & fellow scholar tie coordination.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-sans font-semibold text-brand-secondary mt-4 group-hover:translate-x-0.5 transition-transform">
                <span>Open Community</span>
                <ExternalLink size={13} />
              </div>
            </a>

          </div>

        </div>
      </section>

      {/* ── 6. MINIMAL FOOTER ── */}
      <footer id="site-footer" className="bg-[#FFFEF2] border-t border-black/8 py-8 sm:py-10 px-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-k.svg"
              alt="Knotify"
              className="h-6 sm:h-7 w-auto object-contain"
            />
            <span className="font-serif font-bold text-sm sm:text-base text-brand-secondary">
              Knotify Ties
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs font-sans text-brand-primary/60">
            <a
              href="https://chat.whatsapp.com/Kiwu2BWP1NuE0z0wC61to0"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-secondary transition-colors"
            >
              WhatsApp
            </a>
            <a
              href="https://t.me/+go-lAiSrbJ5hNGVk"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-secondary transition-colors"
            >
              Telegram
            </a>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-brand-secondary transition-colors cursor-pointer"
            >
              Back to Top ↑
            </button>
          </div>

          <p className="text-[11px] font-sans text-brand-primary/40">
            © 2026 Knotify • Covenant University
          </p>

        </div>
      </footer>

    </div>
  );
}
