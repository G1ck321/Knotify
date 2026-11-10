import { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  CheckCircle,
  Sparkles,
  Eye
} from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import TiePlaceholder from './TiePlaceholder';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onToggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  onDirectBuy: (product: Product) => void;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onDirectBuy,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  // Eye-icon lightbox: the catalog crops ties to a fixed frame, so the logo at
  // the blade tip is cut off. This shows the whole tie, uncropped.
  const [showFullImage, setShowFullImage] = useState(false);

  // Fall back to the list price: many catalog entries have no discounted
  // `price`, and showing ₦0 for them was wrong.
  const price = product?.price ?? product?.originalPrice ?? 0;

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCartAndClose = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 md:p-10" id="product-detail-modal">
      {/* Background Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-brand-bg w-full max-w-4xl rounded overflow-hidden shadow-2xl border border-brand-border z-10 grid grid-cols-1 md:grid-cols-12 max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-hidden"
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 text-brand-primary rounded border border-brand-border bg-brand-bg hover:bg-brand-secondary hover:text-brand-bg transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {/* Left Side: Product Image Display */}
        <div className="md:col-span-6 bg-brand-card relative p-6 border-b md:border-b-0 md:border-r border-brand-border flex flex-col justify-center items-center">
          <div className="aspect-[4/5] w-full max-w-sm rounded-2xl overflow-hidden border border-brand-border bg-brand-bg relative shadow-sm">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover grayscale-[5%] hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
                id="detail-main-image"
              />
            ) : (
              <TiePlaceholder
                color={product.color}
                category={product.category}
                name={product.name}
                className="w-full h-full"
              />
            )}

            {/* Premium Compliance Badge */}
            <div className="absolute top-4 left-4 bg-brand-bg text-brand-primary font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 font-bold rounded shadow border border-brand-border flex items-center gap-1">
              <CheckCircle size={10} className="text-brand-secondary" />
              100% CU APPROVED
            </div>
            {(product.name === "Plain Black Tie" || product.name === "Plain Wine Tie") && (
              <div className="absolute top-4 text-white right-4 bg-rose-500 font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 font-bold rounded shadow border border-brand-border flex items-center gap-1">
                HOT
              </div>
            )}

            {/* Eye icon: view the WHOLE tie so the logo/blade tip is visible */}
            {product.image ? (
              <button
                onClick={() => setShowFullImage(true)}
                className="absolute bottom-4 right-4 z-20 p-2 text-brand-primary rounded-full border border-brand-border bg-brand-bg/90 hover:bg-brand-secondary hover:text-brand-bg transition-colors cursor-pointer"
                aria-label="View full tie image"
                id="btn-view-full-tie"
              >
                <Eye size={15} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Right Side: Clean & Simplified Purchase Configuration */}
        <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between overflow-y-visible md:overflow-y-auto max-h-none md:max-h-[80vh]" id="detail-panel-right">
          <div className="space-y-5 text-left my-auto">
            <div>
              {/* Category label */}
              <span className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-brand-secondary block mb-1">
                {product.category}
              </span>

              {/* Product Title */}
              <h2 className="font-serif font-bold text-2xl uppercase text-brand-primary leading-tight">
                {product.name}
              </h2>
            </div>

            {/* Material info */}
            {product.materials && (
              <div className="bg-brand-card p-4 rounded-xl border border-brand-border">
                <span className="text-[9px] font-mono text-brand-secondary uppercase block tracking-widest mb-1 font-bold">
                  Material Information
                </span>
                <p className="text-[11px] text-brand-primary/80 leading-relaxed font-sans">
                  {product.materials}
                </p>
              </div>
            )}

            {/* Price Display */}
            <div className="bg-brand-card p-4 rounded-xl border border-brand-border flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-brand-secondary tracking-widest font-bold">Price</span>
              <span className="font-sans text-2xl font-black text-brand-primary">₦{price.toLocaleString()}</span>
            </div>

            {/* Minimal Quantity Selector */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider font-bold">
                Quantity
              </span>
              <div className="flex items-center border border-brand-border bg-brand-bg py-1 px-3 rounded-full">
                <button
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="w-7 h-7 flex items-center justify-center font-sans text-sm text-brand-primary disabled:opacity-20 cursor-pointer hover:bg-black/5 rounded-full"
                >
                  -
                </button>
                <span className="w-10 text-center font-sans text-xs font-bold text-brand-primary">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  disabled={quantity >= product.stock}
                  className="w-7 h-7 flex items-center justify-center font-sans text-sm text-brand-primary disabled:opacity-20 cursor-pointer hover:bg-black/5 rounded-full"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Purchase Buttons */}
          <div className="space-y-3 pt-6 border-t border-brand-border mt-6">
            <button
              onClick={handleAddToCartAndClose}
              className="w-full py-3.5 bg-brand-bg hover:bg-brand-card text-brand-primary border border-brand-border font-sans tracking-wider uppercase text-xs rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer font-bold shadow-xs active:scale-98"
              id="btn-modal-add-cart"
            >
              <ShoppingBag size={14} />
              ADD TO BAG
            </button>
            
            <button
              onClick={() => {
                onDirectBuy(product);
                onClose();
              }}
              className="w-full py-3.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-sans tracking-wider uppercase text-xs rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer font-bold shadow-sm active:scale-98"
              id="btn-modal-buy-now"
            >
              <Sparkles size={14} />
              RESERVE NOW
            </button>
          </div>

        </div>
      </motion.div>

      {/* Full-tie lightbox */}
      {showFullImage && product.image ? (
        <div
          className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center p-4 sm:p-8"
          onClick={() => setShowFullImage(false)}
          id="full-tie-lightbox"
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-5 right-5 p-2 text-white rounded border border-white/30 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close full view"
          >
            <X size={18} />
          </button>
          <img
            src={product.image}
            alt={product.name}
            className="max-h-[82vh] max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
          <p className="mt-4 font-mono text-[10px] tracking-widest uppercase text-brand-primary/70 text-center">
            {product.name} — full view
          </p>
        </div>
      ) : null}
    </div>
  );
}
