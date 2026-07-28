import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import Dashboard from './Dashboard';
import { Product, Reservation } from '../types';

interface SellPageProps {
  currentUser: any;
  onUpdateUser: (updatedUser: any) => void;
  reservations: Reservation[];
  onUpdateReservation: (updatedRes: Reservation) => void;
  wishlist: string[];
  products: Product[];
  onToggleWishlist: (product: Product, e?: React.MouseEvent) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenAuth: () => void;
}

export default function SellPage({
  currentUser,
  onUpdateUser,
  reservations,
  onUpdateReservation,
  wishlist,
  products,
  onToggleWishlist,
  onAddToCart,
  onOpenAuth,
}: SellPageProps) {
  const isSeller = currentUser && currentUser.isSeller;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 min-h-[70vh]" id="sell-page-root">
      {isSeller ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-left border-b border-brand-border/40 pb-6 space-y-2">
            <h1 className="font-display font-light text-4xl sm:text-5xl text-brand-primary tracking-tight uppercase">
              Seller Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-brand-primary/60 max-w-xl font-sans">
              Manage your personal info, track customer reservations for pickup, and keep tabs on your wish list items.
            </p>
          </div>

          {/* Core Dashboard Component */}
          <Dashboard
            currentUser={currentUser}
            onUpdateUser={onUpdateUser}
            reservations={reservations}
            onUpdateReservation={onUpdateReservation}
            wishlist={wishlist}
            products={products}
            onToggleWishlist={onToggleWishlist}
            onAddToCart={onAddToCart}
          />
        </motion.div>
      ) : (
        /* Not signed in as a seller */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto py-16 px-6 bg-brand-card border border-brand-border rounded-2xl text-center space-y-8 shadow-md"
        >
          <div className="w-16 h-16 rounded-full bg-brand-secondary/10 border border-brand-secondary/20 flex items-center justify-center text-brand-secondary mx-auto shadow-inner animate-pulse">
            <ShieldAlert size={28} />
          </div>

          <div className="space-y-3">
            <span className="text-[9px] font-mono tracking-[0.25em] text-brand-secondary uppercase font-bold block">
              Authorized Sellers Only
            </span>
            <h2 className="font-display font-light text-2xl sm:text-3xl text-brand-primary uppercase tracking-tight">
              Seller Portal
            </h2>
            <p className="text-xs sm:text-sm text-brand-primary/60 leading-relaxed font-sans max-w-sm mx-auto">
              Please sign in or register with a **Seller Account** to view your reservation list, change your room details, and manage collections.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenAuth}
              className="w-full py-4 bg-[#1F3E2B] hover:bg-brand-primary text-white font-mono text-xs tracking-widest uppercase font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow hover:scale-[1.02]"
            >
              <UserCheck size={14} />
              <span>Sign In as Seller</span>
              <ArrowRight size={12} className="ml-1" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
