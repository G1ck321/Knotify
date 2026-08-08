import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  CheckCircle, 
  ArrowRight, 
  User, 
  Phone, 
  Mail,
  ShieldCheck,
  Clipboard,
  Check,
  ArrowLeft,
  Info,
  CreditCard,
  Building,
  Hash,
  Loader2,
  MessageSquare,
  ExternalLink,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, COVENANT_HALLS } from '../types';
import TiePlaceholder from './TiePlaceholder';
import { getAccessToken } from '../lib/authStorage';
import {
  clearPaymentReturnParams,
  clearPendingCheckout,
  fetchOrderStatus,
  getBackendUrl,
  loadPendingCheckout,
  parsePaymentReturnParams,
  PAYMENT_FAILURE_STATUSES,
  PAYMENT_SUCCESS_STATUSES,
  savePendingCheckout,
} from '../lib/checkoutPayment';

async function createCheckoutSession(payload: unknown) {
  const token = getAccessToken();

  const response = await fetch(`${getBackendUrl()}/api/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || 'Could not create payment session');
  }

  return data as { checkout_url?: string; tx_ref?: string };
}

interface ReviewFormProps {
  initialEmail: string;
}

function ReviewForm({ initialEmail }: ReviewFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !reviewText) {
      setSubmitError('Please fill in both your email and review.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch(`${getBackendUrl()}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          review: reviewText.trim(),
          // review_text: reviewText.trim(),
          // text: reviewText.trim(),
          rating: Number(rating),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      setSubmitSuccess(true);
      setReviewText('');
    } catch (err) {
      setSubmitError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm text-left space-y-4">
      <h3 className="text-xs font-sans tracking-widest uppercase font-bold text-brand-primary/60 mb-2 pb-2 border-b border-brand-border flex items-center gap-1.5">
        <MessageSquare size={14} className="text-brand-secondary" />
        Share Your Experience
      </h3>
      
      {submitSuccess ? (
        <div className="space-y-3 py-4 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 mx-auto">
            <Check size={20} />
          </div>
          <p className="text-xs text-brand-primary font-sans font-bold uppercase tracking-wider">Review Submitted!</p>
          <p className="text-[11px] text-neutral-500 font-sans leading-relaxed">
            Thank you for your valuable feedback. It helps us improve our collection and service!
          </p>
          <button
            onClick={() => setSubmitSuccess(false)}
            className="text-[10px] font-sans text-brand-secondary hover:text-brand-primary uppercase font-bold cursor-pointer underline bg-transparent border-none"
          >
            Submit another review
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. scholar@covenant.edu"
              className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border/50 focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary/20 text-brand-primary rounded-xl font-sans text-xs focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Rating
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="p-0.5 text-brand-primary hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star
                    size={18}
                    fill={(hoveredRating !== null ? star <= hoveredRating : star <= rating) ? '#D4AF37' : 'none'}
                    stroke={(hoveredRating !== null ? star <= hoveredRating : star <= rating) ? '#D4AF37' : 'currentColor'}
                    className={
                      (hoveredRating !== null ? star <= hoveredRating : star <= rating)
                        ? 'text-[#D4AF37]'
                        : 'text-brand-primary/40'
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-1">
              Your Review
            </label>
            <textarea
              required
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us what you think of your tie and reservation experience..."
              className="w-full px-3 py-2 bg-brand-bg border border-brand-border/50 focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary/20 text-brand-primary rounded-xl font-sans text-xs focus:outline-none transition-all resize-none"
            />
          </div>

          {submitError && (
            <div className="text-[10px] text-red-600 font-mono">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#1F3E2B] hover:bg-[#2E5C3E] text-[#FFFEF2] font-mono tracking-widest uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT FEEDBACK'}
          </button>
        </form>
      )}
    </div>
  );
}

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
  const [roomNumber, setRoomNumber] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [generatedTxRef, setGeneratedTxRef] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedId, setGeneratedId]  = useState(
  () => localStorage.getItem("tx") || ""
);
  

  const DELIVERY_FEE = 200;

  // Pre-fill user details if logged in
  useEffect(() => {
    if (currentUser) {
      setBuyerName(currentUser.name || '');
      setBuyerPhone(currentUser.telegramPhone || '');
      setBuyerEmail(currentUser.email || '');
    }
  }, [currentUser]);

  useEffect(() => {
    const { status, txRef } = parsePaymentReturnParams();
    if (!status && !txRef) return;

    clearPaymentReturnParams();

    const finalizePaidOrder = (confirmedTxRef: string) => {
      const pending = loadPendingCheckout(confirmedTxRef);
      setGeneratedTxRef(confirmedTxRef);
      localStorage.setItem("tx", confirmedTxRef)
      

      if (pending) {
        setBuyerName(pending.buyerName);
        setBuyerPhone(pending.buyerPhone);
        setBuyerEmail(pending.buyerEmail);
        setBuyerHall(pending.buyerHall);
        setRoomNumber(pending.roomNumber);

        onAddReservation({
          id: confirmedTxRef,
          name: pending.buyerName,
          phone: pending.buyerPhone,
          email: pending.buyerEmail,
          color: pending.preferredColor,
          quantity: pending.totalItems,
          hall: pending.buyerHall,
          productNames: pending.productNames,
          deposit: pending.itemsTotal,
          outstanding: 0,
          status: 'Ready for Pickup',
          pickupPoint: getAssignedPickupPoint(pending.buyerHall),
          dateAdded: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        });
        clearPendingCheckout();
      }

      setCheckoutStep('success');
      loadgeneratedId();
      onClearCart();
    };

    const handlePaymentReturn = async () => {
      if (txRef && PAYMENT_SUCCESS_STATUSES.has(status)) {
        const order = await fetchOrderStatus(txRef);
        if (order && (order.status === 'paid' || order.status === 'pending')) {
          finalizePaidOrder(txRef);
          return;
        }

        setSubmitError('We could not confirm your payment yet. Please contact support with your tx_ref.');
        setCheckoutStep('form');
        return;
      }

      if (status && PAYMENT_FAILURE_STATUSES.has(status)) {
        setSubmitError('Payment was cancelled or failed. Your bag is still saved — try again when ready.');
        setCheckoutStep('form');
        return;
      }

      if (status && !PAYMENT_SUCCESS_STATUSES.has(status)) {
        setSubmitError('Payment was not completed. No charge was made.');
        setCheckoutStep('cart');
      }
    };

    handlePaymentReturn();
  }, []);

  // Pricing calculations
  const totalItems = cartItems.reduce((acc, item) => acc + (item?.quantity ?? 0), 0);
  const itemsTotal = cartItems.reduce((acc, item) => acc + (item?.product?.originalPrice ?? 0) * (item?.quantity ?? 0), 0);
  const totalAmountPayable = itemsTotal > 0 ? itemsTotal + DELIVERY_FEE : 0;
  const loadgeneratedId = () => {
    
    const tx = localStorage.getItem("tx");
    if (tx) {
      
      setGeneratedId(tx);
    }
  }

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

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName || !buyerPhone || !buyerEmail) {
      setSubmitError('Please fill in your name, contact phone, and email address.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const orderItems = cartItems.map((item) => ({
        item_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.originalPrice,
        image_url: item.product.image || undefined,
      }));

      const preferredColor = cartItems.map((item) => item.product.color).join(', ');
      const productNames = cartItems.map((item) => `${item.product.name} (x${item.quantity})`).join(', ');

      const response = await createCheckoutSession({
        name: buyerName,
        email: buyerEmail,
        telegramPhone: buyerPhone,
        parentsNumber: currentUser?.parentsNumber || buyerPhone,
        whatsApp: currentUser?.whatsApp || buyerPhone,
        address: buyerHall,
        roomNumber: roomNumber || 'N/A',
        items: orderItems,
        orderDetails: productNames,
        amount: itemsTotal,
      });

      const txRef = response.tx_ref;
      if (!txRef) {
        throw new Error('Payment session did not return a transaction reference');
      }

      savePendingCheckout({
        tx_ref: txRef,
        buyerName,
        buyerPhone,
        buyerEmail,
        buyerHall,
        roomNumber,
        itemsTotal,
        totalAmountPayable,
        totalItems,
        productNames,
        preferredColor,
      });

      if (response.checkout_url) {
        window.location.href = response.checkout_url;
        return;
      }

      throw new Error('Payment gateway did not return a checkout URL');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not start checkout');
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedTxRef);
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
            Checkout & Direct Payment
          </h1>
          <p className="text-xs text-brand-secondary/85 mt-1 font-sans">
            Direct online payment via Flutterwave. Instant confirmation & hall lobby delivery.
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
              02 PAYMENT DETAILS
            </button>
            <div className="h-px w-6 bg-brand-border"></div>
            <span className="px-3.5 py-1.5 rounded-full border bg-brand-card text-brand-primary/30 border-brand-border/60">
              03 PAID RECEIPT
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
                                  Price: ₦{(item.product.originalPrice ?? item.product.originalPrice ?? 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="sm:text-right flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-1">
                              <span className="font-sans text-sm font-bold text-brand-primary">
                                ₦{((item.product.originalPrice ?? item.product.originalPrice ?? 0) * (item.quantity)).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-brand-primary/60 font-sans hidden sm:block">
                                (₦{(item.product.originalPrice ?? item.product.originalPrice ?? 0).toLocaleString()} each)
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

                  <form onSubmit={handleInitiatePayment} className="space-y-6">
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
                          EMAIL ADDRESS *
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/45">
                            <Mail size={13} />
                          </span>
                          <input
                            type="email"
                            required
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

                    {submitError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700 font-sans">
                        {submitError}
                      </div>
                    )}

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
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-sans tracking-widest uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        {isSubmitting ? 'CONNECTING GATEWAY...' : `PAY ₦${totalAmountPayable.toLocaleString()} VIA FLUTTERWAVE`}
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
          <div className="text-center max-w-lg mx-auto space-y-4">
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
                        <span className="font-sans text-base font-extrabold">₦{itemsTotal.toLocaleString()}</span>
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
                        <p className="text-brand-secondary font-bold text-xs mt-1 leading-tight truncate" title="">
                          Shared Near Resumption Date
                        </p>
                      </div>

                      <div className="bg-brand-card p-3.5 rounded-xl border border-brand-border text-left">
                        <p className="text-[9px] text-brand-primary/50 tracking-wider font-semibold">OUTSTANDING (AT PICKUP)</p>
                        <p className="text-brand-primary font-bold text-xs mt-1">₦{totalAmountPayable.toLocaleString()}</p>
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

                  {/* Community Channels */}
                  <div className="bg-brand-bg border border-brand-border rounded-2xl p-6 text-left space-y-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-brand-secondary shrink-0" />
                      <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-brand-secondary">
                        For updates on your order:
                      </p>
                    </div>
                    <p className="text-xs text-brand-primary/65 font-sans leading-relaxed">
                      Join our community channels to receive real-time pickup notifications, schedule updates, and coordinate your lobby delivery.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* WhatsApp */}
                      <a
                        href="https://chat.whatsapp.com/Kiwu2BWP1NuE0z0wC61to0"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-brand-card border border-brand-border hover:border-emerald-600/40 hover:bg-emerald-900/5 p-4 rounded-xl transition-all group cursor-pointer"
                        id="success-whatsapp-link"
                      >
                        <div className="w-9 h-9 rounded-full bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-mono text-emerald-600 font-bold tracking-widest uppercase">WhatsApp</p>
                          <p className="text-xs font-sans text-brand-primary font-semibold group-hover:text-emerald-700 transition-colors">Join Community</p>
                        </div>
                        <ExternalLink size={11} className="ml-auto text-brand-primary/30 group-hover:text-emerald-600 transition-colors shrink-0" />
                      </a>

                      {/* Telegram */}
                      <a
                        href="https://t.me/+go-lAiSrbJ5hNGVk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-brand-card border border-brand-border hover:border-sky-500/40 hover:bg-sky-900/5 p-4 rounded-xl transition-all group cursor-pointer"
                        id="success-telegram-link"
                      >
                        <div className="w-9 h-9 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-sky-500">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-mono text-sky-500 font-bold tracking-widest uppercase">Telegram</p>
                          <p className="text-xs font-sans text-brand-primary font-semibold group-hover:text-sky-600 transition-colors">Subscribe to Channel</p>
                        </div>
                        <ExternalLink size={11} className="ml-auto text-brand-primary/30 group-hover:text-sky-500 transition-colors shrink-0" />
                      </a>
                    </div>
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

          {/* RIGHT SIDE CONTENT: STICKY BILLING SUMMARY */}
          {checkoutStep !== 'success' ? (
            <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
              
              <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm text-left">
                <h3 className="text-xs font-sans tracking-widest uppercase font-bold text-brand-primary/60 mb-4 pb-2 border-b border-brand-border">
                  Billing Overview
                </h3>

                <div className="space-y-3.5 text-xs font-sans uppercase pb-5 border-b border-brand-border">
                  <div className="flex justify-between text-brand-primary/70">
                    <span>Total items ({totalItems})</span>
                    <span className="font-sans font-bold text-brand-primary">₦{itemsTotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-brand-secondary font-bold">
                    <span>Delivery & Development</span>
                    <span className="font-sans text-sm">₦{DELIVERY_FEE.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-brand-primary/60 text-[11px] pt-1 border-t border-brand-border">
                    <span>Total Payable</span>
                    <span className="font-sans font-bold">₦{totalAmountPayable.toLocaleString()}</span>
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
                    type="button"
                    onClick={handleInitiatePayment} // 🌟 FIX 1: Updated function name here
                    disabled={isSubmitting}
                    className="w-full mt-5 py-4 bg-brand-secondary hover:bg-brand-accent text-brand-bg font-sans tracking-widest uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {/* 🌟 FIX 2: Updated variable from outstandingBalance to totalAmountPayable */}
                    {isSubmitting ? 'CONNECTING GATEWAY...' : `PAY ₦${totalAmountPayable.toLocaleString()} VIA FLUTTERWAVE`}
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
                  By making a reservation deposit today, you secure your chosen chapel-compliant tie prior to the resumption week surge. 
                </p>
                <p className="text-xs text-brand-primary/70">
                    Your deposit remains fully held under our <strong>Low-Risk Guarantee</strong>: <br></br>
                      - If your tie doesn't fit or conform perfectly upon pickup, you receive a direct cash refund. <br></br>
                      - If you do not get into Covenant you get a transfer back.
                </p>
              </div>

            </div>
          ) : (
            <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
              <ReviewForm initialEmail={buyerEmail} />
            </div>
          )}

        </div>
      )}

    </div>
  );
}
