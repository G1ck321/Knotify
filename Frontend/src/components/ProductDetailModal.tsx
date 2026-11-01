import { useRef, useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  CheckCircle, 
  Truck,
  Eye,
  Camera,
  Loader2,
  Send
} from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import TiePlaceholder from './TiePlaceholder';
import { getStoredUser } from '../lib/authStorage';
import { PIC_FEE, createPicRequest, type PicRequestResult } from '../lib/picRequests';

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
  const [isHighlighted, setIsHighlighted] = useState(false);
  // Eye-icon lightbox: the catalog crops ties to a 10:6 frame, so the logo at
  // the blade tip is cut off. This shows the whole tie, uncropped.
  const [showFullImage, setShowFullImage] = useState(false);
  // Feature C: knotted-tie-pic request (+₦150, 48-hour hold).
  const [picBusy, setPicBusy] = useState(false);
  // Yes/No confirmation dialog for the pic request (has its own X button).
  const [showPicConfirm, setShowPicConfirm] = useState(false);
  const [picError, setPicError] = useState('');
  const [picResult, setPicResult] = useState<PicRequestResult | null>(null);

  const price = product?.price ?? product?.originalPrice ?? 0;
  // Reservations are 100% prepaid, so the "deposit" is the full price and
  // nothing is left outstanding. The old `product.deposit` field is never
  // populated, which is why the modal rendered a ₦0 deposit with the whole
  // price still "due".
  const deposit = price;
  const outstandingBalance = 0;

  // Discount as a whole percentage. "HOT" is a rule, not a hand-picked list:
  // any tie discounted by MORE than 27% earns it (see Marketplace.tsx, same rule).
  const discountPercent =
    product.originalPrice > 0
      ? Math.round(
          ((product.originalPrice - price) / product.originalPrice) * 100
        )
      : 0;
  const isHot = discountPercent > 27;

  const handlePicRequest = async () => {
    // Second tap just re-opens the same one-time link: no duplicate fee, no
    // duplicate hold (the backend is idempotent per device + tie).
    if (picResult?.deep_link) {
      window.open(picResult.deep_link, '_blank', 'noopener,noreferrer');
      return;
    }

    setPicBusy(true);
    setPicError('');
    try {
      const storedUser = getStoredUser<{ email?: string }>();
      const result = await createPicRequest({
        tieId: product.id,
        email: storedUser?.email,
      });
      setPicResult(result);
      if (result.deep_link) {
        window.open(result.deep_link, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      setPicError(
        error instanceof Error ? error.message : 'Could not request the pic'
      );
    } finally {
      setPicBusy(false);
    }
  };

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

  // Target of the "Request Pic" link: same pattern as the Reserve Now anchor.
  const picTargetRef = useRef<HTMLButtonElement | null>(null);

  // One entry point for both triggers: scroll to the request-pic button and
  // open the "Are you sure? Yes / No" confirmation dialog.
  const openPicConfirm = () => {
    picTargetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setShowPicConfirm(true);
  };

  const confirmPicRequest = () => {
    setShowPicConfirm(false);
    handlePicRequest();
  };
  //scroll to reserve button
  //create the ref
  const targetRef = useRef<HTMLDivElement | null>(null)  
  //target the 
  const handleScroll = () => {
    //access the DOM node via .current then scroll to it.
    if (targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
       setIsHighlighted(true);

    setTimeout(() => {
      setIsHighlighted(false);
    }, 1000); // Highlight for 3 seconds
    }
  }

  // const scrollReserve = () => {
  //   if (reserveclick === 0) {
  //     setReserveClick(1)
  //     window.scrollTo({ top: 400, behavior: 'smooth' })
  //   }
  //   else {
  //     setReserveClick(0)
      
  //     window.scrollTo({ top: 400, behavior: 'smooth' })
  //   }
  // }

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
            <div className="aspect-[10/6] w-full rounded overflow-hidden border border-brand-border bg-brand-bg relative">
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

              {/* Request Pic trigger — replaces the old chapel-compliance badge.
                  Mirrors the Reserve Now anchor: scrolls to the request-pic
                  button and opens the confirmation dialog. */}
              <a
                onClick={() => openPicConfirm()}
                className="absolute top-4 left-4 z-10 text-white cursor-pointer bg-green-800 hover:bg-green-700 font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 rounded shadow border border-brand-border flex items-center gap-1 transition-colors"
                id="link-request-pic"
              >
                <Camera size={10} /> Request Pic
              </a>
              {isHot ? (

                <div className="absolute top-8 text-white right-4 bg-rose-500 font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 font-bold rounded shadow border border-brand-border flex items-center gap-1 ">
                  HOT
              </div>
                ) : null}
              
              

                {/* <a href='#btn-modal-buy-now' className="absolute top-13 text-white left-4 cursor-pointer bg-green-800 font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 font-bold rounded shadow border border-brand-border flex items-center gap-1 "> */}
                <a onClick={()=>handleScroll()} className="absolute top-13 text-white left-4 cursor-pointer bg-green-800 font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 font-bold rounded shadow border border-brand-border flex items-center gap-1 ">
                 ₦ Re$erve Now
              </a>

              {/* Eye icon: view the WHOLE tie so the logo/blade tip is visible */}
              {product.image ? (
                <button
                  onClick={() => setShowFullImage(true)}
                  className="absolute top-5 right-16 z-20 p-2 text-brand-primary rounded border border-brand-border bg-brand-bg hover:bg-brand-secondary hover:text-brand-bg transition-colors cursor-pointer"
                  aria-label="View full tie image"
                  id="btn-view-full-tie"
                >
                  <Eye size={16} />
                </button>
              ) : null}
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
                        Pay the full ₦{deposit.toLocaleString()} today to reserve your tie. We handle ironed preparation, custom ziplock pouching, and stock assignment.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 bg-brand-bg p-4 rounded border border-brand-border">
                    <CheckCircle size={16} className="text-brand-secondary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-primary">2. Hall Resumption Delivery</h4>
                      <p className="text-[11px] text-brand-primary/80 mt-1 font-sans leading-relaxed">
                        Go to your profile and selct your hall and room number & stay connected to the communities  to get <strong>
                        Knotified
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1" id="faqs-tab-content">
                  <div className="p-3 bg-brand-bg rounded border border-brand-border text-left">
                    <p className="text-[11px] font-mono text-brand-primary uppercase tracking-wider font-bold">Do I pay the full amount now?</p>
                    <p className="text-xs text-brand-primary/80 font-sans mt-1">Yes — reservations are 100% prepaid, so the full ₦{deposit.toLocaleString()} is paid now and nothing remains outstanding. Your tie is then prepared and held for pickup.</p>
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
          <div className="space-y-4 text-left my-auto">
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
                  RESERVATION DEPOSIT (100%)
                </span>
                <span className="font-sans text-xl font-black text-brand-primary">
                  ₦{deposit.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-brand-secondary uppercase block tracking-widest mb-1">
                  OUTSTANDING BALANCE
                </span>
                <span className="font-sans text-xl font-semibold text-brand-secondary">
                  ₦{outstandingBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Total Price Tracker */}
            <div className="bg-brand-card px-4 py-3 rounded border border-brand-border flex justify-between items-center">
              <span className="text-[9px] font-mono text-brand-secondary uppercase tracking-wider">Total Value</span>
              <span className="text-xs font-sans font-bold text-brand-primary">₦{(product?.price ?? product?.originalPrice ?? 0).toLocaleString()}</span>
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
          <div className="space-y-3 pt-3 border-t border-brand-border mt-6">
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
              className={`w-full py-4 ${
    isHighlighted
      ? "bg-brand-accent text-green-200"
      : "bg-brand-primary hover:bg-brand-secondary"
  } text-brand-bg font-mono tracking-widest uppercase text-xs rounded transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer font-black shadow`}
  id="btn-modal-buy-now"
            >
              RESERVE NOW
            </button>

            {/* Feature C — knotted-tie-pic request (+₦150, 48-hour hold) */}
            <button
              ref={picTargetRef}
              onClick={() => setShowPicConfirm(true)}
              disabled={picBusy || product.stock <= 0}
              className="w-full py-4 bg-brand-bg hover:bg-brand-card text-brand-primary border border-brand-border font-mono tracking-widest uppercase text-xs rounded transition-all flex items-center justify-center gap-2 cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              id="btn-request-pic"
            >
              {picBusy ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  HOLDING TIE...
                </>
              ) : picResult ? (
                <>
                  <Send size={14} />
                  OPEN TELEGRAM DRAFT
                </>
              ) : (
                <>
                  <Camera size={14} />
                  REQUEST KNOTTED PIC (+₦{PIC_FEE})
                </>
              )}
            </button>

            {picResult ? (
              <p
                className="text-[10px] font-sans text-brand-primary/80 leading-relaxed text-center"
                id="pic-request-status"
              >
                ₦{picResult.fee} added to your bill (outstanding until you
                check out) · this tie is held for you until{' '}
                {picResult.hold_expires_at
                  ? new Date(picResult.hold_expires_at).toLocaleString('en-NG', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'up to 48 hours from now'}
                , so the pic can reach your DM in time.
              </p>
            ) : null}

            {picError ? (
              <p className="text-[10px] font-sans text-rose-400 text-center" id="pic-request-error">
                {picError}
              </p>
            ) : null}

            <div ref={targetRef} id="end"className="border-b border-brand-border mt-6"></div>
          </div>

        </div>
      </motion.div>

      {/* Full-tie lightbox (eye icon): uncropped so the logo is readable */}
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

      {/* Pic request confirmation: X to dismiss, "Are you sure?" Yes / No */}
      {showPicConfirm ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          id="pic-confirm-dialog"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPicConfirm(false)}
          />

          <div className="relative bg-brand-bg border border-brand-border rounded-xl shadow-2xl max-w-sm w-full p-6 text-left">
            <button
              onClick={() => setShowPicConfirm(false)}
              className="absolute top-3 right-3 p-2 text-brand-primary rounded border border-brand-border bg-brand-card hover:bg-brand-secondary hover:text-brand-bg transition-colors cursor-pointer"
              aria-label="Close"
              id="btn-pic-confirm-close"
            >
              <X size={14} />
            </button>

            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-brand-secondary block mb-2">
              Request knotted pic
            </span>
            <h3 className="font-serif font-bold text-lg text-brand-primary pr-6 leading-snug">
              Are you sure you want this tie held?
            </h3>
            <p className="text-xs font-sans text-brand-primary/80 leading-relaxed mt-3">
              We hold the tie for <strong>24–48 hours</strong> while the knotted
              pic is shot and sent to your <strong>DM</strong>. It costs
              <strong> ₦{PIC_FEE}</strong>, which joins your bill at checkout.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowPicConfirm(false)}
                className="flex-1 py-2.5 border border-brand-border bg-brand-card hover:bg-brand-bg text-brand-primary font-mono text-[10px] tracking-widest uppercase font-bold rounded transition-colors cursor-pointer"
                id="btn-pic-confirm-no"
              >
                No
              </button>
              <button
                onClick={confirmPicRequest}
                disabled={picBusy}
                className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-mono text-[10px] tracking-widest uppercase font-bold rounded transition-colors cursor-pointer disabled:opacity-60"
                id="btn-pic-confirm-yes"
              >
                {picBusy ? 'Holding…' : 'Yes, request it'}
              </button>
            </div>

            <p className="text-[10px] text-brand-primary/55 font-sans text-center mt-3 leading-relaxed">
              Pic requests pause automatically once 30% of our ties are already
              held for other students.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
