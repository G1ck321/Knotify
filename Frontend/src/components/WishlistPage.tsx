import React from 'react';
import { Trash2, ShoppingBag, ArrowLeft, Heart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import TiePlaceholder from './TiePlaceholder';

interface WishlistPageProps {
  wishlist: string[];
  products: Product[];
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBackToCollection: () => void;
}

export default function WishlistPage({
  wishlist,
  products,
  onToggleWishlist,
  onAddToCart,
  onBackToCollection,
}: WishlistPageProps) {
  // Find saved products
  const savedProducts = wishlist
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  const totalPrice = savedProducts.reduce((acc, p) => acc + p.price, 0);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="wishlist-page-container">
      {/* Back Button */}
      <div className="mb-8 text-left">
        <button
          onClick={onBackToCollection}
          className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-brand-primary/60 hover:text-brand-secondary transition-colors cursor-pointer group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Collection</span>
        </button>
      </div>

      {/* Page Header */}
      <div className="text-left border-b border-brand-border/40 pb-6 mb-10 space-y-3">
        <div className="flex items-center gap-3">
          <Heart size={20} className="text-brand-secondary fill-brand-secondary" />
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-secondary font-bold block">
            Your Personal Selection
          </span>
        </div>
        <h1 className="font-display font-light text-4xl sm:text-5xl text-brand-primary tracking-tight uppercase">
          Curated Wishlist
        </h1>
        <p className="text-xs sm:text-sm text-brand-primary/60 max-w-xl">
          A dedicated space for the university neckwear you are tracking. Complete your lobby handoff once you are ready.
        </p>
      </div>

      {savedProducts.length === 0 ? (
        <div className="py-20 text-center space-y-6" id="wishlist-empty-state">
          <div className="w-16 h-16 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-brand-secondary mx-auto shadow-inner">
            <Heart size={26} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-xl sm:text-2xl text-brand-primary tracking-tight uppercase">
              No ties saved yet
            </h3>
            <p className="text-xs sm:text-sm text-brand-primary/60 max-w-md mx-auto">
              Explore the campus catalog, find chapel-approved designs, and tap the heart icon to save them here.
            </p>
          </div>
          <button
            onClick={onBackToCollection}
            className="px-8 py-3.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-mono tracking-widest uppercase text-xs font-bold rounded shadow-lg transition-all duration-300 inline-flex items-center gap-2 cursor-pointer"
          >
            Browse Ties Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Main List of Saved Products */}
          <div className="lg:col-span-8 space-y-6" id="wishlist-items-grid">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {savedProducts.map((prod) => (
                <div 
                  key={prod.id} 
                  className="bg-brand-card border border-brand-border/60 rounded-xl p-5 flex flex-col justify-between text-left transition-all duration-300 hover:shadow-md group"
                >
                  <div className="space-y-4">
                    {/* Image Area */}
                    <div className="aspect-h-1 aspect-w-1 sm:aspect-none w-full h-48 bg-brand-bg rounded-lg overflow-hidden border border-brand-border/40 relative">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="h-full w-full object-cover grayscale-[10%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <TiePlaceholder
                          color={prod.color}
                          category={prod.category}
                          name={prod.name}
                          className="w-full h-full"
                        />
                      )}
                      
                      {/* Close Button on image top right */}
                      <button
                        onClick={() => onToggleWishlist(prod)}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-brand-bg/90 hover:bg-brand-secondary border border-brand-border/50 hover:border-brand-secondary text-brand-primary hover:text-brand-bg transition-colors shadow cursor-pointer z-10"
                        title="Remove from Wishlist"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[8px] font-mono text-brand-secondary uppercase tracking-widest">
                        <span>{prod.category}</span>
                        <span>&bull;</span>
                        <span className="font-semibold text-brand-primary">{prod.sellerHall}</span>
                      </div>
                      <h3 className="font-display font-medium text-lg text-brand-primary leading-snug tracking-tight uppercase line-clamp-1">
                        {prod.name}
                      </h3>
                      <p className="text-[9px] font-mono tracking-wider uppercase text-brand-primary/50">
                        BY {prod.seller} • {prod.stock} left in stock
                      </p>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="mt-6 pt-4 border-t border-brand-border/30 flex items-center justify-between gap-4">
                    <div className="font-sans text-sm font-semibold text-brand-primary">
                      <span>₦{prod.price.toLocaleString()}</span>
                      {prod.originalPrice > prod.price && (
                        <span className="font-mono text-[9px] text-brand-primary/40 line-through ml-1.5">
                          ₦{prod.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onAddToCart(prod, 1)}
                      disabled={prod.stock === 0}
                      className={`px-4.5 py-2.5 font-mono tracking-widest uppercase text-[9px] font-bold flex items-center gap-1.5 transition-all rounded-md shadow-sm ${
                        prod.stock === 0
                          ? 'bg-brand-bg border border-brand-border text-brand-primary/40 cursor-not-allowed'
                          : 'bg-brand-secondary hover:bg-brand-primary text-brand-bg cursor-pointer hover:scale-105'
                      }`}
                    >
                      <ShoppingBag size={10} />
                      {prod.stock === 0 ? 'SOLD OUT' : 'ADD TO BAG'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Curator Insights & Stats Card */}
          <div className="lg:col-span-4" id="wishlist-summary-card">
            <div className="bg-brand-card border border-brand-border rounded-xl p-6 space-y-6 text-left shadow-sm">
              <div className="space-y-2">
                <h3 className="text-[10px] font-mono tracking-widest uppercase text-brand-secondary font-bold">
                  WISHLIST OVERVIEW
                </h3>
                <h4 className="font-display text-xl text-brand-primary uppercase font-light">
                  Sartorial Summary
                </h4>
              </div>

              <div className="space-y-3.5 pt-2 border-t border-brand-border/30">
                <div className="flex justify-between items-baseline text-xs font-sans">
                  <span className="text-brand-primary/60">Total Saved Items</span>
                  <span className="font-mono font-bold text-brand-primary">{savedProducts.length} Ties</span>
                </div>
                <div className="flex justify-between items-baseline text-xs font-sans">
                  <span className="text-brand-primary/60">Est. Total Valuation</span>
                  <span className="font-mono font-bold text-brand-primary">₦{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs font-sans">
                  <span className="text-brand-primary/60">Average Price Per Tie</span>
                  <span className="font-mono font-bold text-brand-primary">₦{Math.round(totalPrice / savedProducts.length).toLocaleString()}</span>
                </div>
              </div>

              {/* Decorative Chapel Guidelines alert */}
              <div className="p-4 bg-brand-secondary/5 border border-brand-secondary/15 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-brand-secondary">
                  <Sparkles size={14} className="animate-pulse" />
                  <span className="text-[9px] font-mono tracking-widest font-bold uppercase">SARTORIAL TIP</span>
                </div>
                <p className="text-[11px] text-brand-primary/75 leading-relaxed font-sans">
                  All items in your wishlist conform to Covenant University class-compliant and chapel dress policies. Book meeting slots soon to avoid sold-out items from graduating sellers!
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={onBackToCollection}
                  className="w-full py-3 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-mono text-[10px] tracking-widest uppercase font-bold rounded shadow transition-colors duration-200 cursor-pointer"
                >
                  Return to Marketplace
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
