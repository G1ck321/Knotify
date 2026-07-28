import React, { useState, useMemo } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  Heart, 
  ShoppingBag, 
  Star, 
  RotateCcw, 
  Check, 
  Eye, 
  ChevronDown,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import TiePlaceholder from './TiePlaceholder';

function SkeletonCard() {
  return (
    <div className="flex flex-col relative space-y-4 animate-pulse text-left" id="skeleton-card">
      <div className="aspect-[3/4] w-full rounded bg-brand-card border border-brand-border relative" />
      <div className="space-y-2 px-1">
        <div className="h-4 bg-brand-card rounded w-5/6" />
        <div className="h-3 bg-brand-card rounded w-1/3" />
        <div className="h-3 bg-brand-card rounded w-1/2" />
      </div>
    </div>
  );
}

interface MarketplaceProps {
  products: Product[];
  onOpenProductDetail: (product: Product) => void;
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  isInWishlist: (productId: string) => boolean;
  initialSearchQuery?: string;
  initialCategory?: string;
  onSearchQueryChange?: (q: string) => void;
  onCategoryChange?: (c: string) => void;
}

export default function Marketplace({
  products,
  onOpenProductDetail,
  onToggleWishlist,
  onAddToCart,
  isInWishlist,
  initialSearchQuery = '',
  initialCategory = 'All',
  onSearchQueryChange,
  onCategoryChange,
}: MarketplaceProps) {
  
  // States
  const [localSearchQuery, setLocalSearchQuery] = useState(initialSearchQuery);
  const [localCategory, setLocalCategory] = useState(initialCategory);
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [selectedColor, setSelectedColor] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchQuery = localSearchQuery;
  const setSearchQuery = (val: string) => {
    setLocalSearchQuery(val);
    if (onSearchQueryChange) onSearchQueryChange(val);
  };

  const selectedCategory = localCategory;
  const setSelectedCategory = (val: string) => {
    setLocalCategory(val);
    if (onCategoryChange) onCategoryChange(val);
  };

  // Sync state from parent
  React.useEffect(() => {
    setLocalSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  React.useEffect(() => {
    setLocalCategory(initialCategory);
  }, [initialCategory]);

  // Trigger loading state for 550ms on filter or search changes to simulate fetch
  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 550);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedCondition, selectedColor, maxPrice, minRating, onlyInStock, sortBy]);

  // Constants
  const categories = ['All', 'Official Tie', 'Premium', 'Department', 'Bow Tie'];
  const conditions = ['All', 'Brand New', 'Like New', 'Gently Used', 'Used'];
  const colors = ['All', 'Navy', 'Crimson', 'Gold', 'Forest Green', 'Black', 'Stripes'];

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCondition('All');
    setSelectedColor('All');
    setMaxPrice(10000);
    setMinRating(0);
    setOnlyInStock(false);
    setSortBy('featured');
  };

  // Live Filtering Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch = 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.sellerHall.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        const matchesCondition = selectedCondition === 'All' || product.condition === selectedCondition;
        const matchesColor = selectedColor === 'All' || product.color === selectedColor;
        const matchesPrice = product.price <= maxPrice;
        const matchesRating = product.rating >= minRating;
        const matchesStock = !onlyInStock || product.stock > 0;

        return matchesSearch && matchesCategory && matchesCondition && matchesColor && matchesPrice && matchesRating && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'popular') return b.reviewsCount - a.reviewsCount;
        return b.isFeatured ? 1 : -1; // Featured default
      });
  }, [products, searchQuery, selectedCategory, selectedCondition, selectedColor, maxPrice, minRating, onlyInStock, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-brand-bg min-h-screen" id="marketplace-root">
      
      {/* 1. ELEVATED TYPOGRAPHY HEADER (UGMONK-INSPIRED) */}
      <div className="text-center py-8 md:py-14 max-w-2xl mx-auto" id="marketplace-header">
        <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-brand-secondary block mb-2 select-none">
          COVENANT TIE EXCHANGE • EST. 2026
        </span>
        <h1 className="font-display font-light text-4xl sm:text-5xl md:text-6xl text-brand-primary tracking-tight uppercase leading-tight select-none">
          THE CATALOG
        </h1>
        <p className="text-[10px] sm:text-xs text-brand-secondary font-light max-w-md mx-auto leading-relaxed mt-3 uppercase tracking-wider select-none">
          Premium Compliant University Neckwear &bull; Hostel-to-Hostel Student Handoffs
        </p>
      </div>

      {/* 2. CENTERED MINIMALIST NAVIGATION TABS */}
      <div className="flex justify-center items-center gap-x-8 gap-y-3 flex-wrap border-b border-brand-border/10 pb-4 mb-10" id="categories-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`pb-2 text-[11px] font-mono tracking-[0.15em] uppercase transition-all duration-300 cursor-pointer border-b-2 ${
              selectedCategory === cat
                ? 'border-brand-primary text-brand-primary font-extrabold'
                : 'border-transparent text-neutral-500 hover:text-brand-primary font-medium'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. ULTRA-SLIM SEARCH & UTILITIES CONTROL BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-brand-border/10 pb-6 mb-12" id="search-utilities-bar">
        {/* Total items tag */}
        <div className="text-[10px] font-mono text-brand-secondary uppercase tracking-widest order-3 sm:order-1 select-none font-medium">
          Showing {filteredProducts.length} of {products.length} compliance ties
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end order-1 sm:order-2">
          {/* Low profile inline search */}
          <div className="relative w-full sm:w-64" id="search-input-wrapper">
            <input
              type="text"
              placeholder="SEARCH CATALOG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-brand-primary text-[10px] font-mono tracking-widest uppercase border-b border-brand-border focus:border-brand-secondary focus:outline-none py-1.5 transition-all"
              id="input-marketplace-search"
            />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-brand-secondary pointer-events-none">
              <Search size={11} />
            </span>
          </div>

          {/* Filter & Sort Triggers */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Filter Toggle */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-brand-border hover:border-brand-secondary hover:bg-brand-secondary hover:text-brand-bg text-brand-primary text-[10px] font-mono tracking-widest uppercase transition-all cursor-pointer bg-brand-card rounded"
            >
              <SlidersHorizontal size={10} />
              <span>FILTER</span>
            </button>

            {/* Sortermind */}
            <div className="relative" id="sort-dropdown-wrapper">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-brand-bg text-brand-primary text-[10px] font-mono tracking-widest uppercase border-b border-brand-border hover:border-brand-secondary focus:border-brand-secondary py-1.5 pl-1 pr-6 focus:outline-none cursor-pointer font-bold"
                id="select-sort"
              >
                <option value="featured">RELEVANCE</option>
                <option value="price-low">PRICE: LOW-HIGH</option>
                <option value="price-high">PRICE: HIGH-LOW</option>
                <option value="rating">TOP RATED</option>
                <option value="popular">POPULARITY</option>
              </select>
              <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-brand-secondary">
                <ChevronDown size={10} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FULL-WIDTH GRID (SPACIOUS 4-COLUMNS ON DESKTOP, NO CLUTTERING SIDEBAR) */}
      <div className="w-full" id="marketplace-main-layout">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            /* SUBTLE SKELETON GRID */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-14" id="products-skeleton-grid">
              {[...Array(8)].map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            /* EMPTY FILTER STATE */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-brand-card border border-brand-border rounded p-12 text-center max-w-md mx-auto my-12"
              id="empty-state-card"
            >
              <div className="w-12 h-12 bg-brand-bg border border-brand-border rounded flex items-center justify-center text-brand-secondary mx-auto mb-6">
                <Search size={18} />
              </div>
              <h3 className="font-mono tracking-widest uppercase font-bold text-xs text-brand-primary">No ties match filters</h3>
              <p className="text-xs text-brand-primary/80 mt-2 leading-relaxed font-sans">
                We couldn't find any ties matching your specific filters. Try widening your price, selecting another color, or resetting filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-6 px-6 py-2.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-mono text-[9px] tracking-widest uppercase rounded transition-colors cursor-pointer font-bold"
                id="btn-empty-state-reset"
              >
                Reset Filter Options
              </button>
            </motion.div>
          ) : (
            /* CRISTINE GRID OF ITEMS */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-14" id="products-grid-list">
              {filteredProducts.map((product) => {
                const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                const isWishlisted = isInWishlist(product.id);
                const isOutOfStock = product.stock === 0;

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    key={product.id}
                    className="bg-transparent border-0 rounded-none p-0 flex flex-col relative group cursor-pointer transition-all duration-300 text-left"
                    onClick={() => onOpenProductDetail(product)}
                    id={`product-${product.id}`}
                  >
                    {/* Thumbnail Container (Flat Ugmonk Style, Pure Sharp Corners) */}
                    <div className="aspect-[3/4] w-full rounded overflow-hidden bg-brand-card border border-brand-border relative mb-4">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className={`w-full h-full object-cover grayscale-[8%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-700 ${isOutOfStock ? 'opacity-40 grayscale' : ''}`}
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

                      {/* Clean Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        {isOutOfStock ? (
                          <span className="bg-brand-primary text-brand-bg font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 font-bold rounded">
                            SOLD OUT
                          </span>
                        ) : discountPercent > 0 ? (
                          <span className="bg-brand-secondary text-brand-bg font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 font-bold rounded">
                            -{discountPercent}%
                          </span>
                        ) : null}

                        {product.condition === 'Brand New' && !isOutOfStock && (
                          <span className="bg-brand-bg text-brand-primary font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 font-bold border border-brand-border rounded">
                            NEW
                          </span>
                        )}
                      </div>

                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(product, e);
                        }}
                        className="absolute top-3 right-3 p-2 bg-brand-bg/90 hover:bg-brand-secondary text-brand-secondary hover:text-brand-bg border border-brand-border rounded-full hover:scale-105 transition-all duration-200 z-10"
                        aria-label="Add to Wishlist"
                      >
                        <Heart 
                          size={11} 
                          strokeWidth={2}
                          className={isWishlisted ? 'fill-brand-secondary text-brand-secondary' : 'text-brand-primary hover:text-brand-secondary'} 
                        />
                      </button>

                      {/* Subtle Slide-up Add to Bag on Hover */}
                      {!isOutOfStock && (
                        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product, e);
                            }}
                            className="w-full bg-brand-secondary text-brand-bg text-[9px] font-mono tracking-widest py-3.5 hover:bg-brand-primary transition-colors uppercase font-bold cursor-pointer"
                          >
                            + ADD TO BAG
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Info Panel - Absolute Ugmonk Minimalism */}
                    <div className="space-y-1">
                      <h3 className="font-sans font-normal text-[13px] text-brand-primary tracking-normal leading-snug group-hover:text-brand-secondary transition-colors line-clamp-1">
                        {product.name}
                      </h3>

                      <div className="flex items-baseline gap-1.5 font-sans text-xs text-brand-secondary font-medium">
                        <span>₦{(product?.price ?? 0).toLocaleString()}</span>
                        {(product?.originalPrice ?? 0) > (product?.price ?? 0) && (
                          <span className="font-sans text-[9px] text-brand-secondary/40 line-through">
                            ₦{(product?.originalPrice ?? 0).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[8px] font-mono text-neutral-400 uppercase tracking-widest pt-0.5">
                        <span>{product.category}</span>
                        <span>&bull;</span>
                        <span className="font-semibold text-neutral-500">{product.sellerHall}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. SLIDE-OVER PREMIUM FILTER DRAWER (UNIFIED DESKTOP & MOBILE) */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden" id="filter-drawer-container">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black transition-opacity"
              onClick={() => setIsFilterOpen(false)}
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="pointer-events-auto w-screen max-w-md bg-brand-bg border-l border-brand-border/40"
                id="filter-drawer-panel"
              >
                <div className="flex h-full flex-col bg-brand-bg shadow-2xl overflow-hidden">
                  
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between border-b border-brand-border px-6 py-5 bg-brand-card">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal size={14} className="text-brand-primary" />
                      <h2 className="text-sm font-mono tracking-widest uppercase font-bold text-brand-primary">FILTER & SORT</h2>
                    </div>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="rounded p-1.5 text-brand-primary border border-brand-border hover:bg-brand-secondary hover:text-brand-bg transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Drawer Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 text-left">
                    
                    {/* Reset button at top */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleResetFilters}
                        className="text-[9px] font-mono tracking-widest uppercase text-neutral-500 hover:text-brand-primary transition-colors flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <RotateCcw size={10} />
                        Reset All Filters
                      </button>
                    </div>

                    {/* Condition Filter */}
                    <div>
                      <h3 className="text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-brand-secondary mb-4 border-b border-brand-border/10 pb-1">Item Condition</h3>
                      <div className="space-y-3">
                        {conditions.map((cond) => (
                          <label key={cond} className="flex items-center gap-3 cursor-pointer text-xs text-brand-primary select-none font-sans group">
                            <input
                              type="radio"
                              name="drawerCondition"
                              checked={selectedCondition === cond}
                              onChange={() => setSelectedCondition(cond)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-none border flex items-center justify-center transition-all duration-200 ${
                              selectedCondition === cond 
                                ? 'border-brand-secondary bg-brand-secondary' 
                                : 'border-brand-border bg-brand-bg group-hover:border-brand-secondary'
                            }`}>
                              {selectedCondition === cond && <div className="w-1.5 h-1.5 bg-brand-bg" />}
                            </div>
                            <span className={selectedCondition === cond ? 'font-bold text-brand-primary font-mono tracking-wider text-[11px]' : 'text-brand-secondary text-xs'}>
                              {cond === 'All' ? 'ANY CONDITION' : cond.toUpperCase()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Max Price Range Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-brand-border/10 pb-1">
                        <h3 className="text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-brand-secondary">Max Price</h3>
                        <span className="font-mono text-xs font-bold text-brand-primary">₦{(maxPrice ?? 0).toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="1000"
                        max="10000"
                        step="500"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-full accent-brand-secondary cursor-pointer bg-brand-border h-1 rounded-none"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-brand-secondary/60 mt-2">
                        <span>₦1,000</span>
                        <span>₦10,000</span>
                      </div>
                    </div>

                    {/* Color style filter */}
                    <div>
                      <h3 className="text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-brand-secondary mb-4 border-b border-brand-border/10 pb-1">Color Style</h3>
                      <div className="flex flex-wrap gap-2">
                        {colors.map((col) => (
                          <button
                            key={col}
                            onClick={() => setSelectedColor(col)}
                            className={`px-3 py-1.5 rounded-none text-[10px] font-mono tracking-wider uppercase border transition-all duration-200 cursor-pointer ${
                              selectedColor === col
                                ? 'bg-brand-secondary text-brand-bg border-brand-secondary font-bold'
                                : 'bg-brand-bg text-brand-primary border-brand-border hover:border-brand-secondary'
                            }`}
                          >
                            {col === 'All' ? 'All' : col}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rating filter */}
                    <div>
                      <h3 className="text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-brand-secondary mb-4 border-b border-brand-border/10 pb-1">Seller Rating</h3>
                      <div className="space-y-3">
                        {[0, 4, 4.5, 4.8].map((rating) => (
                          <label key={rating} className="flex items-center gap-3 cursor-pointer text-xs text-brand-primary select-none font-sans group">
                            <input
                              type="radio"
                              name="drawerRating"
                              checked={minRating === rating}
                              onChange={() => setMinRating(rating)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-none border flex items-center justify-center transition-all duration-200 ${
                              minRating === rating
                                ? 'border-brand-secondary bg-brand-secondary'
                                : 'border-brand-border bg-brand-bg group-hover:border-brand-secondary'
                            }`}>
                              {minRating === rating && <Check size={11} className="text-brand-bg" strokeWidth={3} />}
                            </div>
                            <span className={minRating === rating ? 'font-bold text-brand-primary font-mono tracking-wider text-[11px]' : 'text-brand-secondary text-xs'}>
                              {rating === 0 ? 'ANY RATING' : `${rating}★ & ABOVE`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Availability check */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer text-xs text-brand-primary select-none font-sans group">
                        <input
                          type="checkbox"
                          checked={onlyInStock}
                          onChange={() => setOnlyInStock(!onlyInStock)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-none border flex items-center justify-center transition-all duration-200 ${
                          onlyInStock
                            ? 'border-brand-secondary bg-brand-secondary'
                            : 'border-brand-border bg-brand-bg group-hover:border-brand-secondary'
                        }`}>
                          {onlyInStock && <Check size={11} className="text-brand-bg" strokeWidth={3} />}
                        </div>
                        <span className={onlyInStock ? 'font-bold text-brand-primary font-mono tracking-wider text-[11px]' : 'text-brand-secondary text-xs'}>
                          HIDE OUT OF STOCK
                        </span>
                      </label>
                    </div>

                  </div>

                  {/* Drawer Footer */}
                  <div className="border-t border-brand-border p-6 bg-brand-card flex gap-4">
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="flex-1 py-3 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-mono tracking-widest uppercase text-[10px] font-bold rounded transition-colors cursor-pointer text-center"
                    >
                      APPLY FILTERS
                    </button>
                  </div>

                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
