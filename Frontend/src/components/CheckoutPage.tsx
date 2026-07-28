import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  CheckCircle, 
  ArrowRight, 
  User, 
  Phone, 
  Home, 
  Mail,
  ShieldCheck,
  Clipboard,
  Check,
  ArrowLeft,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, COVENANT_HALLS } from '../types';
import TiePlaceholder from './TiePlaceholder';

interface CheckoutPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onAddReservation: (reservation: any) => void;
  currentUser: any;
  onOpenAuth: () => void;
  onContinueShopping: () => void;
}

export default function CheckoutPage({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onAddReservation,
  currentUser,
  onOpenAuth,
  onContinueShopping,
}: CheckoutPageProps) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'form' | 'success'>('cart');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerHall, setBuyerHall] = useState(COVENANT_HALLS[0] || 'Daniel Hall');
  const [copiedId, setCopiedId] = useState(false);
  const [generatedId, setGeneratedId] = useState('');

  // Pre-fill user details if logged in
  useEffect(() => {
    if (currentUser) {
      setBuyerName(currentUser.name || '');
      setBuyerPhone(currentUser.telegramPhone || '');
      setBuyerEmail(currentUser.email || '');
    }
  }, [currentUser]);

  // Pricing calculations
  const totalItems = cartItems.reduce((acc, item) => acc + (item?.quantity ?? 0), 0);
  const totalValue = cartItems.reduce((acc, item) => acc + (item?.product?.price ?? 0) * (item?.quantity ?? 0), 0);
  const totalDeposit = cartItems.reduce((acc, item) => acc + (item?.product?.deposit ?? 0) * (item?.quantity ?? 0), 0);
  const outstandingBalance = totalValue - totalDeposit;

  // Determine assigned pickup point based on residence hall
  const getAssignedPickupPoint = (hall: string) => {
    if (hall === 'Daniel Hall' || hall === 'Joseph Hall') {
      return 'Pickup Point A (Near Joseph Hall)';
    } else if (hall === 'Peter Hall' || hall === 'Paul Hall') {
      return 'Pickup Point B (Near Paul Hall)';
    } else if (hall === 'Esther Hall') {
      return 'Pickup Point C (Near Esther Hall Entrance)';
    } else if (hall === 'Lydia Hall' || hall === 'Mary Hall') {
      return 'Pickup Point D (Near Lydia Hall Entrance)';
    }
    return 'Main Administration Station';
  };

  const handleStartCheckout = () => {
    if (cartItems.length > 0) {
      if (!currentUser) {
        onOpenAuth();
      } else {
        setCheckoutStep('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (buyerName && buyerPhone) {
      const uniqueId = `KNT-2027-${Math.floor(10000 + Math.random() * 90000)}`;
      setGeneratedId(uniqueId);

      const preferredColor = cartItems.map(item => item.product.color).join(', ');
      const productNames = cartItems.map(item => `${item.product.name} (x${item.quantity})`).join(', ');

      const pickupPoint = getAssignedPickupPoint(buyerHall);

      onAddReservation({
        id: uniqueId,
        name: buyerName,
        phone: buyerPhone,
        email: buyerEmail || undefined,
        color: preferredColor,
        quantity: totalItems,
        hall: buyerHall,
        productNames: productNames,
        deposit: totalDeposit,
        outstanding: outstandingBalance,
        status: 'Reserved',
        pickupPoint: pickupPoint,
        dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });

      setCheckoutStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleFinished = () => {
    onClearCart();
    onContinueShopping();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left animate-fadeIn" id="full-page-checkout">
      
      {/* 1. PROGRESS BARS / HEADER */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-border pb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-brand-primary uppercase tracking-tight">
            Reservation Hub
          </h1>
          <p className="text-xs text-brand-secondary/85 mt-1 font-sans">
            Secure premium, chapel-compliant ties with zero stress.
          </p>
        </div>

        {/* Step Indicator Indicators */}
        {checkoutStep !== 'success' && (
          <div className="flex items-center gap-2 text-[10px] font-sans tracking-widest uppercase">
            <button 
              onClick={() => cartItems.length > 0 && setCheckoutStep('cart')}
              className={`px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                checkoutStep === 'cart' 
                  ? 'bg-brand-secondary text-brand-bg border-brand-secondary font-bold shadow-sm' 
                  : 'bg-brand-card text-brand-primary/60 border-brand-border hover:text-brand-primary'
              }`}
            >
              01 BAG
            </button>
            <div className="h-px w-6 bg-brand-border"></div>
            <button 
              disabled={cartItems.length === 0}
              onClick={handleStartCheckout}
              className={`px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                checkoutStep === 'form' 
                  ? 'bg-brand-secondary text-brand-bg border-brand-secondary font-bold shadow-sm' 
                  : 'bg-brand-card text-brand-primary/60 border-brand-border hover:text-brand-primary disabled:opacity-40'
              }`}
            >
              02 DETAILS
            </button>
            <div className="h-px w-6 bg-brand-border"></div>
            <span className="px-3.5 py-1.5 rounded-full border bg-brand-card text-brand-primary/30 border-brand-border/60">
              03 CONFIRMED
            </span>
          </div>
        )}
      </div>

      {/* 2. CHOSEN CONTENT GRID OR EMPTY STATE */}
      {cartItems.length === 0 && checkoutStep !== 'success' ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-brand-card border border-brand-border rounded-3xl p-8 max-w-xl mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center text-brand-secondary mb-5">
            <ShoppingBag size={24} />
          </div>
          <h3 className="font-sans tracking-widest uppercase font-bold text-sm text-brand-primary">YOUR BAG IS EMPTY</h3>
          <p className="text-xs text-brand-secondary/80 mt-2 max-w-sm leading-relaxed font-sans">
            You don't have any reservations queued up yet. Browse the marketplace collection to secure your chapel attire.
          </p>
          <button
            onClick={onContinueShopping}
            className="mt-6 px-6 py-3 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-sans tracking-widest uppercase text-[11px] font-bold rounded-full transition-all cursor-pointer"
          >
            Explore Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE CONTENT: Step screens */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              
              {/* SCREEN 1: SHOPPING BAG ITEMS LIST */}
              {checkoutStep === 'cart' && (
                <motion.div
                  key="cart-step"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.25 }}
                  className="bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6 border-b border-brand-border pb-4">
                    <h2 className="text-xs font-sans tracking-widest uppercase font-bold text-brand-secondary flex items-center gap-2">
                      <ShoppingBag size={14} className="text-brand-secondary" />
                      Queued Reservations ({cartItems.length})
                    </h2>
                    <button 
                      onClick={onClearCart}
                      className="text-[10px] font-sans text-brand-primary/60 hover:text-red-600 transition-colors uppercase font-bold cursor-pointer bg-transparent border-none"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="divide-y divide-brand-border">
                    {cartItems.map((item) => (
                      <div key={item.product.id} className="flex py-6 gap-4 sm:gap-6 text-left" id={`page-cart-item-${item.product.id}`}>
                        <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-brand-border bg-brand-bg">
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="h-full w-full object-cover grayscale-[5%] hover:grayscale-0 transition-all duration-300"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <TiePlaceholder
                              color={item.product.color}
                              category={item.product.category}
                              name={item.product.name}
                              className="w-full h-full"
                            />
                          )}
                        </div>

                        <div className="flex flex-1 flex-col justify-between">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <h4 className="text-sm font-bold font-sans text-brand-primary uppercase tracking-tight">
                                {item.product.name}
                              </h4>
                              <p className="text-[10px] text-emerald-800 font-sans mt-0.5 font-semibold">
                                Verified Seller: {item.product.seller}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-[9px] font-sans bg-brand-bg border border-brand-border px-2 py-0.5 text-brand-primary/70 uppercase font-semibold">
                                  {item.product.category}
                                </span>
                                <span className="text-[9px] font-sans bg-brand-secondary/10 border border-brand-secondary/20 px-2 py-0.5 text-brand-secondary uppercase font-semibold">
                                  Deposit required: ₦{(item.product.deposit).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="sm:text-right flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-1">
                              <span className="font-sans text-sm font-bold text-brand-primary">
                                ₦{((item.product.price) * (item.quantity)).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-brand-primary/60 font-sans hidden sm:block">
                                (₦{item.product.price.toLocaleString()} each)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-border">
                            <span className="text-[10px] font-sans text-brand-secondary uppercase font-semibold">
                              In Stock: {item.product.stock} Units
                            </span>

                            <div className="flex items-center gap-4">
                              {/* Quantity Selector */}
                              <div className="flex items-center border border-brand-border bg-brand-bg py-1 px-1.5 rounded-full">
                                <button
                                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                  className="w-6 h-6 flex items-center justify-center font-sans text-xs text-brand-primary disabled:opacity-30 hover:bg-brand-card rounded-full transition-colors cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-sans text-[12px] font-bold text-brand-primary">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center font-sans text-xs text-brand-primary disabled:opacity-30 hover:bg-brand-card rounded-full transition-colors cursor-pointer"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={() => onRemoveItem(item.product.id)}
                                className="p-2 text-brand-primary/40 hover:text-red-600 hover:bg-brand-bg rounded-xl transition-all cursor-pointer"
                                title="Remove Item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-brand-border flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <button
                      onClick={onContinueShopping}
                      className="text-xs font-sans font-bold text-brand-secondary hover:text-brand-primary uppercase tracking-wider flex items-center gap-2 cursor-pointer bg-transparent border-none"
                    >
                      <ArrowLeft size={14} />
                      Back to Shop
                    </button>

                    <button
                      onClick={handleStartCheckout}
                      className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-sans tracking-widest uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      PROCEED TO DETAILS
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* SCREEN 2: CUSTOMER DETAILS FORM */}
              {checkoutStep === 'form' && (
                <motion.div
                  key="form-step"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.25 }}
                  className="bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 shadow-sm"
                >
                  <div className="mb-6 border-b border-brand-border pb-4">
                    <button 
                      onClick={() => setCheckoutStep('cart')}
                      className="text-[10px] font-sans text-brand-primary/60 hover:text-brand-primary transition-colors uppercase font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none"
                    >
                      <ArrowLeft size={12} />
                      Go Back to Bag
                    </button>
                    <h2 className="text-sm font-display font-black uppercase text-brand-primary mt-4 tracking-tight">
                      Reservation Details
                    </h2>
                    <p className="text-xs text-brand-secondary mt-1 font-sans">
                      Complete your local student file. We will package your tie and designate a direct residence hall coordinate.
                    </p>
                  </div>

                  <form onSubmit={handleConfirmReservation} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Name input */}
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-brand-secondary uppercase tracking-widest mb-1.5">
                          FULL NAME
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/45">
                            <User size={13} />
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Daniel Adebayo"
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                            className="w-full pl-9 pr-4 py-3.5 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border border-brand-border focus:border-brand-secondary focus:outline-none transition-all uppercase"
                          />
                        </div>
                      </div>

                      {/* Phone input */}
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-brand-secondary uppercase tracking-widest mb-1.5">
                          PHONE / WHATSAPP NUMBER
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/45">
                            <Phone size={13} />
                          </span>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. 08012345678"
                            value={buyerPhone}
                            onChange={(e) => setBuyerPhone(e.target.value)}
                            className="w-full pl-9 pr-4 py-3.5 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border border-brand-border focus:border-brand-secondary focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Email input (optional) */}
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-brand-secondary uppercase tracking-widest mb-1.5">
                          EMAIL ADDRESS (OPTIONAL)
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/45">
                            <Mail size={13} />
                          </span>
                          <input
                            type="email"
                            placeholder="e.g. daniel@student.covenant.edu.ng"
                            value={buyerEmail}
                            onChange={(e) => setBuyerEmail(e.target.value)}
                            className="w-full pl-9 pr-4 py-3.5 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border border-brand-border focus:border-brand-secondary focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Residence Hall Selector */}
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-brand-secondary uppercase tracking-widest mb-1.5">
                          RESIDENCE HALL
                        </label>
                        <select
                          value={buyerHall}
                          onChange={(e) => setBuyerHall(e.target.value)}
                          className="w-full px-4 py-3.5 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border border-brand-border focus:border-brand-secondary focus:outline-none transition-all cursor-pointer"
                        >
                          {COVENANT_HALLS.map((hall) => (
                            <option key={hall} value={hall}>
                              {hall}
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>

                    <div className="bg-brand-bg p-4.5 rounded-2xl border border-brand-border text-[11px] text-brand-primary/80 font-sans leading-relaxed">
                      <p className="font-bold text-brand-primary mb-1 flex items-center gap-1.5">
                        <Info size={13} className="text-brand-secondary" />
                        Direct Hall Routing
                      </p>
                      Selecting your hall matches you to your closest campus pickup station (e.g. <strong>{getAssignedPickupPoint(buyerHall)}</strong>) ensuring you skip lines during resumption week completely.
                    </div>

                    <div className="pt-4 border-t border-brand-border flex flex-col sm:flex-row gap-4 justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setCheckoutStep('cart')}
                        className="text-xs font-sans font-bold text-brand-secondary hover:text-brand-primary uppercase tracking-wider flex items-center gap-2 cursor-pointer bg-transparent border-none"
                      >
                        <ArrowLeft size={14} />
                        Review Bag Items
                      </button>

                      <button
                        type="submit"
                        className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-sans tracking-widest uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        CONFIRM RESERVATION
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* SCREEN 3: SUCCESS CONFIRMED STAGE */}
              {checkoutStep === 'success' && (
                <motion.div
                  key="success-step"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-10 shadow-md space-y-8 relative overflow-hidden"
                >
                  {/* Subtle Glow decoration */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-secondary/[0.03] rounded-full filter blur-[80px] pointer-events-none" />

                  {/* Header confirmation */}
                  <div className="text-center max-w-lg mx-auto space-y-4 relative z-10">
                    <div className="w-14 h-14 rounded-full bg-brand-secondary/10 border border-brand-secondary/30 flex items-center justify-center text-brand-secondary mx-auto">
                      <CheckCircle size={28} />
                    </div>

                    <h2 className="font-display font-black text-2xl sm:text-3xl uppercase text-brand-primary tracking-tight">
                      Tie is Reserved
                    </h2>
                    
                    <p className="text-xs sm:text-sm text-brand-primary/80 font-sans leading-relaxed">
                      Congratulations <strong>{buyerName}</strong>! Your tie reservation has been logged under our student guild registry.
                    </p>
                  </div>

                  {/* High-End Coordinates Panel */}
                  <div className="bg-brand-bg border border-brand-border rounded-2xl p-6 space-y-5 relative z-10">
                    
                    {/* Unique reservation ID header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-border pb-4 gap-3">
                      <div>
                        <span className="text-[9px] font-sans text-brand-primary/50 block tracking-widest uppercase font-semibold">REGISTRATION NUMBER</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-sans text-base font-bold text-brand-primary tracking-wider">{generatedId}</span>
                          <button 
                            onClick={copyToClipboard}
                            className="p-1.5 bg-brand-card border border-brand-border rounded-lg hover:text-brand-secondary hover:bg-brand-bg transition-colors text-brand-primary cursor-pointer"
                            title="Copy ID"
                          >
                            {copiedId ? <Check size={13} className="text-emerald-700" /> : <Clipboard size={13} />}
                          </button>
                        </div>
                      </div>

                      <div className="bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary px-4 py-2 rounded-xl text-center">
                        <span className="text-[9px] font-sans block tracking-wider uppercase font-semibold">DEPOSIT RECEIVED</span>
                        <span className="font-sans text-base font-extrabold">₦{totalDeposit.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Meta coordinates breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 text-xs font-sans uppercase text-brand-secondary">
                      <div className="bg-brand-card p-3.5 rounded-xl border border-brand-border text-left">
                        <p className="text-[9px] text-brand-primary/50 tracking-wider font-semibold">RESIDENCE COORD</p>
                        <p className="text-brand-primary font-bold text-xs mt-1">{buyerHall}</p>
                      </div>

                      <div className="bg-brand-card p-3.5 rounded-xl border border-brand-border text-left">
                        <p className="text-[9px] text-brand-primary/50 tracking-wider font-semibold">ASSIGNED PICKUP POINT</p>
                        <p className="text-brand-secondary font-bold text-xs mt-1 leading-tight truncate" title={getAssignedPickupPoint(buyerHall)}>
                          {getAssignedPickupPoint(buyerHall)}
                        </p>
                      </div>

                      <div className="bg-brand-card p-3.5 rounded-xl border border-brand-border text-left">
                        <p className="text-[9px] text-brand-primary/50 tracking-wider font-semibold">OUTSTANDING (AT PICKUP)</p>
                        <p className="text-brand-primary font-bold text-xs mt-1">₦{outstandingBalance.toLocaleString()}</p>
                      </div>

                      <div className="bg-brand-card p-3.5 rounded-xl border border-brand-border text-left">
                        <p className="text-[9px] text-brand-primary/50 tracking-wider font-semibold">TICKET STATUS</p>
                        <p className="text-emerald-800 font-bold text-xs mt-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                          CONFIRMED READY
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reassurance Action Block */}
                  <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-left space-y-4 relative z-10">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-brand-secondary flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-brand-secondary" />
                      KEEP YOUR RESERVATION DETAILS SAFE
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[11.5px] font-sans text-brand-primary/80 leading-tight">
                      <div className="flex items-start gap-2.5 bg-brand-bg p-3 rounded-xl border border-brand-border">
                        <Check size={14} className="text-brand-secondary mt-0.5 shrink-0" />
                        <span><strong>Screenshot this page</strong> right now to keep your unique ID handy.</span>
                      </div>
                      <div className="flex items-start gap-2.5 bg-brand-bg p-3 rounded-xl border border-brand-border">
                        <Check size={14} className="text-brand-secondary mt-0.5 shrink-0" />
                        <span>Show your <strong>Reservation ID</strong> at your assigned hall pickup point.</span>
                      </div>
                      <div className="flex items-start gap-2.5 bg-brand-bg p-3 rounded-xl border border-brand-border">
                        <Check size={14} className="text-brand-secondary mt-0.5 shrink-0" />
                        <span>Keep your registered phone number active for coordinate notifications.</span>
                      </div>
                      <div className="flex items-start gap-2.5 bg-brand-bg p-3 rounded-xl border border-brand-border">
                        <Check size={14} className="text-brand-secondary mt-0.5 shrink-0" />
                        <span>Pay your remaining balance via cash or transfer directly at pickup.</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-brand-primary/50 italic text-center pt-2 leading-tight">
                      Lost your ID? Don't worry, your reservation is also synced directly to your account.
                    </p>
                  </div>

                  <div className="pt-4 text-center relative z-10">
                    <button
                      onClick={handleFinished}
                      className="px-12 py-4 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-sans tracking-widest uppercase text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm inline-block"
                    >
                      Return to Marketplace
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* RIGHT SIDE CONTENT: STICKY BILLING SUMMARY SUMMARY */}
          {checkoutStep !== 'success' && (
            <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
              
              {/* STICKY CARD */}
              <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm text-left">
                <h3 className="text-xs font-sans tracking-widest uppercase font-bold text-brand-primary/60 mb-4 pb-2 border-b border-brand-border">
                  Billing Overview
                </h3>

                <div className="space-y-3.5 text-xs font-sans uppercase pb-5 border-b border-brand-border">
                  <div className="flex justify-between text-brand-primary/70">
                    <span>Total items ({totalItems})</span>
                    <span className="font-sans font-bold text-brand-primary">₦{totalValue.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-brand-secondary font-bold">
                    <span>Due Today (Deposit)</span>
                    <span className="font-sans text-sm">₦{totalDeposit.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-brand-primary/60 text-[11px] pt-1 border-t border-brand-border">
                    <span>Payable at Pickup</span>
                    <span className="font-sans">₦{outstandingBalance.toLocaleString()}</span>
                  </div>
                </div>

                {/* Main Call to Action Button inside sticky card */}
                {checkoutStep === 'cart' ? (
                  <button
                    onClick={handleStartCheckout}
                    className="w-full mt-5 py-4 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-sans tracking-widest uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    PROCEED TO DETAILS
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmReservation}
                    className="w-full mt-5 py-4 bg-brand-secondary hover:bg-brand-accent text-brand-bg font-sans tracking-widest uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    RESERVE FOR ₦{totalDeposit.toLocaleString()}
                  </button>
                )}

                <div className="text-[10px] text-brand-primary/50 font-sans text-center mt-3 leading-relaxed">
                  🔒 Encrypted connection. Student-verified handoffs.
                </div>
              </div>

              {/* STAGE 6 TRUST REASSURANCE CARD */}
              <div className="bg-brand-card p-5 rounded-2xl border border-brand-border text-[11.5px] font-sans leading-relaxed text-brand-primary/85 text-left space-y-2.5">
                <p className="font-bold text-brand-primary flex items-center gap-2 text-xs">
                  <ShieldCheck size={15} className="text-brand-secondary" />
                  Secure Reservation Policy
                </p>
                <p className="text-xs text-brand-primary/70">
                  By making a small reservation deposit today, you secure your chosen chapel-compliant tie prior to the resumption week surge. 
                </p>
                <p className="text-xs text-brand-primary/70">
                  Your deposit remains fully held under our <strong>Low-Risk Guarantee</strong>: if your tie doesn't fit or conform perfectly upon pickup, you receive a direct cash refund.
                </p>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
