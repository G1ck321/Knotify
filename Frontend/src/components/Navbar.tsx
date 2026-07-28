import React, { useState } from 'react';
import { ShoppingBag, Heart, PlusCircle, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  currentTab: 'home' | 'marketplace' | 'sell' | 'checkout' | 'wishlist';
  setCurrentTab: (tab: 'home' | 'marketplace' | 'sell' | 'checkout' | 'wishlist') => void;
  cartCount: number;
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
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenBecomeSeller,
  currentUser,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 w-full bg-[#FFFEF2] border-b border-brand-border/40 backdrop-blur-md transition-all duration-300"
      id="main-navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Left Segment: Brand Logo */}
          <div className="flex items-center" id="navbar-left-portal">
            <button
              onClick={() => setCurrentTab('home')}
              className="text-lg sm:text-xl font-display font-black tracking-[0.25em] text-brand-secondary hover:text-brand-accent transition-all duration-300 flex items-center uppercase cursor-pointer select-none"
              id="nav-logo-trigger"
            >
              <span className="font-black tracking-[0.3em] text-brand-secondary bg-brand-secondary/5 px-3 py-1.5 border border-brand-secondary/20 rounded-xs shadow-sm">
                KNOTIFY
              </span>
            </button>
          </div>

          {/* Center Segment: Navigation Links & Chapel Cross Decoration */}
          <nav className="hidden md:flex items-center space-x-7 select-none" id="desktop-nav">
            <button
              onClick={() => setCurrentTab('home')}
              className={`text-[10px] font-mono tracking-[0.2em] uppercase transition-all duration-200 py-1 cursor-pointer ${
                currentTab === 'home' 
                  ? 'text-brand-secondary font-black scale-105' 
                  : 'text-neutral-500 hover:text-brand-secondary'
              }`}
              id="nav-link-home"
            >
              HOMEPAGE
            </button>
            <button
              onClick={() => setCurrentTab('marketplace')}
              className={`text-[10px] font-mono tracking-[0.2em] uppercase transition-all duration-200 py-1 cursor-pointer ${
                currentTab === 'marketplace' 
                  ? 'text-brand-secondary font-black scale-105' 
                  : 'text-neutral-500 hover:text-brand-secondary'
              }`}
              id="nav-link-marketplace"
            >
              COLLECTION
            </button>

            {/* Red Chapel Cross emblem representing university chapel design theme */}
            <span className="text-brand-secondary font-serif text-xl font-light select-none px-2 animate-pulse">
              †
            </span>

            <button
              onClick={() => setCurrentTab('sell')}
              className={`text-[10px] font-mono tracking-[0.2em] uppercase transition-all duration-200 py-1 cursor-pointer ${
                currentTab === 'sell'
                  ? 'text-brand-secondary font-black scale-105'
                  : 'text-neutral-500 hover:text-brand-secondary'
              }`}
              id="nav-link-sell"
            >
              SELL TIE
            </button>
            <button
              onClick={onOpenWishlist}
              className="text-[10px] font-mono tracking-[0.2em] uppercase text-neutral-500 hover:text-brand-secondary transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              id="nav-link-wishlist"
            >
              <span>WISHLIST</span>
              {wishlistCount > 0 && (
                <span className="bg-brand-secondary text-brand-bg text-[8px] font-mono rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Segment: Session State & Bag Trigger */}
          <div className="flex items-center space-x-4 sm:space-x-5" id="navbar-actions">
            
            {/* Wishlist Button - Mobile only */}
            <button
              onClick={onOpenWishlist}
              className="md:hidden p-2 text-neutral-500 hover:text-brand-secondary transition-colors relative animate-fade-in"
              aria-label="Wishlist"
              id="btn-wishlist-mobile"
            >
              <Heart size={18} strokeWidth={1.5} className={wishlistCount > 0 ? 'fill-brand-primary text-brand-primary' : ''} />
            </button>

            {/* Profile State */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[9px] font-mono text-neutral-500 tracking-wider uppercase max-w-[80px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
                <button
                  onClick={onLogout}
                  className="text-xs sm:text-sm font-display uppercase tracking-[0.1em] font-bold text-brand-secondary hover:text-brand-accent transition-all cursor-pointer"
                  id="btn-navbar-logout"
                >
                  LOGOUT
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="text-xs sm:text-sm font-display uppercase tracking-[0.1em] font-bold text-brand-secondary hover:text-brand-accent transition-all cursor-pointer"
                id="btn-navbar-login"
              >
                SIGN IN
              </button>
            )}

            {/* Shopping Bag Button (Off-white styling in matching bag text) */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] rounded-sm px-5 py-2.5 transition-all duration-300 cursor-pointer text-xs sm:text-sm font-display uppercase tracking-[0.1em] font-bold shadow-md"
              aria-label="Shopping Cart"
              id="btn-cart"
            >
              <span>BAG ({cartCount})</span>
            </button>

            {/* Hamburger Toggle - Mobile only */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-neutral-500 hover:text-brand-secondary transition-colors cursor-pointer"
              aria-label="Toggle menu"
              id="btn-navbar-toggle"
            >
              {isMobileMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden border-t border-brand-border/20 bg-[#FFFEF2] overflow-hidden"
            id="mobile-nav-menu"
          >
            <div className="px-4 py-4 space-y-2 flex flex-col text-left">
              <button
                onClick={() => {
                  setCurrentTab('home');
                  setIsMobileMenuOpen(false);
                }}
                className={`text-[10px] font-mono tracking-[0.2em] uppercase py-3 px-3 rounded-xs transition-all duration-200 text-left ${
                  currentTab === 'home' 
                    ? 'text-brand-secondary bg-brand-secondary/5 font-black border-l-2 border-brand-secondary' 
                    : 'text-neutral-500 hover:text-brand-secondary hover:bg-brand-secondary/5'
                }`}
              >
                HOMEPAGE
              </button>
              <button
                onClick={() => {
                  setCurrentTab('marketplace');
                  setIsMobileMenuOpen(false);
                }}
                className={`text-[10px] font-mono tracking-[0.2em] uppercase py-3 px-3 rounded-xs transition-all duration-200 text-left ${
                  currentTab === 'marketplace' 
                    ? 'text-brand-secondary bg-brand-secondary/5 font-black border-l-2 border-brand-secondary' 
                    : 'text-neutral-500 hover:text-brand-secondary hover:bg-brand-secondary/5'
                }`}
              >
                COLLECTION
              </button>
              <button
                onClick={() => {
                  setCurrentTab('sell');
                  setIsMobileMenuOpen(false);
                }}
                className={`text-[10px] font-mono tracking-[0.2em] uppercase py-3 px-3 rounded-xs transition-all duration-200 text-left ${
                  currentTab === 'sell'
                    ? 'text-brand-secondary bg-brand-secondary/5 font-black border-l-2 border-brand-secondary'
                    : 'text-neutral-500 hover:text-brand-secondary hover:bg-brand-secondary/5'
                }`}
              >
                SELL TIE
              </button>
              <button
                onClick={() => {
                  onOpenWishlist();
                  setIsMobileMenuOpen(false);
                }}
                className="text-[10px] font-mono tracking-[0.2em] uppercase py-3 px-3 rounded-xs transition-all duration-200 text-left flex items-center justify-between text-neutral-500 hover:text-brand-secondary hover:bg-brand-secondary/5"
              >
                <span>WISHLIST</span>
                {wishlistCount > 0 && (
                  <span className="bg-brand-secondary text-brand-bg text-[8px] font-mono rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </button>
              {currentUser && (
                <button
                  onClick={() => {
                    onOpenBecomeSeller();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-[10px] font-mono tracking-[0.2em] uppercase py-3 px-3 rounded-xs transition-all duration-200 text-left text-neutral-500 hover:text-brand-secondary hover:bg-brand-secondary/5"
                >
                  BECOME A SELLER
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
