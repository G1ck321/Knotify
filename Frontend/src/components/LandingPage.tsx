import React, { useState } from 'react';
import { 
  Heart, 
  ArrowRight,
  Shield,
  Sparkles,
  Users,
  Award,
  ChevronRight,
  Bookmark,
  MessageCircle,
  Send,
  Check,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Search,
  MapPin,
  FileCheck,
  CheckCircle,
  Loader
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Product, Reservation } from './Frontend/src/types';
import TiePlaceholder from './TiePlaceholder';
import FAQSection from './FAQSection';
import AboutSection from './AboutSection';

interface LandingPageProps {
  onBrowseMarketplace: () => void;
  onBrowseWithFilter: (category: string, search: string) => void;
  products: Product[];
  featuredProducts: Product[];
  onOpenProductDetail: (product: Product) => void;
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  isInWishlist: (productId: string) => boolean;
}

export default function LandingPage({
  onBrowseMarketplace,
  onBrowseWithFilter,
  products,
  featuredProducts,
  onOpenProductDetail,
  onToggleWishlist,
  onAddToCart,
  isInWishlist,
}: LandingPageProps) {

  // Custom container transition variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 80 }
    }
  };

  const heroLeftContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const heroLeftItem = {
    hidden: { opacity: 0, x: -25 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 70, damping: 14 }
    }
  };

  const bentoContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15
      }
    }
  };

  const bentoItem = {
    hidden: { opacity: 0, scale: 0.94, y: 25 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 65, damping: 14 }
    }
  };

  // Parallax scroll effects
  const { scrollY } = useScroll();
  
  // Elements move at different rates to create high-end modern depth
  const yKnotifyBg = useTransform(scrollY, [0, 800], [0, 100]);
  const yHeroLeft = useTransform(scrollY, [0, 800], [0, -40]);
  const yHeroRightMain = useTransform(scrollY, [0, 800], [0, -20]);
  const yHeroRightSub = useTransform(scrollY, [0, 800], [0, 30]);
  const yHeroPattern = useTransform(scrollY, [0, 800], [0, 60]);
  
  // Floating parallax ambient backgrounds
  const yGlow1 = useTransform(scrollY, [0, 1200], [0, 120]);
  const yGlow2 = useTransform(scrollY, [0, 1800], [0, -150]);



  return (
    <div className="w-full pb-16 bg-brand-bg font-sans" id="landing-page-root">
      
      {/* 1. HERO SECTION (Redesigned to replicate Image One's clean, classical serif and polaroid collage aesthetic) */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-24 md:pb-36 bg-brand-secondary border-b border-brand-border/20" id="hero-section">
        {/* Ivory dot overlays on the gorgeous green background */}
        <motion.div 
          style={{ y: yHeroPattern }}
          className="absolute inset-0 bg-[radial-gradient(rgba(255,254,242,0.06)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none" 
        />

        {/* Ambient glows on green background for subtle texture */}
        <motion.div style={{ y: yGlow1 }} className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-brand-accent/20 rounded-full filter blur-[120px] pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Scroll Down & Establish Indicators (Desktop Only) */}
          <div className="hidden lg:flex absolute left-4 top-1/3 flex-col items-center gap-10 text-brand-bg/50 select-none pointer-events-none">
            <span className="text-[9px] font-mono tracking-[0.25em] uppercase rotate-270 origin-left inline-block -translate-y-6">
              SCROLL DOWN
            </span>
            <div className="h-10 w-[1px] bg-brand-bg/30"></div>
          </div>

          <div className="hidden lg:flex absolute right-4 top-1/3 flex-col items-center gap-2 text-right text-brand-bg/50 select-none pointer-events-none">
            <span className="text-[14px] font-display font-bold tracking-wider">MCMXXVI</span>
            <span className="text-[8px] font-mono tracking-widest uppercase opacity-75">ESTABLISHED 2026</span>
          </div>

          {/* Centered Minimalist Hero Typography */}
          <div className="max-w-5xl mx-auto text-center space-y-12 relative z-10 animate-fade-in" id="hero-minimalist-container">
            
            <div className="space-y-6">
              {/* Vintage Double-Rectangular Badge Accent (Touches of Old Money) */}
              <div className="inline-flex items-center justify-center px-6 py-2 border-2 border-brand-bg/30 relative before:absolute before:inset-0.5 before:border before:border-brand-bg/15 before:pointer-events-none mx-auto mb-3 bg-brand-primary/20 rounded-sm shadow-md" id="knotify-hero-badge">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-[0.45em] text-[#FFFEF2] font-black">
                  KNOTIFY • EST. 2026
                </span>
              </div>

              <h1 className="font-display font-extrabold text-6xl sm:text-8xl md:text-[98px] lg:text-[116px] text-[#FFFEF2] tracking-tight leading-[0.85] uppercase max-w-5xl mx-auto">
                GET YOUR TIE, <br />
                <span className="font-serif italic font-light text-brand-bg relative inline-block">
                  INSTANTLY
                  <span className="absolute -bottom-2 left-0 right-0 h-[1.5px] bg-brand-bg/40"></span>
                  <span className="absolute -bottom-3 left-1/4 right-1/4 h-[0.5px] bg-brand-bg/25"></span>
                </span>
              </h1>

              <div className="h-[1px] w-20 bg-[#FFFEF2]/25 mx-auto my-6"></div>
              
              <p className="text-base sm:text-xl font-display italic text-[#FFFEF2]/95 max-w-xl mx-auto leading-relaxed">
                Skip the morning panic. Secure certified, chapel-compliant ties listed by fellow scholars within your own residential hall.
              </p>

              {/* Number of users active — prominent stat block */}
              <div className="flex flex-col items-center gap-5 pt-6">
                {/* Avatar stack */}
                <div className="flex -space-x-3">
                  <img className="inline-block h-11 w-11 rounded-full ring-[2.5px] ring-brand-secondary object-cover shadow-md" src="/models/model1.jpg" alt="Scholar 1" />
                  <img className="inline-block h-11 w-11 rounded-full ring-[2.5px] ring-brand-secondary object-cover shadow-md" src="/models/model2.jpg" alt="Scholar 2" />
                  <img className="inline-block h-11 w-11 rounded-full ring-[2.5px] ring-brand-secondary object-cover shadow-md" src="/models/model3.jpg" alt="Scholar 3" />
                  <img className="inline-block h-11 w-11 rounded-full ring-[2.5px] ring-brand-secondary object-cover shadow-md" src="/models/model4.jpg" alt="Scholar 4" />
                  <div className="inline-flex h-11 w-11 rounded-full ring-[2.5px] ring-brand-secondary bg-brand-primary/60 items-center justify-center shadow-md">
                    <span className="text-[9px] font-mono font-bold text-[#FFFEF2]/80">+1K</span>
                  </div>
                </div>

                {/* Large user count */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block mb-0.5" />
                    <span id="active-user-count" className="font-display font-black text-5xl sm:text-6xl md:text-7xl text-[#FFFEF2] tracking-tight leading-none">
                      1,850+
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-mono tracking-[0.3em] uppercase text-[#FFFEF2]/60 mt-1">
                    Scholars active this semester
                  </span>
                </div>
              </div>
            </div>

            {/* SEVEN POLAROID CAROUSEL/COLLAGE (Asymmetric overlapping premium layout - Augmented Bigger Sizes) */}
            <div className="flex overflow-x-auto md:overflow-x-visible md:flex-nowrap items-center justify-start md:justify-center gap-6 md:gap-0 max-w-full md:max-w-7xl mx-auto pt-10 pb-16 relative scrollbar-none snap-x snap-mandatory px-6 md:px-0" id="hero-polaroid-collage">
              
              {/* Polaroid 1 (Extreme Left - Tilted Left) */}
              <motion.div 
                initial={{ opacity: 0, rotate: -20 }}
                animate={{ opacity: 1, rotate: -14 }}
                style={{ y: yHeroRightSub }}
                transition={{ duration: 0.8, delay: 0.05 }}
                whileHover={{ rotate: -5, scale: 1.05, zIndex: 30 }}
                className="bg-white p-3 pb-6 shadow-[0_12px_28px_rgba(0,0,0,0.22)] rounded-sm border border-black/5 w-[165px] sm:w-[195px] shrink-0 md:-mr-8 relative group transition-all duration-300 z-5 cursor-pointer snap-center"
              >
                <div className="aspect-[4/5] bg-neutral-100 overflow-hidden rounded-xs border border-black/5 relative">
                  <img 
                    src="/models/model1.jpg" 
                    alt="Premium Wear"
                    className="w-full h-full object-cover grayscale-[18%] group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </motion.div>

              {/* Polaroid 2 (Far Left - Tilted Left) */}
              <motion.div 
                initial={{ opacity: 0, rotate: -14 }}
                animate={{ opacity: 1, rotate: -8 }}
                style={{ y: yHeroRightMain }}
                transition={{ duration: 0.8, delay: 0.1 }}
                whileHover={{ rotate: -2, scale: 1.05, zIndex: 30 }}
                className="bg-white p-3.5 pb-7 shadow-[0_15px_35px_rgba(0,0,0,0.25)] rounded-sm border border-black/5 w-[185px] sm:w-[220px] shrink-0 md:-mr-6 relative group transition-all duration-300 z-10 cursor-pointer snap-center"
              >
                <div className="aspect-[4/5] bg-neutral-100 overflow-hidden rounded-xs border border-black/5 relative">
                  <img 
                    src="/models/model2.jpg" 
                    alt="Striped necktie"
                    className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </motion.div>

              {/* Polaroid 3 (Mid Left - Tilted slightly Left) */}
              <motion.div 
                initial={{ opacity: 0, rotate: -8 }}
                animate={{ opacity: 1, rotate: -3 }}
                style={{ y: yHeroLeft }}
                transition={{ duration: 0.8, delay: 0.15 }}
                whileHover={{ rotate: 0, scale: 1.05, zIndex: 30 }}
                className="bg-white p-3.5 pb-7 shadow-[0_15px_35px_rgba(0,0,0,0.25)] rounded-sm border border-black/5 w-[190px] sm:w-[230px] shrink-0 md:-mr-6 relative group transition-all duration-300 z-15 cursor-pointer snap-center"
              >
                <div className="aspect-[4/5] bg-neutral-100 overflow-hidden rounded-xs border border-black/5 relative">
                  <img 
                    src="/models/model3.jpg" 
                    alt="Oxford Stripe"
                    className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </motion.div>

              {/* Polaroid 4 (Center - Upright, Tall, Majestic, Elevated) - Knotify Logo middle spot */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ y: yHeroRightMain }}
                transition={{ duration: 0.8, delay: 0.2 }}
                whileHover={{ scale: 1.08, zIndex: 30 }}
                className="bg-white p-4 pb-9 shadow-[0_25px_50px_rgba(0,0,0,0.35)] rounded-sm border border-black/5 w-[215px] sm:w-[265px] shrink-0 z-20 relative group transition-all duration-300 transform md:scale-105 cursor-pointer snap-center"
              >
                <div className="aspect-[4/5] bg-neutral-100 overflow-hidden rounded-xs border border-black/5">
                  <img 
                    src="/logo.png" 
                    alt="Knotify Logo"
                    className="w-full h-full object-cover group-hover:scale-102 transition-all duration-500"
                  />
                </div>
              </motion.div>

              {/* Polaroid 5 (Mid Right - Tilted slightly Right) */}
              <motion.div 
                initial={{ opacity: 0, rotate: 8 }}
                animate={{ opacity: 1, rotate: 3 }}
                style={{ y: yHeroLeft }}
                transition={{ duration: 0.8, delay: 0.25 }}
                whileHover={{ rotate: 0, scale: 1.05, zIndex: 30 }}
                className="bg-white p-3.5 pb-7 shadow-[0_15px_35px_rgba(0,0,0,0.25)] rounded-sm border border-black/5 w-[190px] sm:w-[230px] shrink-0 md:-mr-6 relative group transition-all duration-300 z-15 cursor-pointer snap-center"
              >
                <div className="aspect-[4/5] bg-neutral-100 overflow-hidden rounded-xs border border-black/5 relative">
                  <img 
                    src="/models/model4.jpg" 
                    alt="Tweed Signatures"
                    className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </motion.div>

              {/* Polaroid 6 (Far Right - Tilted Right with Tape Effect) - Incorporating model6.jpg */}
              <motion.div 
                initial={{ opacity: 0, rotate: 14 }}
                animate={{ opacity: 1, rotate: 8 }}
                style={{ y: yHeroRightMain }}
                transition={{ duration: 0.8, delay: 0.3 }}
                whileHover={{ rotate: 2, scale: 1.05, zIndex: 30 }}
                className="bg-white p-3.5 pb-7 shadow-[0_15px_35px_rgba(0,0,0,0.25)] rounded-sm border border-black/5 w-[185px] sm:w-[220px] shrink-0 md:-mr-8 relative group transition-all duration-300 z-10 cursor-pointer snap-center"
              >
                {/* CSS Scotch Tape Representation */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-12 h-5 bg-neutral-200/45 backdrop-blur-[1.5px] border border-white/20 rotate-[-12deg] shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-20" />

                <div className="aspect-[4/5] bg-neutral-100 overflow-hidden rounded-xs border border-black/5">
                  <img 
                    src="/models/model6.jpg" 
                    alt="Regal Traditional"
                    className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </motion.div>

              {/* Polaroid 7 (Extreme Right - Tilted Right) */}
              <motion.div 
                initial={{ opacity: 0, rotate: 20 }}
                animate={{ opacity: 1, rotate: 14 }}
                style={{ y: yHeroRightSub }}
                transition={{ duration: 0.8, delay: 0.35 }}
                whileHover={{ rotate: 5, scale: 1.05, zIndex: 30 }}
                className="bg-white p-3 pb-6 shadow-[0_12px_28px_rgba(0,0,0,0.22)] rounded-sm border border-black/5 w-[165px] sm:w-[195px] shrink-0 relative group transition-all duration-300 z-5 cursor-pointer snap-center"
              >
                <div className="aspect-[4/5] bg-neutral-100 overflow-hidden rounded-xs border border-black/5">
                  <img 
                    src="/models/model3.jpg" 
                    alt="Signature Style"
                    className="w-full h-full object-cover grayscale-[18%] group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </motion.div>

            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button
                onClick={onBrowseMarketplace}
                className="inline-flex items-center gap-2.5 bg-[#FFFEF2] hover:bg-brand-primary text-brand-secondary hover:text-brand-bg rounded px-8 py-4 transition-all duration-300 cursor-pointer text-[10px] font-mono font-bold tracking-widest uppercase group border border-[#FFFEF2]/10 shadow-lg hover:scale-105"
              >
                explore collection
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 2. CONTINUOUS SCROLLING MARQUEE (Classical Professional Burgundy Bar Stripe) */}
      <section className="bg-brand-secondary text-brand-bg py-3 overflow-hidden border-y border-brand-border select-none animate-fade-in" id="marquee-banner">
        <div className="relative w-full overflow-hidden">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-16 text-[10px] font-mono tracking-[0.25em] uppercase font-semibold">
            <span>SARTORIAL ACCENT</span>
            <span>✦</span>
            <span>DAPPER SENIORS STYLE</span>
            <span>✦</span>
            <span>INCOMING FRESHERS SPECIAL</span>
            <span>✦</span>
            <span>BLEND IN INSTANTLY</span>
            <span>✦</span>
            <span>ANTI-NEWBIE AESTHETIC</span>
            <span>✦</span>
            <span>VERIFIED CAMPUS TIES</span>
            <span>✦</span>
            
            {/* Duplicated for smooth loop */}
            <span>SARTORIAL ACCENT</span>
            <span>✦</span>
            <span>DAPPER SENIORS STYLE</span>
            <span>✦</span>
            <span>INCOMING FRESHERS SPECIAL</span>
            <span>✦</span>
            <span>BLEND IN INSTANTLY</span>
            <span>✦</span>
            <span>ANTI-NEWBIE AESTHETIC</span>
            <span>✦</span>
            <span>VERIFIED CAMPUS TIES</span>
            <span>✦</span>
          </div>
        </div>
      </section>



      {/* 3. ABOUT SCROLL-DRIVEN SECTION — sticky 3-layer cinematic reveal */}
      <AboutSection />

             {/* 4. CURATED FEATURED TIES: ULTRA-PREMIUM ASYMMETRIC GRID GALLERY */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-28 bg-brand-bg border-b border-brand-border/30 relative overflow-hidden" 
        id="featured-products"
      >
        {/* Decorative background glow */}
        <motion.div style={{ y: yGlow1 }} className="absolute top-1/4 right-0 w-96 h-96 bg-brand-secondary/[0.03] rounded-full filter blur-[120px] pointer-events-none"></motion.div>
        <motion.div style={{ y: yGlow2 }} className="absolute bottom-1/4 left-0 w-80 h-80 bg-brand-accent/[0.05] rounded-full filter blur-[100px] pointer-events-none"></motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-brand-border/40 pb-8">
            <div className="text-left space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-brand-secondary block">The Assemblage Collection</span>
              <h2 className="font-display font-black text-4xl sm:text-5xl text-brand-primary tracking-tight uppercase leading-none">
                Featured Ties
              </h2>
              <p className="text-sm text-brand-secondary max-w-lg leading-relaxed">
                A selection of high-end, handpicked neckwear. Verified against all university administrative standards and chapel dress criteria.
              </p>
            </div>
            <button
              onClick={onBrowseMarketplace}
              className="px-8 py-3.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg rounded-full text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-2 self-start md:self-end transition-all duration-300 shadow-md cursor-pointer"
              id="btn-see-all-featured"
            >
              View Catalog
              <span>↗</span>
            </button>
          </div>
  
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-8" 
            id="featured-grid"
          >
            {featuredProducts.slice(0, 10).map((product) => {
              const originalPrice = product?.originalPrice ?? 0;
              const price = product?.price ?? 0;
              const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
              const isWishlisted = isInWishlist(product.id);
  
              return (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className="bg-transparent flex flex-col justify-between cursor-pointer relative group transition-all duration-300"
                  onClick={() => onOpenProductDetail(product)}
                  id={`featured-${product.id}`}
                >
                  
                  {/* Image container with fine aesthetics */}
                  <div className="aspect-[4/5] w-full rounded-lg overflow-hidden bg-brand-light-gray/40 border border-brand-border/20 relative mb-4 flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover grayscale-[5%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <TiePlaceholder
                        color={product.color}
                        category={product.category}
                        name={product.name}
                        className="w-full h-full"
                      />
                    )}
                    
                    {discountPercent > 0 && (
                      <span className="absolute top-3 left-3 bg-[#F5F2EB] text-[#0A0A0A] font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 font-bold rounded-sm shadow-sm">
                        -{discountPercent}%
                      </span>
                    )}
  
                    {/* Wishlist Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product, e);
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-sm rounded-full text-brand-secondary hover:bg-white hover:text-black transition-all duration-300 opacity-0 group-hover:opacity-100"
                      aria-label="Add to Wishlist"
                    >
                      <Heart 
                        size={12} 
                        strokeWidth={2.5}
                        className={isWishlisted ? 'fill-brand-primary text-brand-primary' : 'text-brand-secondary'} 
                      />
                    </button>
  
                    {/* Quick Add To Bag Hover bar */}
                    <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product, e);
                        }}
                        className="w-full bg-[#F5F2EB] hover:bg-white text-black text-[9px] font-mono tracking-widest py-3 hover:text-black transition-colors uppercase font-bold"
                      >
                        + QUICK RESERVE
                      </button>
                    </div>
                  </div>
  
                  {/* Text labels inside card */}
                  <div className="text-left space-y-1.5 px-0.5">
                    <h3 className="font-sans font-medium text-sm text-brand-primary tracking-tight leading-snug group-hover:text-brand-secondary transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-baseline justify-between pt-2 border-t border-brand-border/10 mt-2">
                      <div className="flex flex-col text-left">
                        <div className="flex items-baseline gap-2">
                          <span className="font-sans text-xs font-bold text-brand-primary">
                            ₦{(product?.price ?? 0).toLocaleString()}
                          </span>
                          {(product?.originalPrice ?? 0) > (product?.price ?? 0) && (
                            <span className="font-sans text-[9px] text-brand-secondary/30 line-through">
                              ₦{(product?.originalPrice ?? 0).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-brand-secondary/65 mt-0.5">
                          {product.stock} in stock
                        </span>
                      </div>
                      <div className="text-[9px] font-mono text-brand-secondary/65 tracking-wider uppercase">
                        {product.rating} / 5.0
                      </div>
                    </div>
                  </div>
  
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* 5. THE COMMUNITY: REDESIGNED WITH ASYMMETRIC MINIMALIST LISTS */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="py-28 bg-brand-bg border-b border-brand-border relative overflow-hidden" 
        id="community"
      >
        {/* Subtle background element */}
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-brand-secondary/[0.02] rounded-full filter blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            
            {/* Left Column: Pure Editorial Headline */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
              <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-brand-secondary font-bold block">
                Instant Co-ordination
              </span>
              <h2 className="font-display font-black text-4xl sm:text-5xl text-brand-primary tracking-tight uppercase leading-[1.05]">
                CAMPUS <br />
                COMMUNITY
              </h2>
              <div className="h-[1px] w-12 bg-brand-secondary"></div>
              <p className="text-sm text-brand-primary/70 leading-relaxed font-sans">
                Getting a tie is all about speed. Join our verified student-run digital networks to coordinate lobby exchanges, view fresh daily listings, and request specific colors instantly.
              </p>
            </div>

            {/* Right Column: Premium High-Contrast Rows */}
            <div className="lg:col-span-8 divide-y divide-brand-border/40" id="community-channels-list">
              
              {/* Channel 1: WhatsApp */}
              <div className="py-8 first:pt-0 group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] font-mono text-emerald-600 font-bold tracking-widest uppercase">WhatsApp Community</span>
                    </div>
                    <h3 className="font-display font-black text-xl sm:text-2xl text-brand-primary uppercase tracking-tight group-hover:text-brand-secondary transition-colors">
                      Notify Charge
                    </h3>
                    <p className="text-sm text-brand-primary/75 leading-relaxed font-sans">
                      Connect directly with graduating seniors and fellow scholars. Negotiate deals and schedule 5-minute lobby meetings inside Daniel, Peter, PG, Esther, or Lydia hall.
                    </p>
                  </div>
                  
                  <div className="shrink-0">
                    <a
                      href="https://chat.whatsapp.com/invite/knotify-covenant"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 border border-brand-primary/20 hover:border-brand-secondary hover:bg-brand-secondary hover:text-brand-bg rounded-sm transition-all duration-300 text-xs font-mono tracking-widest uppercase font-bold group/btn cursor-pointer bg-transparent text-brand-primary"
                    >
                      Connect Chat
                      <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Channel 2: Telegram */}
              <div className="py-8 group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse"></span>
                      <span className="text-[9px] font-mono text-brand-secondary font-bold tracking-widest uppercase">Instant Notification</span>
                    </div>
                    <h3 className="font-display font-black text-xl sm:text-2xl text-brand-primary uppercase tracking-tight group-hover:text-brand-secondary transition-colors">
                      Telegram Channels
                    </h3>
                    <p className="text-sm text-brand-primary/75 leading-relaxed font-sans">
                      Get real-time updates pushed directly to your phone. Never miss a rare, highly coveted, or premium regulation-compliant tie listing as soon as it goes live.
                    </p>
                  </div>
                  
                  <div className="shrink-0">
                    <a
                      href="https://t.me/knotify_covenant"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 border border-brand-primary/20 hover:border-brand-secondary hover:bg-brand-secondary hover:text-brand-bg rounded-sm transition-all duration-300 text-xs font-mono tracking-widest uppercase font-bold group/btn cursor-pointer bg-transparent text-brand-primary"
                    >
                      Subscribe
                      <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </motion.section>

      {/* FAQ Accordions Section */}
      <FAQSection />

      {/* 6. OUTCOME-FOCUSED PREMIUM HIGH-CONTRAST GREEN HERO CTA (SHOUTS AT THE USER) */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="py-28 px-4 sm:px-8 bg-brand-secondary text-center relative overflow-hidden" 
        id="final-cta"
      >
        {/* Soft, Warm Background Radial Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,254,242,0.06)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <motion.div style={{ y: yGlow2 }} className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-brand-accent/25 rounded-full filter blur-[120px] pointer-events-none" />

        <motion.div 
          variants={containerVariants}
          className="max-w-3xl mx-auto space-y-8 relative z-10 py-10"
        >
          {/* Large display text that literally shouts at the user */}
          <motion.h2 
            variants={itemVariants} 
            className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-brand-bg tracking-tight uppercase leading-[1.05]"
          >
            Why pay the price of <br className="hidden sm:inline" />
            a standard meal, <br />
            <span className="italic font-light text-brand-bg/90">just to buy another tie?</span>
          </motion.h2>

          <motion.p 
            variants={itemVariants} 
            className="text-xs sm:text-sm text-brand-bg/85 font-sans max-w-xl mx-auto leading-relaxed"
          >
            Step onto campus with premium, vetted, fully class-compliant neckwear. Skip overpriced stores, grab dapper ties directly in your residential lobby, and stay beautifully dressed for chapel.
          </motion.p>

          <motion.div variants={itemVariants} className="pt-6">
            <button
              onClick={onBrowseMarketplace}
              className="px-12 py-4.5 bg-brand-bg text-brand-secondary hover:text-brand-bg hover:bg-brand-primary font-mono text-xs tracking-widest uppercase font-black rounded-md shadow-2xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-3.5 cursor-pointer"
              id="cta-bottom-browse"
            >
              EXPLORE THE CATALOG NOW
              <ArrowRight size={14} />
            </button>
          </motion.div>


        </motion.div>
      </motion.section>
    </div>
  );
}

