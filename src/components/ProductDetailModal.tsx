import { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  CheckCircle, 
  Truck
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
  const [activeTab, setActiveTab] = useState<'info' | 'faqs'>('info');

  const price = product?.price ?? 0;
  const deposit = product?.deposit ?? 0;
  const outstandingBalance = price - deposit;

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

        {/* Left Side: Product Image Display & Specs/Tabs */}
        <div className="md:col-span-6 bg-brand-card relative p-6 border-b md:border-b-0 md:border-r border-brand-border flex flex-col justify-between overflow-y-visible md:overflow-y-auto max-h-none md:max-h-[80vh]">
          <div className="space-y-6">
            <div className="aspect-[4/5] w-full rounded overflow-hidden border border-brand-border bg-brand-bg relative">
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
                CHAPEL COMPLIANT
              </div>
            </div>

            {/* TAB SELECTORS: Pickup Info vs FAQs */}
            <div className="flex border-b border-brand-border text-xs font-mono tracking-widest uppercase">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-2 pr-4 border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'info' ? 'border-brand-secondary text-brand-secondary font-bold' : 'border-transparent text-brand-primary/60 hover:text-brand-primary'
                }`}
              >
                Pickup Process
              </button>
              <button
                onClick={() => setActiveTab('faqs')}
                className={`py-2 px-4 border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'faqs' ? 'border-brand-secondary text-brand-secondary font-bold' : 'border-transparent text-brand-primary/60 hover:text-brand-primary'
                }`}
              >
                FAQs
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="text-left">
              {activeTab === 'info' ? (
                <div className="space-y-4" id="pickup-tab-content">
                  <div className="flex gap-3 bg-brand-bg p-4 rounded border border-brand-border">
                    <Truck size={16} className="text-brand-secondary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-primary">1. Secure Reservation</h4>
                      <p className="text-[11px] text-brand-primary/80 mt-1 font-sans leading-relaxed">
                        Pay a safe deposit of ₦{(product?.deposit ?? 0).toLocaleString()} today. We handle ironed preparation, custom ziplock pouching, and stock assignment.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 bg-brand-bg p-4 rounded border border-brand-border">
                    <CheckCircle size={16} className="text-brand-secondary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-primary">2. Hall Resumption Delivery</h4>
                      <p className="text-[11px] text-brand-primary/80 mt-1 font-sans leading-relaxed">
                        Walk to your assigned pickup station near your Residence Hall. Verify your physical tie packaging before paying the outstanding balance.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1" id="faqs-tab-content">
                  <div className="p-3 bg-brand-bg rounded border border-brand-border text-left">
                    <p className="text-[11px] font-mono text-brand-primary uppercase tracking-wider font-bold">Do I pay the full amount now?</p>
                    <p className="text-xs text-brand-primary/80 font-sans mt-1">No, pay only the ₦{(product?.deposit ?? 0).toLocaleString()} reservation deposit to secure your tie. The remaining balance is paid upon resumption pickup.</p>
                  </div>
                  <div className="p-3 bg-brand-bg rounded border border-brand-border text-left">
                    <p className="text-[11px] font-mono text-brand-primary uppercase tracking-wider font-bold">Where do I collect my order?</p>
                    <p className="text-xs text-brand-primary/80 font-sans mt-1">We operate multiple stations close to the male/female halls during resumption week. You will receive an email/WhatsApp with your assigned coordinates.</p>
                  </div>
                  <div className="p-3 bg-brand-bg rounded border border-brand-border text-left">
                    <p className="text-[11px] font-mono text-brand-primary uppercase tracking-wider font-bold">Is this tie strictly chapel compliant?</p>
                    <p className="text-xs text-brand-primary/80 font-sans mt-1">Yes, our plain ties meet all official Covenant University rules for Wednesday and Sunday Chapel services perfectly.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Simple Luxury Product Meta & Purchase Configuration */}
        <div className="md:col-span-6 p-8 flex flex-col justify-between overflow-y-visible md:overflow-y-auto max-h-none md:max-h-[80vh]" id="detail-panel-right">
          <div className="space-y-6 text-left my-auto">
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
            <div className="bg-brand-card p-4 rounded border border-brand-border">
              <span className="text-[9px] font-mono text-brand-secondary uppercase block tracking-widest mb-1 font-bold">
                Material Information
              </span>
              <p className="text-[11px] text-brand-primary/80 leading-relaxed font-sans">
                {product.materials}
              </p>
            </div>

            {/* Pricing Details */}
            <div className="pt-2 border-t border-brand-border grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-mono text-brand-secondary uppercase block tracking-widest mb-1">
                  RESERVATION DEPOSIT
                </span>
                <span className="font-sans text-xl font-black text-brand-primary">
                  ₦{(product?.deposit ?? 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-brand-secondary uppercase block tracking-widest mb-1">
                  OUTSTANDING BALANCE
                </span>
                <span className="font-sans text-xl font-semibold text-brand-secondary">
                  ₦{(outstandingBalance ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Total Price Tracker */}
            <div className="bg-brand-card px-4 py-3 rounded border border-brand-border flex justify-between items-center">
              <span className="text-[9px] font-mono text-brand-secondary uppercase tracking-wider">Total Value</span>
              <span className="text-xs font-sans font-bold text-brand-primary">₦{(product?.price ?? 0).toLocaleString()}</span>
            </div>

            {/* Minimal Quantity Selector */}
            <div className="flex items-center justify-between pt-4 border-t border-brand-border">
              <span className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider">
                Quantity
              </span>
              <div className="flex items-center border border-brand-border bg-brand-bg py-1 px-3 rounded">
                <button
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="w-6 h-6 flex items-center justify-center font-sans text-sm text-brand-primary disabled:opacity-20 cursor-pointer"
                >
                  -
                </button>
                <span className="w-10 text-center font-sans text-xs font-bold text-brand-primary">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  disabled={quantity >= product.stock}
                  className="w-6 h-6 flex items-center justify-center font-sans text-sm text-brand-primary disabled:opacity-20 cursor-pointer"
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
              className="w-full py-4 bg-brand-bg hover:bg-brand-card text-brand-primary border border-brand-border font-mono tracking-widest uppercase text-xs rounded transition-all flex items-center justify-center gap-2 cursor-pointer font-bold"
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
              className="w-full py-4 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-mono tracking-widest uppercase text-xs rounded transition-all flex items-center justify-center gap-1 cursor-pointer font-black shadow"
              id="btn-modal-buy-now"
            >
              RESERVE NOW
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
