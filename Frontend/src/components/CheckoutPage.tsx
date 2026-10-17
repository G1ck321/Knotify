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
  Star,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, Product, COVENANT_HALLS } from '../types';
import TiePlaceholder from './TiePlaceholder';
import { getAccessToken, persistAuthSession } from '../lib/authStorage';
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
import Marketplace from './Marketplace';

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
  /**
   * Live product catalog (App.tsx merges the backend's `/quantity/ties` price,
   * including discount logic, into each product on every app load).
   */
  products: Product[];
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onAddReservation: (reservation: any) => void;
  currentUser: any;
  onSetCurrentUser?: (user: any) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onOpenAuth: () => void;
  onContinueShopping: () => void;
}

export default function CheckoutPage({
  products,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onAddReservation,
  currentUser,
  onSetCurrentUser,
  onAddToCart,
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

  const DELIVERY_FEE = 250;

  const SAMPLE_USER = {
    name: 'Daniel Adeleke',
    phone: '08012345678',
    email: 'daniel.adeleke@student.covenant.edu.ng',
    hall: 'Daniel Hall',
    room: 'B204',
  };

  const handleUseSampleAccount = () => {
    // If bag is empty and catalog has items, queue up the first tie
    if (cartItems.length === 0 && products.length > 0 && onAddToCart) {
      onAddToCart(products[0], 1);
    }

    setBuyerName(SAMPLE_USER.name);
    setBuyerPhone(SAMPLE_USER.phone);
    setBuyerEmail(SAMPLE_USER.email);
    setBuyerHall(SAMPLE_USER.hall);
    setRoomNumber(SAMPLE_USER.room);

    const sampleAuthUser = {
      id: 'sample-student-daniel',
      name: SAMPLE_USER.name,
      full_name: SAMPLE_USER.name,
      email: SAMPLE_USER.email,
      telegramPhone: SAMPLE_USER.phone,
      phone: SAMPLE_USER.phone,
      whatsApp: SAMPLE_USER.phone,
      parentsNumber: '08098765432',
      address: SAMPLE_USER.hall,
      roomNumber: SAMPLE_USER.room,
    };

    if (onSetCurrentUser) {
      onSetCurrentUser(sampleAuthUser);
    }
    persistAuthSession(sampleAuthUser, 'sample_jwt_token_for_daniel');

    setCheckoutStep('form');
    setSubmitError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSimulatePayment = () => {
    const activeName = buyerName.trim() || SAMPLE_USER.name;
    const activePhone = buyerPhone.trim() || SAMPLE_USER.phone;
    const activeEmail = buyerEmail.trim() || SAMPLE_USER.email;
    const activeHall = buyerHall || SAMPLE_USER.hall;
    const activeRoom = roomNumber.trim() || SAMPLE_USER.room;

    const testTxRef = `KNT-TEST-${Date.now().toString().slice(-6)}`;
    const preferredColor = cartItems.map((item) => item.product.color).join(', ') || 'Classic Navy';
    const productNames = cartItems.length > 0
      ? cartItems.map((item) => `${item.product.name} (x${item.quantity})`).join(', ')
      : 'Sample Reserve Tie (x1)';

    const simulatedReservation = {
      id: testTxRef,
      name: activeName,
      phone: activePhone,
      email: activeEmail,
      color: preferredColor,
      quantity: totalItems || 1,
      hall: activeHall,
      productNames: productNames,
      deposit: itemsTotal || 2500,
      outstanding: 0,
      status: 'Ready for Pickup',
      pickupPoint: getAssignedPickupPoint(activeHall),
      dateAdded: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    onAddReservation(simulatedReservation);
    setGeneratedTxRef(testTxRef);
    setGeneratedId(testTxRef);
    localStorage.setItem('tx', testTxRef);

    setBuyerName(activeName);
    setBuyerPhone(activePhone);
    setBuyerEmail(activeEmail);
    setBuyerHall(activeHall);
    setRoomNumber(activeRoom);

    setCheckoutStep('success');
    onClearCart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pre-fill user details if logged in
  useEffect(() => {
    if (currentUser) {
      setBuyerName(currentUser.name || currentUser.full_name || '');
      setBuyerPhone(currentUser.telegramPhone || currentUser.phone || '');
      setBuyerEmail(currentUser.email || '');
      if (currentUser.address) setBuyerHall(currentUser.address);
      if (currentUser.roomNumber) setRoomNumber(currentUser.roomNumber);
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
  // ─────────────────────────────────────────────────────────────────────────────
  // LIVE PRICE RESOLUTION
  // ─────────────────────────────────────────────────────────────────────────────
  // Why `originalPrice` is WRONG here (the bug this fixes):
  //   `product.originalPrice` is the STATIC price hard-coded in types.ts
  //   (INITIAL_PRODUCTS). It never changes at runtime, so it ignores the
  //   early-bird discounts the backend applies (Backend/routers/quantity.py
  //   -> disount_logic()) and shows/charges the full price on checkout while
  //   the landing page shows the discounted price.
  //
  // Why `product.price` is RIGHT:
  //   On app load, App.tsx fetches `GET /quantity/ties` and merges the backend
  //   `price` (already discounted) into every product as `product.price`. The
  //   landing page, marketplace and product modal all read `product.price`,
  //   which is why they were already correct.
  //
  // Resolution order (freshest source first):
  //   1. `products` prop — re-fetched by App.tsx on every load, so it carries
  //      the backend's CURRENT price even if the cart snapshot is stale (e.g.
  //      the 5-paid-user discount threshold was crossed mid-session).
  //   2. `item.product.price` — the live price baked into the cart snapshot
  //      when the item was added (fallback if the tie left the catalog).
  //   3. `item.product.originalPrice` — the static types.ts value (last resort).
  const getLiveUnitPrice = (item: CartItem): number => {
    const freshProduct = products.find((product) => product.id === item.product.id);
    return Number(freshProduct?.price ?? item.product.price ?? item.product.originalPrice ?? 0);
  };

  const itemsTotal = cartItems.reduce((acc, item) => acc + getLiveUnitPrice(item) * (item?.quantity ?? 0), 0);
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
        unit_price: getLiveUnitPrice(item),
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-24 sm:pb-28 text-left animate-fadeIn" id="full-page-checkout">

      {/* 0. BOLD BACK-TO-SHOP ANCHOR (top-left) */}
      <div className="mb-4 text-left">
        <button
          type="button"
          onClick={onContinueShopping}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-white bg-brand-secondary px-1.5 py-2.5 sticky hover:bg-amber-50 hover:text-brand-accent transition-colors cursor-pointer group"
          id="btn-back-to-shop"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Shop</span>
        </button>
      </div>

      {/* 1. PROGRESS BARS / HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/40 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-primary tracking-tight">
              Checkout
            </h1>
            {/* <button
              type="button"
              onClick={handleUseSampleAccount}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 text-[11px] font-sans font-medium border border-amber-500/25 transition-all cursor-pointer shadow-xs"
              title="Click to test workflow with Daniel Adeleke's credentials"
            >
              <Sparkles size={12} className="text-amber-600" />
              <span>Sample Account</span>
            </button> */}
          </div>
          <p className="text-xs text-brand-primary/65 mt-1 font-sans">
            Direct Covenant hall delivery · Reserve online via Flutterwave
          </p>
        </div>

        {/* Step Indicator */}
        {checkoutStep !== 'success' && (
          <div className="flex items-center gap-2 text-[11px] font-sans">
            <button 
              onClick={() => cartItems.length > 0 && setCheckoutStep('cart')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                checkoutStep === 'cart' 
                  ? 'bg-brand-secondary text-brand-bg font-semibold shadow-xs' 
                  : 'bg-brand-card/70 text-brand-primary/60 border border-brand-border/60 hover:text-brand-primary'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-[9px] flex items-center justify-center font-mono">1</span>
              <span>Bag</span>
            </button>
            <div className="h-px w-4 bg-brand-border/60"></div>
            <button 
              disabled={cartItems.length === 0}
              onClick={handleStartCheckout}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                checkoutStep === 'form' 
                  ? 'bg-brand-secondary text-brand-bg font-semibold shadow-xs' 
                  : 'bg-brand-card/70 text-brand-primary/60 border border-brand-border/60 hover:text-brand-primary disabled:opacity-40'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-[9px] flex items-center justify-center font-mono">2</span>
              <span>Details</span>
            </button>
            <div className="h-px w-4 bg-brand-border/60"></div>
            <span className="px-3 py-1.5 rounded-full border bg-brand-card/40 text-brand-primary/30 border-brand-border/40 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-black/10 text-[9px] flex items-center justify-center font-mono">3</span>
              <span>Receipt</span>
            </span>
          </div>
        )}
      </div>

      {/* 2. CHOSEN CONTENT GRID OR EMPTY STATE */}
      {cartItems.length === 0 && checkoutStep !== 'success' ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-brand-card border border-brand-border/80 rounded-3xl p-8 max-w-xl mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center text-brand-secondary mb-4">
            <ShoppingBag size={24} />
          </div>
          <h3 className="font-serif font-bold text-base text-brand-primary">Your Bag is Empty</h3>
          <p className="text-xs text-brand-primary/70 mt-1.5 max-w-sm leading-relaxed font-sans">
            {/* You don't have any reservations queued up yet. Browse our collection or use the sample account to test the full checkout workflow. */}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={onContinueShopping}
              className="px-6 py-2.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-sans uppercase tracking-wider text-[11px] font-bold rounded-full transition-all cursor-pointer"
            >
              Explore Collection
            </button>
            {/* <button
              onClick={handleUseSampleAccount}
              className="px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/30 font-sans text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={13} className="text-amber-600" />
              <span>⚡ Test with Sample Account</span>
            </button> */}
          </div>
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
                  className="bg-brand-card/70 border border-brand-border/60 rounded-3xl p-6 sm:p-8 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-6 border-b border-brand-border/40 pb-4">
                    <h2 className="text-xs font-sans tracking-wider uppercase font-semibold text-brand-secondary flex items-center gap-2">
                      <ShoppingBag size={14} className="text-brand-secondary" />
                      Bag Items ({cartItems.length})
                    </h2>
                    <button 
                      onClick={onClearCart}
                      className="text-[11px] font-sans text-brand-primary/50 hover:text-red-600 transition-colors font-medium cursor-pointer bg-transparent border-none"
                    >
                      Clear Bag
                    </button>
                  </div>

                  <div className="divide-y divide-brand-border/60">
                    {cartItems.map((item) => {
                      const unitPrice = getLiveUnitPrice(item);
                      return (
                        <div key={item.product.id} className="flex py-5 gap-4 sm:gap-5 text-left items-start sm:items-center" id={`page-cart-item-${item.product.id}`}>
                          <div className="h-20 w-16 sm:h-24 sm:w-20 shrink-0 overflow-hidden rounded-2xl border border-brand-border/80 bg-brand-bg shadow-xs">
                            {item.product.image ? (
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="h-full w-full object-cover transition-all duration-300"
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

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4">
                              <div>
                                <h4 className="text-sm font-semibold font-sans text-brand-primary">
                                  {item.product.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-mono text-brand-primary/60 uppercase">
                                    {item.product.category} · {item.product.color}
                                  </span>
                                  <span className="text-[10px] text-emerald-800 font-semibold font-sans">
                                    ● In Stock
                                  </span>
                                </div>
                              </div>
                              <div className="text-left sm:text-right mt-1 sm:mt-0">
                                <div className="font-sans text-sm font-bold text-brand-primary">
                                  ₦{(unitPrice * item.quantity).toLocaleString()}
                                </div>
                                {item.quantity > 1 && (
                                  <div className="text-[10px] text-brand-primary/50 font-sans">
                                    ₦{unitPrice.toLocaleString()} each
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-border/40">
                              <span className="text-[10px] font-sans text-brand-primary/60">
                                Unit Price: <strong>₦{unitPrice.toLocaleString()}</strong>
                              </span>

                              <div className="flex items-center gap-3">
                                {/* Quantity Stepper */}
                                <div className="flex items-center border border-brand-border bg-brand-bg py-0.5 px-1 rounded-full shadow-xs">
                                  <button
                                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                    className="w-6 h-6 flex items-center justify-center font-sans text-xs text-brand-primary hover:bg-brand-card rounded-full transition-colors cursor-pointer"
                                    aria-label="Decrease quantity"
                                  >
                                    -
                                  </button>
                                  <span className="w-7 text-center font-sans text-xs font-bold text-brand-primary">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                    className="w-6 h-6 flex items-center justify-center font-sans text-xs text-brand-primary hover:bg-brand-card rounded-full transition-colors cursor-pointer"
                                    aria-label="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  onClick={() => onRemoveItem(item.product.id)}
                                  className="p-1.5 text-brand-primary/40 hover:text-red-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                  title="Remove Item"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-5 border-t border-brand-border/60 flex items-center justify-between">
                    <button
                      onClick={onContinueShopping}
                      className="text-xs font-sans font-bold text-brand-secondary hover:text-brand-primary uppercase tracking-wider flex items-center gap-2 cursor-pointer bg-transparent border-none"
                    >
                      <ArrowLeft size={14} />
                      Back to Shop
                    </button>
                    <span className="text-[11px] text-brand-primary/70 font-sans hidden sm:inline">
                      Complete checkout using the summary on the right →
                    </span>
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
                  className="bg-brand-card/70 border border-brand-border/60 rounded-3xl p-6 sm:p-8 shadow-xs"
                >
                  <div className="mb-6 border-b border-brand-border/60 pb-4">
                    <button 
                      onClick={() => setCheckoutStep('cart')}
                      className="text-[10px] font-sans text-brand-primary/60 hover:text-brand-primary transition-colors uppercase font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none"
                    >
                      <ArrowLeft size={12} />
                      Go Back to Bag
                    </button>
                    <h2 className="text-base font-serif font-bold text-brand-primary mt-3 tracking-tight">
                      Reservation & Delivery Details
                    </h2>
                    <p className="text-xs text-brand-primary/70 mt-1 font-sans">
                      Complete your student information so we can coordinate direct delivery to your residence hall.
                    </p>
                  </div>

                  {/* Sample Account Quick Fill Banner */}
                  <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-2 text-xs font-sans text-amber-950 font-medium">
                      <Sparkles size={15} className="text-amber-600 shrink-0" />
                      <span>Testing? Quick-fill a verified Covenant student profile.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleUseSampleAccount}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-sans font-semibold tracking-wide transition-colors cursor-pointer shrink-0 text-center shadow-xs"
                    >
                      Fill Daniel Adeleke
                    </button>
                  </div>

                  <form onSubmit={handleInitiatePayment} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      
                      {/* Name input */}
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-brand-secondary uppercase tracking-widest mb-1.5">
                          FULL NAME *
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/45">
                            <User size={13} />
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Daniel Adeleke"
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border border-brand-border focus:border-brand-secondary focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Phone input */}
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-brand-secondary uppercase tracking-widest mb-1.5">
                          PHONE / WHATSAPP NUMBER *
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
                            className="w-full pl-9 pr-4 py-3 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border border-brand-border focus:border-brand-secondary focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      
                      {/* Email input */}
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-brand-secondary uppercase tracking-widest mb-1.5">
                          STUDENT EMAIL *
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
                            className="w-full pl-9 pr-4 py-3 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border border-brand-border focus:border-brand-secondary focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Residence Hall Selector */}
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-brand-secondary uppercase tracking-widest mb-1.5">
                          RESIDENCE HALL *
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/45">
                            <Building size={13} />
                          </span>
                          <select
                            value={buyerHall}
                            onChange={(e) => setBuyerHall(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border border-brand-border focus:border-brand-secondary focus:outline-none transition-all cursor-pointer"
                          >
                            {COVENANT_HALLS.map((hall) => (
                              <option key={hall} value={hall}>
                                {hall}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                    </div>

                    {/* Room number optional */}
                    <div>
                      <label className="block text-[10px] font-sans font-bold text-brand-secondary uppercase tracking-widest mb-1.5">
                        ROOM / WING NUMBER (OPTIONAL)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/45">
                          <Hash size={13} />
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. Room B204"
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border border-brand-border focus:border-brand-secondary focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="bg-brand-bg p-4 rounded-2xl border border-brand-border text-[11px] text-brand-primary/80 font-sans leading-relaxed">
                      <p className="font-bold text-brand-primary mb-0.5 flex items-center gap-1.5 text-xs">
                        <Info size={13} className="text-brand-secondary" />
                        Direct Hall Routing
                      </p>
                      Matched pickup station: <strong>{getAssignedPickupPoint(buyerHall)}</strong>. Collect your package directly at resumption without queues.
                    </div>

                    {submitError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700 font-sans">
                        {submitError}
                      </div>
                    )}

                    <div className="pt-4 border-t border-brand-border flex flex-col sm:flex-row gap-3 justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setCheckoutStep('cart')}
                        className="text-xs font-sans font-bold text-brand-secondary hover:text-brand-primary uppercase tracking-wider flex items-center gap-2 cursor-pointer bg-transparent border-none"
                      >
                        <ArrowLeft size={14} />
                        Review Bag Items
                      </button>

                      <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleSimulatePayment}
                          className="px-5 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-900 font-sans text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Simulate successful payment without entering real credit cards"
                        >
                          <Sparkles size={13} className="text-amber-600" />
                          <span>Simulate Paid Order</span>
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-7 py-3.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-sans tracking-widest uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                        >
                          {isSubmitting ? 'CONNECTING GATEWAY...' : `PAY ₦${totalAmountPayable.toLocaleString()} VIA FLUTTERWAVE`}
                          <ArrowRight size={14} />
                        </button>
                      </div>
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
              
              <div className="bg-brand-card/70 border border-brand-border/60 rounded-3xl p-6 shadow-xs text-left">
                <h3 className="text-xs font-sans tracking-wider uppercase font-semibold text-brand-primary/60 mb-4 pb-2 border-b border-brand-border/40">
                  Billing Overview
                </h3>

                <div className="space-y-3 text-xs font-sans pb-4 border-b border-brand-border/40">
                  <div className="flex justify-between text-brand-primary/70">
                    <span>Total items ({totalItems})</span>
                    <span className="font-sans font-bold text-brand-primary">₦{itemsTotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-brand-secondary font-semibold">
                    <span>Delivery & Hall Handoff</span>
                    <span className="font-sans text-sm">₦{DELIVERY_FEE.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-brand-primary/80 text-xs pt-1.5 border-t border-brand-border/40">
                    <span className="font-semibold">Total Payable</span>
                    <span className="font-sans font-bold text-base text-brand-primary">₦{totalAmountPayable.toLocaleString()}</span>
                  </div>
                </div>

                {/* Main Call to Action Button inside sticky card */}
                {checkoutStep === 'cart' ? (
                  <button
                    onClick={handleStartCheckout}
                    className="w-full mt-4 py-3.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-sans tracking-wider uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                  >
                    Proceed to Details
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleInitiatePayment}
                    disabled={isSubmitting}
                    className="w-full mt-4 py-3.5 bg-brand-secondary hover:bg-brand-accent text-brand-bg font-sans tracking-wider uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 active:scale-98"
                  >
                    {isSubmitting ? 'Connecting Gateway...' : `Pay ₦${totalAmountPayable.toLocaleString()} via Flutterwave`}
                  </button>
                )}

                {/* Quick 1-Click Sample Test Button */}
                {/* <button
                  type="button"
                  onClick={handleUseSampleAccount}
                  className="w-full mt-2.5 py-2.5 px-3 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/25 text-[11px] font-sans font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="1-click fill verified Covenant student test profile"
                >
                  <Sparkles size={13} className="text-amber-600" />
                  <span>⚡ Use Sample Account (1-Click Test)</span>
                </button> */}

                <div className="text-[10px] text-brand-primary/80 font-sans text-center mt-3 leading-relaxed">
                  🔒 Encrypted connection · Student-verified handoffs
                </div>
              </div>

              {/* TRUST REASSURANCE CARD */}
              <div className="bg-brand-card/70 p-4 rounded-2xl border border-brand-border/60 text-[11px] font-sans leading-relaxed text-brand-primary/80 text-left space-y-1.5">
                <p className="font-bold text-brand-primary flex items-center gap-1.5 text-xs">
                  <ShieldCheck size={14} className="text-brand-secondary" />
                  Low-Risk Student Guarantee
                </p>
                <p className="text-xs text-brand-primary/65 leading-relaxed">
                  Direct delivery to your residence hall lobby on resumption week. Full cash refund or tie exchange directly at pickup if unsuited.
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
 {/* <motion.div
              key="marketplace"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Marketplace
                products={products}
                onOpenProductDetail={handleProductClick}
                onBackToShop={() => {
                  setCurrentTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={(product, event) => {
                  event.stopPropagation();
                  handleAddToCart(product, 1);
                }}
                isInWishlist={isInWishlist}
                initialSearchQuery={sharedSearchQuery}
                initialCategory={sharedCategory}
                onSearchQueryChange={setSharedSearchQuery}
                onCategoryChange={setSharedCategory}
              />
            </motion.div> */}
    </div>
  );
}
