import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Home, 
  Compass, 
  User, 
  Info,
  Menu, 
  X,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  currentTab: 'home' | 'about' | 'marketplace' | 'sell' | 'checkout' | 'wishlist' | 'dashboard';
  setCurrentTab: (tab: 'home' | 'about' | 'marketplace' | 'sell' | 'checkout' | 'wishlist' | 'dashboard') => void;
  cartCount: number;
  isBagHighlighted?: boolean;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenBecomeSeller: () => void;
  currentUser: any;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  cartCount,
  isBagHighlighted = false,
  onOpenCart,
  currentUser,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* ── TOP NAVBAR ────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || currentTab !== 'home' 
            ? 'bg-[#FFFEF2]/95 backdrop-blur-md shadow-xs border-b border-brand-border/40' 
            : 'bg-transparent'
        }`}
        id="main-navbar"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">

            {/* FAR LEFT — Knotify Logo + Knotify text together */}
            <button
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group"
              id="nav-brand-logo-text"
              aria-label="Knotify Home"
            >
              <img
                src="/logo-k.svg"
                alt="Knotify Logo"
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span className="font-serif font-bold text-base sm:text-xl text-brand-secondary tracking-tight">
                Knotify
              </span>
            </button>

            {/* FAR RIGHT — Store, Bag, and Sign Up */}
            <div className="flex items-center gap-2 sm:gap-4" id="navbar-actions">
              
              {/* Store Button */}
              <button
                onClick={() => setCurrentTab('marketplace')}
                className={`text-xs sm:text-sm font-sans transition-all cursor-pointer px-3.5 py-1.5 rounded-full ${
                  currentTab === 'marketplace'
                    ? 'bg-brand-secondary text-[#FFFEF2] font-bold shadow-sm ring-1 ring-brand-secondary/60'
                    : 'text-brand-primary/80 hover:text-brand-secondary hover:bg-brand-secondary/10 font-medium'
                }`}
                aria-current={currentTab === 'marketplace' ? 'page' : undefined}
              >
                Store
              </button>

              <button
                onClick={() => setCurrentTab('about')}
                className={`text-xs sm:text-sm font-sans transition-all cursor-pointer px-3.5 py-1.5 rounded-full ${
                  currentTab === 'about'
                    ? 'bg-brand-secondary text-[#FFFEF2] font-bold shadow-sm ring-1 ring-brand-secondary/60'
                    : 'text-brand-primary/80 hover:text-brand-secondary hover:bg-brand-secondary/10 font-medium'
                }`}
                aria-current={currentTab === 'about' ? 'page' : undefined}
              >
                About
              </button>

              {/* Bag Button */}
              <button
                onClick={onOpenCart}
                className={`flex items-center gap-1.5 text-xs sm:text-sm font-sans font-medium text-brand-primary hover:text-brand-secondary transition-all cursor-pointer px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-black/5 relative ${isBagHighlighted ? 'ring-2 ring-brand-secondary bg-brand-secondary/10 scale-105' : ''}`}
                aria-label="Shopping Bag"
                id="btn-cart"
              >
                <ShoppingBag size={17} strokeWidth={1.8} />
                <span className="hidden sm:inline font-sans">Bag</span>
                {cartCount > 0 && (
                  <span className="bg-brand-secondary text-[#FFFEF2] text-[9px] font-mono font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Sign Up / User Profile Button */}
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentTab('dashboard');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-sans font-semibold text-brand-secondary bg-brand-secondary/10 px-3 py-1.5 rounded-full hover:bg-brand-secondary/20 transition-all max-w-[130px] cursor-pointer"
                    title="My account"
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-secondary text-[#FFFEF2] shrink-0">
                      <User size={12} strokeWidth={2.4} />
                    </span>
                    <span className="hidden md:inline">{currentUser.name?.split(' ')[0]}</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-brand-primary/50 hover:text-brand-secondary transition-colors cursor-pointer"
                    title="Log out"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="text-xs sm:text-sm font-sans font-medium bg-brand-secondary text-[#FFFEF2] px-4 sm:px-5 py-2 rounded-full hover:bg-brand-accent transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm active:scale-98"
                  id="btn-navbar-signup"
                >
                  Sign up
                </button>
              )}

            </div>
          </div>
        </div>
      </motion.header>

      {/* ── INTERACTIVE BOTTOM NAVBAR (For Mobile / Smaller Screens < 640px) ── */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-[#FFFEF2]/90 backdrop-blur-md border-t border-black/8 px-4 py-2 select-none shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
        id="mobile-bottom-navbar"
      >
        <div className="flex items-center justify-around max-w-sm mx-auto">
          
          {/* 1. Home Tab */}
          <button
            onClick={() => {
              setCurrentTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              currentTab === 'home' ? 'text-brand-secondary font-bold' : 'text-brand-primary/55 hover:text-brand-primary'
            }`}
          >
            <Home size={19} strokeWidth={currentTab === 'home' ? 2.2 : 1.7} />
            <span className="text-[10px] font-sans">Home</span>
            {currentTab === 'home' && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -bottom-1 w-4 h-0.5 bg-brand-secondary rounded-full"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
          </button>

          {/* 2. Store Tab */}
          <button
            onClick={() => {
              setCurrentTab('marketplace');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              currentTab === 'marketplace' ? 'text-brand-secondary font-bold' : 'text-brand-primary/55 hover:text-brand-primary'
            }`}
          >
            <Compass size={19} strokeWidth={currentTab === 'marketplace' ? 2.2 : 1.7} />
            <span className="text-[10px] font-sans">Store</span>
            {currentTab === 'marketplace' && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -bottom-1 w-4 h-0.5 bg-brand-secondary rounded-full"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
          </button>

          <button
            onClick={() => {
              setCurrentTab('about');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              currentTab === 'about' ? 'text-brand-secondary font-bold' : 'text-brand-primary/55 hover:text-brand-primary'
            }`}
          >
            <Info size={19} strokeWidth={currentTab === 'about' ? 2.2 : 1.7} />
            <span className="text-[10px] font-sans">About</span>
            {currentTab === 'about' && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -bottom-1 w-4 h-0.5 bg-brand-secondary rounded-full"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
          </button>

          {/* 3. Bag Tab */}
          <button
            onClick={onOpenCart}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              currentTab === 'checkout' ? 'text-brand-secondary font-bold' : 'text-brand-primary/55 hover:text-brand-primary'
            }`}
          >
            <div className="relative">
              <ShoppingBag size={19} strokeWidth={currentTab === 'checkout' ? 2.2 : 1.7} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-brand-secondary text-[#FFFEF2] text-[8px] font-mono font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-sans">Bag</span>
            {currentTab === 'checkout' && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -bottom-1 w-4 h-0.5 bg-brand-secondary rounded-full"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
          </button>

          {/* 4. Account Tab */}
          <button
            onClick={() => {
              if (currentUser) {
                setCurrentTab('dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                onOpenAuth();
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              currentTab === 'dashboard' ? 'text-brand-secondary font-bold' : 'text-brand-primary/55 hover:text-brand-primary'
            }`}
          >
            <User size={19} strokeWidth={currentTab === 'dashboard' ? 2.2 : 1.7} />
            <span className="text-[10px] font-sans">{currentUser ? 'Account' : 'Sign in'}</span>
            {currentTab === 'dashboard' && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -bottom-1 w-4 h-0.5 bg-brand-secondary rounded-full"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
          </button>

        </div>
      </nav>
    </>
  );
}
