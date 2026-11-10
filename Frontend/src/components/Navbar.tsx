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
              
              {/* DESKTOP NAV ACTIONS (Hidden on small screens < md to prevent cramming) */}
              <div className="hidden md:flex items-center gap-3 lg:gap-4" id="navbar-actions-desktop">
                {/* Store Button */}
                <button
                  onClick={() => setCurrentTab('marketplace')}
                  className={`text-xs sm:text-sm font-sans font-medium transition-colors cursor-pointer px-3.5 py-1.5 rounded-full ${
                    currentTab === 'marketplace'
                      ? 'text-brand-secondary bg-brand-secondary/10 font-semibold'
                      : 'text-brand-primary/80 hover:text-brand-secondary'
                  }`}
                >
                  Store
                </button>

                {/* About Button */}
                <button
                  onClick={() => setCurrentTab('about')}
                  className={`text-xs sm:text-sm font-sans font-medium transition-colors cursor-pointer px-3.5 py-1.5 rounded-full ${
                    currentTab === 'about'
                      ? 'text-brand-secondary bg-brand-secondary/10 font-semibold'
                      : 'text-brand-primary/80 hover:text-brand-secondary'
                  }`}
                  aria-current={currentTab === 'about' ? 'page' : undefined}
                >
                  About
                </button>

                {/* Bag Button */}
                <button
                  onClick={onOpenCart}
                  className={`flex items-center gap-1.5 text-xs sm:text-sm font-sans font-medium text-brand-primary hover:text-brand-secondary transition-all cursor-pointer px-3 py-1.5 rounded-full hover:bg-black/5 relative ${isBagHighlighted ? 'ring-2 ring-brand-secondary bg-brand-secondary/10 scale-105' : ''}`}
                  aria-label="Shopping Bag"
                  id="btn-cart"
                >
                  <ShoppingBag size={17} strokeWidth={1.8} />
                  <span className="font-sans">Bag</span>
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
                      className="text-xs sm:text-sm font-sans font-medium text-brand-secondary bg-brand-secondary/10 px-3.5 py-1.5 rounded-full hover:bg-brand-secondary/15 transition-all max-w-[120px] truncate cursor-pointer"
                    >
                      {currentUser.name?.split(' ')[0]}
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
                    className="text-xs sm:text-sm font-sans font-medium bg-brand-secondary text-[#FFFEF2] px-5 py-2 rounded-full hover:bg-brand-accent transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm active:scale-98"
                    id="btn-navbar-signup"
                  >
                    Sign up
                  </button>
                )}
              </div>

              {/* MOBILE / COMPACT SCREEN ACTIONS: Quick Bag + Sandwich Menu Hamburger */}
              <div className="flex md:hidden items-center gap-2" id="navbar-actions-mobile">
                <button
                  onClick={onOpenCart}
                  className="relative p-2 rounded-full text-brand-primary hover:text-brand-secondary hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Shopping Bag"
                >
                  <ShoppingBag size={20} strokeWidth={1.8} />
                  {cartCount > 0 && (
                    <span className="absolute 1 top-0.5 right-0.5 bg-brand-secondary text-[#FFFEF2] text-[9px] font-mono font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* Hamburger / Sandwich Icon Button */}
                <button
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  className="p-2 rounded-xl text-brand-primary hover:text-brand-secondary hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? (
                    <X size={22} className="text-brand-secondary" />
                  ) : (
                    <Menu size={22} className="text-brand-primary" />
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* ── DROPDOWN SANDWICH MENU FOR COMPACT SCREENS ── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="md:hidden border-b border-brand-border/40 bg-[#FFFEF2]/98 backdrop-blur-xl shadow-lg overflow-hidden"
            >
              <div className="px-5 py-4 space-y-3">
                {currentUser && (
                  <div className="flex items-center justify-between pb-3 border-b border-black/8">
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-brand-secondary/80">Signed in as</p>
                      <p className="font-serif font-bold text-sm text-brand-primary">{currentUser.name || 'Student'}</p>
                    </div>
                    <span className="text-[10px] font-sans font-semibold bg-brand-secondary/10 text-brand-secondary px-2.5 py-1 rounded-full">
                      {currentUser.hall || currentUser.residenceHall || 'CU Student'}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-1">
                  <button
                    onClick={() => {
                      setCurrentTab('home');
                      setIsMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-sans font-medium transition-colors cursor-pointer ${
                      currentTab === 'home'
                        ? 'bg-brand-secondary/10 text-brand-secondary font-semibold'
                        : 'text-brand-primary/80 hover:bg-black/5 hover:text-brand-primary'
                    }`}
                  >
                    <Home size={18} />
                    <span>Home</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTab('marketplace');
                      setIsMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-sans font-medium transition-colors cursor-pointer ${
                      currentTab === 'marketplace'
                        ? 'bg-brand-secondary/10 text-brand-secondary font-semibold'
                        : 'text-brand-primary/80 hover:bg-black/5 hover:text-brand-primary'
                    }`}
                  >
                    <Compass size={18} />
                    <span>Explore Store</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTab('about');
                      setIsMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-sans font-medium transition-colors cursor-pointer ${
                      currentTab === 'about'
                        ? 'bg-brand-secondary/10 text-brand-secondary font-semibold'
                        : 'text-brand-primary/80 hover:bg-black/5 hover:text-brand-primary'
                    }`}
                  >
                    <Info size={18} />
                    <span>About Knotify</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCart();
                    }}
                    className="flex items-center justify-between w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-sans font-medium text-brand-primary/80 hover:bg-black/5 hover:text-brand-primary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag size={18} />
                      <span>Shopping Bag</span>
                    </div>
                    {cartCount > 0 && (
                      <span className="bg-brand-secondary text-[#FFFEF2] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                        {cartCount} item{cartCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </button>

                  {currentUser ? (
                    <>
                      <button
                        onClick={() => {
                          setCurrentTab('dashboard');
                          setIsMobileMenuOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-sans font-medium transition-colors cursor-pointer ${
                          currentTab === 'dashboard'
                            ? 'bg-brand-secondary/10 text-brand-secondary font-semibold'
                            : 'text-brand-primary/80 hover:bg-black/5 hover:text-brand-primary'
                        }`}
                      >
                        <User size={18} />
                        <span>My Dashboard & Orders</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onLogout();
                        }}
                        className="flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-sans font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer mt-1"
                      >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenAuth();
                        }}
                        className="w-full text-center text-sm font-sans font-medium bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] py-3 rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        Sign in / Create Account
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

          {/* 3. About Tab */}
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

          {/* 4. Bag Tab */}
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

          {/* 5. Account Tab */}
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
