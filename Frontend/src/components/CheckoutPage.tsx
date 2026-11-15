import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  Printer,
  Share2,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, Product, COVENANT_HALLS } from '../types';
import TiePlaceholder from './TiePlaceholder';
import { persistAuthSession } from '../lib/authStorage';
import {
  checkInventoryAvailability,
  clearPaymentReturnParams,
  clearPendingCheckout,
  createCheckoutSession,
  fetchOrderStatus,
  getBackendUrl,
  loadPendingCheckout,
  parsePaymentReturnParams,
  PAYMENT_FAILURE_STATUSES,
  PAYMENT_SUCCESS_STATUSES,
  savePendingCheckout,
} from '../lib/checkoutPayment';
import { DELIVERY_FEE, formatNaira, MAX_PER_TIE, PIC_FEE, UPDATES_FEE } from '../lib/pricing';

interface ReviewFormProps {
  initialEmail: string;
}

/**
 * Per-field validation messages for the details form. They render UNDER the
 * field that is wrong (not in a single banner at the bottom), because on a
 * phone the banner sits below the fold and the buyer never sees it.
 */
type CheckoutFieldErrors = {
  name?: string;
  phone?: string;
  email?: string;
  hall?: string;
};

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(true);
  const [shareFeedback, setShareFeedback] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  // Optional ₦100 email/Telegram updates opt-in. Checked by default. The email
  // field itself is REQUIRED (receipts), so this only controls the add-on.
  // The ₦100 priority-alerts add-on is ADDED AT CHECKOUT by default and can be
  // removed with the tick box under the Pay button. The required email
  // (receipts, delivery notices) is free either way, so this is purely a
  // purchasable extra the buyer can drop before paying.
  const [emailUpdates, setEmailUpdates] = useState(true);
  // No default hall: the buyer must pick one, because delivery routing depends
  // on it and a pre-filled hall silently sends ties to the wrong lobby.
  const [buyerHall, setBuyerHall] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [generatedTxRef, setGeneratedTxRef] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedId, setGeneratedId]  = useState(
    () => localStorage.getItem("tx") || ""
  );

  // Ties held by another buyer's in-flight checkout, and the amber prompt that
  // explains it. A signed-in buyer's OWN holds are already excluded server-side
  // (see Backend/routers/quantity.py own_held_quantities).
  const [unavailableItemIds, setUnavailableItemIds] = useState<string[]>([]);
  const [showAvailabilityPrompt, setShowAvailabilityPrompt] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Feature B: the Jumia-style ties strip at the bottom of checkout.
  // Newest arrivals first (ties with the latest `added_at` surface first),
  // and never suggesting a tie that is already in the bag or out of stock.
  const stripProducts = useMemo(() => {
    const inBag = new Set(cartItems.map((item) => item.product.id));

    return products
      .filter((product) => !inBag.has(product.id) && Number(product.stock) > 0)
      .sort((a, b) => {
        const aTime = a.addedAt ? Date.parse(a.addedAt) : 0;
        const bTime = b.addedAt ? Date.parse(b.addedAt) : 0;
        return bTime - aTime;
      })
      .slice(0, 10);
  }, [products, cartItems]);

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

  // Keep the bag in sync with live stock whenever it changes.
  useEffect(() => {
    let cancelled = false;

    const refreshAvailability = async () => {
      if (cartItems.length === 0) {
        setUnavailableItemIds([]);
        return;
      }

      try {
        const availability = await checkInventoryAvailability(
          cartItems.map((item) => ({ tie_id: item.product.id, quantity: item.quantity }))
        );
        if (!cancelled) {
          setUnavailableItemIds(
            availability.filter((item) => !item.available).map((item) => item.tie_id)
          );
        }
      } catch {
        // The payment endpoint performs the authoritative availability check.
      }
    };

    refreshAvailability();
    return () => {
      cancelled = true;
    };
  }, [cartItems]);

  // Trigger printing animation on success
  useEffect(() => {
    if (checkoutStep === 'success') {
      setIsPrintingReceipt(true);
      const timer = setTimeout(() => {
        setIsPrintingReceipt(false);
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [checkoutStep]);

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
  // Ties another buyer is holding are excluded from what we charge for.
  const checkoutItems = cartItems.filter((item) => !unavailableItemIds.includes(item.product.id));
  const totalItems = checkoutItems.reduce((acc, item) => acc + (item?.quantity ?? 0), 0);
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

  const itemsTotal = checkoutItems.reduce((acc, item) => acc + getLiveUnitPrice(item) * (item?.quantity ?? 0), 0);
  const updatesFee = emailUpdates ? UPDATES_FEE : 0;
  const totalAmountPayable = itemsTotal > 0 ? itemsTotal + DELIVERY_FEE + updatesFee : 0;
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

  const handleStartCheckout = async () => {
    if (checkoutItems.length > 0) {
      if (!currentUser) {
        onOpenAuth();
      } else {
        setIsCheckingAvailability(true);
        setSubmitError('');
        try {
          const availability = await checkInventoryAvailability(
            cartItems.map((item) => ({ tie_id: item.product.id, quantity: item.quantity }))
          );
          const unavailable = availability.filter((item) => !item.available).map((item) => item.tie_id);
          setUnavailableItemIds(unavailable);

          if (unavailable.length > 0) {
            setShowAvailabilityPrompt(true);
            return;
          }

          setCheckoutStep('form');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
          setSubmitError(error instanceof Error ? error.message : 'Could not verify live tie availability');
        } finally {
          setIsCheckingAvailability(false);
        }
      }
    }
  };

  const clearFieldError = (field: keyof CheckoutFieldErrors) => {
    setFieldErrors((previous) =>
      previous[field] ? { ...previous, [field]: undefined } : previous
    );
  };

  const handleOpenConfirm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validate everything at once and show each message under its own field.
    const errors: CheckoutFieldErrors = {};

    if (!buyerName.trim()) {
      errors.name = 'Enter the full name this order should be recorded under.';
    }

    const phone = buyerPhone.trim();
    // 08012345678 is only the example shown in the field. It is rejected so a
    // buyer cannot submit the placeholder instead of a number we can reach.
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone) {
      errors.phone = 'Enter your own phone or Telegram number — we need it to reach you.';
    } else if (phoneDigits === '08012345678' || phoneDigits =='0987654321') {
      errors.phone = 'That is the example number. Enter your own phone or Telegram number.';
    } else if (!/^\+?[0-9][0-9\s-]{6,19}$/.test(phone) || phoneDigits.length < 10 || phoneDigits.length > 14) {
      errors.phone = 'Enter a complete number, like 0803 123 4567.';
    }

    const email = buyerEmail.trim();
    if (!email) {
      errors.email = 'Email is required — your receipt and order updates go here.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'That email address does not look right. Please check it.';
    }

    if (!buyerHall) {
      errors.hall = 'Select your residence hall so we route your delivery correctly.';
    }

    setFieldErrors(errors);
    setSubmitError('');

    if (Object.keys(errors).length > 0) {
      return;
    }

    setShowConfirmModal(true);
  };

  const handleInitiatePayment = async () => {
    setShowConfirmModal(false);
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const orderItems = checkoutItems.map((item) => ({
        item_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        unit_price: getLiveUnitPrice(item),
        image_url: item.product.image || undefined,
      }));

      const preferredColor = checkoutItems.map((item) => item.product.color).join(', ');
      const productNames = checkoutItems.map((item) => `${item.product.name} (x${item.quantity})`).join(', ');

      const response = await createCheckoutSession({
        name: buyerName,
        email: buyerEmail.trim(),
        email_updates: emailUpdates,
        telegramPhone: buyerPhone,
        parentsNumber: currentUser?.parentsNumber || buyerPhone,
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
    navigator.clipboard.writeText(generatedId || generatedTxRef);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleShareReceipt = async () => {
    const shareText = `Knotify Order Receipt\nReservation ID: ${generatedId || generatedTxRef}\nName: ${buyerName}\nHall: ${buyerHall}\nAmount: ₦${itemsTotal.toLocaleString()}\nStatus: Confirmed Ready`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Knotify Order Receipt',
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }
    
    // Fallback copy
    navigator.clipboard.writeText(shareText);
    setShareFeedback('Receipt copied to clipboard!');
    setTimeout(() => setShareFeedback(''), 3000);
  };

  const handleFinished = () => {
    onClearCart();
    onContinueShopping();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-24 sm:pb-28 text-left animate-fadeIn" id="full-page-checkout">
      
      {/* 1. PROGRESS BARS / HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/40 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-primary tracking-tight">
            Checkout
          </h1>
          <p className="text-xs text-brand-primary/65 mt-1 font-sans">
            Direct Covenant hall delivery · Reserve online securely
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
      {showAvailabilityPrompt && unavailableItemIds.length > 0 && (
        <div className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-left" role="alert">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-900">Some ties are temporarily unavailable</h2>
          <p className="mt-2 text-xs leading-relaxed text-amber-900/80">
            Another customer is checking out with: {cartItems
              .filter((item) => unavailableItemIds.includes(item.product.id))
              .map((item) => item.product.name)
              .join(', ')}. They are held for up to 10 minutes.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setShowAvailabilityPrompt(false);
                setCheckoutStep('form');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-full bg-brand-primary px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-brand-bg"
            >
              Continue with available ties
            </button>
            <button
              type="button"
              onClick={() => setShowAvailabilityPrompt(false)}
              className="rounded-full border border-amber-900/30 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-amber-900"
            >
              Keep reviewing my bag
            </button>
          </div>
        </div>
      )}

      {cartItems.length === 0 && checkoutStep !== 'success' ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-brand-card border border-brand-border/80 rounded-3xl p-8 max-w-xl mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center text-brand-secondary mb-4">
            <ShoppingBag size={24} />
          </div>
          <h3 className="font-serif font-bold text-base text-brand-primary">Your Bag is Empty</h3>
          <p className="text-xs text-brand-primary/70 mt-1.5 max-w-sm leading-relaxed font-sans">
            You don't have any reservations queued up yet. Browse our collection to select your ties.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={onContinueShopping}
              className="px-6 py-2.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-sans uppercase tracking-wider text-[11px] font-bold rounded-full transition-all cursor-pointer"
            >
              Explore Collection
            </button>
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
                  className="bg-transparent border border-brand-border/40 rounded-3xl p-6 sm:p-8"
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
                                  {unavailableItemIds.includes(item.product.id) ? (
                                    <span className="text-[10px] text-amber-800 font-semibold font-sans">
                                      ● Temporarily Unavailable
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-800 font-semibold font-sans">
                                      ● In Stock
                                    </span>
                                  )}
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
                                    disabled={item.quantity >= MAX_PER_TIE || item.quantity >= Number(item.product.stock)}
                                    title={item.quantity >= MAX_PER_TIE ? `Maximum ${MAX_PER_TIE} per order` : undefined}
                                    className="w-6 h-6 flex items-center justify-center font-sans text-xs text-brand-primary hover:bg-brand-card rounded-full transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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
                      <span className="text-[11px] text-brand-primary/50 font-sans">
                      Complete checkout using the summary on the   
                    <span className="pl-0.5 text-[11px] text-brand-primary/50 font-sans hidden sm:inline">
                       right → <ArrowRight style={{display:'ínline'}} size={12}/>
                      </span>
                      <span className='pl-0.5 text-[11px] text-brand-primary/50 font-sans block lg:hidden'>
/bottom <ArrowDown style={{display:'ínline'}} size={12} />
                      </span>
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
                  className="bg-transparent border border-brand-border/40 rounded-3xl p-6 sm:p-8"
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

                  <form onSubmit={handleOpenConfirm} className="space-y-5">
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
                            onChange={(e) => {
                              setBuyerName(e.target.value);
                              clearFieldError('name');
                            }}
                            aria-invalid={Boolean(fieldErrors.name)}
                            className={`w-full pl-9 pr-4 py-3 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border ${fieldErrors.name ? 'border-red-400' : 'border-brand-border'} focus:border-brand-secondary focus:outline-none transition-all`}
                          />
                        </div>
                        {fieldErrors.name && (
                          <p role="alert" className="mt-1.5 flex items-start gap-1 text-[10px] font-sans leading-relaxed text-red-600">
                            <Info size={11} className="mt-0.5 shrink-0" />
                            {fieldErrors.name}
                          </p>
                        )}
                      </div>

                      {/* Phone input */}
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-brand-secondary uppercase tracking-widest mb-1.5">
                          PHONE / TELEGRAM NUMBER *
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/45">
                            <Phone size={13} />
                          </span>
                          <input
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            required
                            placeholder="08012345678"
                            value={buyerPhone}
                            onChange={(e) => {
                              setBuyerPhone(e.target.value);
                              clearFieldError('phone');
                            }}
                            aria-invalid={Boolean(fieldErrors.phone)}
                            aria-describedby={fieldErrors.phone ? 'checkout-phone-error' : undefined}
                            className={`w-full pl-9 pr-4 py-3 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border ${fieldErrors.phone ? 'border-red-400' : 'border-brand-border'} focus:border-brand-secondary focus:outline-none transition-all`}
                          />
                        </div>
                        {fieldErrors.phone && (
                          <p id="checkout-phone-error" role="alert" className="mt-1.5 flex items-start gap-1 text-[10px] font-sans leading-relaxed text-red-600">
                            <Info size={11} className="mt-0.5 shrink-0" />
                            {fieldErrors.phone}
                          </p>
                        )}
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      
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
                            onChange={(e) => {
                              setBuyerHall(e.target.value);
                              clearFieldError('hall');
                            }}
                            required
                            aria-invalid={Boolean(fieldErrors.hall)}
                            className={`w-full pl-9 pr-4 py-3 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border ${fieldErrors.hall ? 'border-red-400' : 'border-brand-border'} focus:border-brand-secondary focus:outline-none transition-all cursor-pointer`}
                          >
                            <option value="" disabled>
                              Select your residence hall
                            </option>
                            {COVENANT_HALLS.map((hall) => (
                              <option key={hall} value={hall}>
                                {hall}
                              </option>
                            ))}
                          </select>
                        </div>
                        {fieldErrors.hall && (
                          <p role="alert" className="mt-1.5 flex items-start gap-1 text-[10px] font-sans leading-relaxed text-red-600">
                            <Info size={11} className="mt-0.5 shrink-0" />
                            {fieldErrors.hall}
                          </p>
                        )}
                      </div>

                      {/* Room number optional — paired with the hall so the
                          add-on below can run full width. */}
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

                    </div>

                    <div>
                      <label className="block text-[10px] font-sans font-bold text-brand-secondary uppercase tracking-widest mb-1.5">
                        EMAIL *
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/45">
                          <Mail size={13} />
                        </span>
                        <input
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          required
                          placeholder="e.g. daniel@example.com"
                          value={buyerEmail}
                          onChange={(e) => {
                            setBuyerEmail(e.target.value);
                            clearFieldError('email');
                          }}
                          aria-invalid={Boolean(fieldErrors.email)}
                          aria-describedby={fieldErrors.email ? 'checkout-email-error' : undefined}
                          className={`w-full pl-9 pr-4 py-3 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border ${fieldErrors.email ? 'border-red-400' : 'border-brand-border'} focus:border-brand-secondary focus:outline-none transition-all`}
                        />
                      </div>
                      {fieldErrors.email ? (
                        <p id="checkout-email-error" role="alert" className="mt-1.5 flex items-start gap-1 text-[10px] font-sans leading-relaxed text-red-600">
                          <Info size={11} className="mt-0.5 shrink-0" />
                          {fieldErrors.email}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-[10px] font-sans leading-relaxed text-brand-primary/55">
                          Your receipt and order updates are sent here. Required — and free.
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-brand-border bg-brand-card/50 px-4 py-3 text-[10px] font-sans leading-relaxed text-brand-primary/70">
                      <strong className="text-brand-primary">Service charges are non-refundable.</strong>{" "}
                      The ₦{UPDATES_FEE} alerts add-on is already in your total — untick it under the Pay button to
                      remove it. It and the ₦{PIC_FEE} knotted-tie photo charge pay for the platform, hosting and
                      delivery of that service. The work is done the moment it is sent, so those charges cannot be
                      refunded. Your receipt email is free. The ties themselves stay refundable under our normal
                      pickup policy.
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

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-7 py-3.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-sans tracking-widest uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {isSubmitting ? 'CONNECTING GATEWAY...' : `PAY ₦${totalAmountPayable.toLocaleString()}`}
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
                  <div className="text-center max-w-lg mx-auto space-y-3">
                    <div className="w-14 h-14 rounded-full bg-brand-secondary/10 border border-brand-secondary/30 flex items-center justify-center text-brand-secondary mx-auto">
                      <CheckCircle size={28} />
                    </div>

                    <h2 className="font-display font-black text-2xl sm:text-3xl uppercase text-brand-primary tracking-tight">
                      Order Reserved
                    </h2>
                    
                    <p className="text-xs sm:text-sm text-brand-primary/80 font-sans leading-relaxed">
                      Congratulations <strong>{buyerName}</strong>! Your order has been placed and confirmed for hall delivery.
                    </p>
                  </div>

                  {/* ── PRINTING RECEIPT ANIMATION SLOT ── */}
                  <div className="relative max-w-lg mx-auto">
                    {/* Printer Slot Hardware Device Top */}
                    <div className="bg-[#11261B] text-[#FFFEF2] rounded-t-2xl px-5 py-3 border-b-4 border-amber-500/80 shadow-md flex items-center justify-between relative z-20">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-[#FFFEF2]/90">
                          {isPrintingReceipt ? '🖨️ Printing Receipt...' : 'Receipt Printed Ready'}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-300 uppercase tracking-widest font-semibold">
                        Knotify Register #01
                      </span>
                    </div>

                    {/* The Physical Receipt Slip (with roll-out slide animation) */}
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ 
                        height: 'auto', 
                        opacity: 1,
                        transition: { duration: 1.6, ease: [0.16, 1, 0.3, 1] } 
                      }}
                      className="overflow-hidden bg-[#FFFEF2] border-x border-b border-black/15 rounded-b-2xl shadow-xl relative z-10 text-left p-6 sm:p-7 space-y-5"
                      id="order-printable-receipt"
                    >
                      {/* Receipt Header */}
                      <div className="text-center pb-4 border-b border-dashed border-black/20">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <img src="/logo-k.svg" alt="Knotify" className="h-6 w-auto" />
                          <span className="font-serif font-black text-lg tracking-wider text-brand-primary uppercase">Knotify Ties</span>
                        </div>
                        <p className="text-[10px] font-mono tracking-widest uppercase text-brand-primary/60">Covenant University · Resumption Batch</p>
                        <p className="text-[9px] font-mono text-brand-primary/50 mt-0.5">
                          Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      {/* Unique reservation ID barcode look */}
                      <div className="bg-brand-bg border border-brand-border rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-mono tracking-widest uppercase text-brand-primary/50 block font-semibold">ORDER / RES ID</span>
                          <span className="font-mono text-sm sm:text-base font-bold text-brand-primary tracking-wider">{generatedId || generatedTxRef || 'KNT-CONFIRMED'}</span>
                        </div>
                        <button 
                          onClick={copyToClipboard}
                          className="px-2.5 py-1.5 bg-brand-card hover:bg-brand-bg border border-brand-border rounded-lg text-xs font-mono font-medium text-brand-primary transition-colors flex items-center gap-1 cursor-pointer"
                          title="Copy ID"
                        >
                          {copiedId ? <Check size={12} className="text-emerald-700" /> : <Clipboard size={12} />}
                          <span>{copiedId ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      {/* Customer info table */}
                      <div className="space-y-1.5 text-xs font-sans border-b border-dashed border-black/20 pb-4">
                        <div className="flex justify-between">
                          <span className="text-brand-primary/60">Customer Name:</span>
                          <span className="font-semibold text-brand-primary">{buyerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-brand-primary/60">Contact Phone:</span>
                          <span className="font-semibold text-brand-primary">{buyerPhone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-brand-primary/60">Delivery Hall:</span>
                          <span className="font-semibold text-brand-primary">{buyerHall}{roomNumber ? ` · Room ${roomNumber}` : ''}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-brand-primary/60">Assigned Station:</span>
                          <span className="font-semibold text-brand-secondary">{getAssignedPickupPoint(buyerHall)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-brand-primary/60">Payment Status:</span>
                          <span className="font-semibold text-emerald-800 uppercase tracking-wider">● Confirmed Paid</span>
                        </div>
                      </div>

                      {/* Amount Breakdown */}
                      <div className="space-y-2 text-xs font-sans pb-4 border-b border-dashed border-black/20">
                        <div className="flex justify-between text-brand-primary/70">
                          <span>Items Total ({totalItems || 1}):</span>
                          <span className="font-mono">₦{itemsTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-brand-primary/70">
                          <span>Hall Delivery Handoff:</span>
                          <span className="font-mono">₦{DELIVERY_FEE.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-brand-primary font-bold text-sm pt-2 border-t border-brand-border">
                          <span>Total Paid:</span>
                          <span className="font-mono text-brand-secondary font-black">₦{totalAmountPayable.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Jagged / Tear Bottom Edge */}
                      <div className="text-center pt-1">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary/50">
                          *** THANK YOU FOR DRESSING SHARP ***
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* ── ACTION BUTTON OPTIONS: GO BACK, PRINT, SHARE RECEIPT ── */}
                  <div className="max-w-lg mx-auto space-y-3 pt-2">
                    {shareFeedback && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-sans text-center animate-fadeIn">
                        {shareFeedback}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Go Back Option */}
                      <button
                        onClick={handleFinished}
                        className="py-3 px-4 bg-brand-bg hover:bg-brand-card text-brand-primary border border-brand-border font-sans font-bold text-xs rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                      >
                        <ArrowLeft size={14} />
                        <span>Go Back</span>
                      </button>

                      {/* Print Receipt Option */}
                      <button
                        onClick={handlePrintReceipt}
                        className="py-3 px-4 bg-brand-bg hover:bg-brand-card text-brand-primary border border-brand-border font-sans font-bold text-xs rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                      >
                        <Printer size={14} className="text-brand-secondary" />
                        <span>Print Receipt</span>
                      </button>

                      {/* Share Receipt Option */}
                      <button
                        onClick={handleShareReceipt}
                        className="py-3 px-4 bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] font-sans font-bold text-xs rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                      >
                        <Share2 size={14} />
                        <span>Share Receipt</span>
                      </button>
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
                        <span><strong>Print or screenshot</strong> your receipt to keep your unique ID handy.</span>
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
                        <span>Your order is already recorded under your profile page.</span>
                      </div>
                    </div>
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
              </motion.div>
            )}

            </AnimatePresence>

            {checkoutStep !== 'success' && stripProducts.length > 0 && (
              <section
                className="rounded-3xl border border-brand-border/60 bg-brand-card/55 p-5 sm:p-6 text-left shadow-xs"
                id="checkout-ties-strip"
              >
                <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-brand-secondary select-none">
                      Pairs with your order
                    </span>
                    <h2 className="font-serif font-bold text-xl sm:text-2xl text-brand-primary tracking-tight">
                      Complete the look
                    </h2>
                    <p className="mt-1 text-[11px] font-sans text-brand-primary/60">
                      In stock now — add one before you pay.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onContinueShopping}
                    className="text-[10px] font-mono font-bold tracking-widest uppercase text-brand-primary hover:text-brand-secondary transition-colors cursor-pointer border-b border-brand-border hover:border-brand-secondary pb-0.5"
                  >
                    View all ties
                  </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1" id="checkout-ties-strip-list">
                  {stripProducts.map((product) => {
                    const price = product.price ?? product.originalPrice;
                    const discountPercent =
                      product.originalPrice > 0 && product.originalPrice > price
                        ? Math.round(((product.originalPrice - price) / product.originalPrice) * 100)
                        : 0;

                    return (
                      <div key={product.id} className="w-40 sm:w-44 shrink-0" id={`strip-${product.id}`}>
                        <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-brand-card border border-brand-border/70 relative">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
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

                          {discountPercent > 0 && (
                            <span className="absolute top-2 left-2 bg-brand-secondary text-brand-bg font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 font-bold rounded">
                              -{discountPercent}%
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-[11px] font-sans text-brand-primary leading-snug line-clamp-2">
                          {product.name}
                        </p>

                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-xs font-sans font-bold text-brand-primary">₦{price.toLocaleString()}</span>
                          {discountPercent > 0 && (
                            <span className="text-[9px] font-sans text-brand-secondary/50 line-through">
                              ₦{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {onAddToCart && (
                          <button
                            type="button"
                            onClick={() => onAddToCart(product, 1)}
                            className="mt-2 w-full py-2 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-mono text-[9px] tracking-widest uppercase font-bold rounded-full transition-colors cursor-pointer"
                          >
                            + Add to bag
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT SIDE CONTENT: STICKY BILLING SUMMARY */}
          {checkoutStep !== 'success' ? (
            <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
              
              <div className="bg-transparent border border-brand-border/40 rounded-3xl p-6 text-left">
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
                    <span className="font-sans text-sm">{formatNaira(DELIVERY_FEE)}</span>
                  </div>

                  {updatesFee > 0 && (
                    <div className="flex justify-between text-brand-primary/70">
                      <span>Email for future updates</span>
                      <span className="font-sans font-bold text-brand-primary">{formatNaira(updatesFee)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-brand-primary/80 text-xs pt-1.5 border-t border-brand-border/40">
                    <span className="font-semibold">Total Payable</span>
                    <span className="font-sans font-bold text-base text-brand-primary">₦{totalAmountPayable.toLocaleString()}</span>
                  </div>
                </div>

                {/* Main Call to Action Button inside sticky card */}
                {checkoutStep === 'cart' ? (
                  <button
                    onClick={handleStartCheckout}
                    disabled={isCheckingAvailability || checkoutItems.length === 0}
                    className="w-full mt-4 py-3.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-sans tracking-wider uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
                  >
                    {isCheckingAvailability ? 'Checking availability...' : 'Proceed to Details'}
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenConfirm()}
                      disabled={isSubmitting}
                      className="w-full mt-4 py-3.5 bg-brand-secondary hover:bg-brand-accent text-brand-bg font-sans tracking-wider uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 active:scale-98"
                    >
                      {isSubmitting ? 'Connecting Gateway...' : `Pay ₦${totalAmountPayable.toLocaleString()}`}
                    </button>

                    {/* The ₦100 alerts add-on is pre-added to the total; this is the
                        tick box under the Pay button that removes it. */}
                    <label
                      htmlFor="checkout-alerts-addon"
                      className="mt-3 flex items-start gap-2.5 rounded-xl border border-brand-border/60 bg-brand-bg/50 px-3 py-2.5 text-left cursor-pointer"
                    >
                      <input
                        id="checkout-alerts-addon"
                        type="checkbox"
                        checked={emailUpdates}
                        onChange={(event) => setEmailUpdates(event.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-brand-secondary cursor-pointer shrink-0"
                      />
                      <span className="text-[10px] font-sans leading-relaxed text-brand-primary/70">
                        <span className="font-semibold text-brand-primary">
                          Email updates +{formatNaira(UPDATES_FEE)}
                        </span>{" "}
                        included — untick to remove it.
                        <span className="mt-0.5 block text-brand-primary/45">
                          Receipt emails stay free either way.
                        </span>
                      </span>
                    </label>
                  </>
                )}

                <div className="text-[10px] text-brand-primary/50 font-sans text-center mt-3 leading-relaxed">
                  🔒 Encrypted connection · Direct hall delivery
                </div>
              </div>

              {/* TRUST REASSURANCE CARD */}
              <div className="bg-transparent p-5 rounded-2xl border border-brand-border/40 text-[11px] font-sans leading-relaxed text-brand-primary/80 text-left space-y-1.5">
                <p className="font-bold text-brand-primary flex items-center gap-1.5 text-xs">
                  <ShieldCheck size={14} className="text-brand-secondary" />
                  Low-Risk Student Guarantee
                </p>
                <p className="text-xs text-brand-primary/65 leading-relaxed">
                  Direct delivery to your residence hall lobby on resumption week. Ties can be refunded or exchanged at pickup if unsuited btw 24-48hrs. <b> The optional ₦{UPDATES_FEE} alerts add-on and the ₦{DELIVERY_FEE} delivery &amp; packaging fee are non-refundable service fees, and receipt emails are always free. <br></br>Thank you.</b>
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

      {/* ── CONFIRM ORDER MODAL (Step before payment gateway) ── */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#FFFEF2] rounded-3xl p-6 sm:p-7 shadow-2xl border border-black/10 text-left space-y-5 relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-brand-primary/60 cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X size={15} />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest uppercase text-brand-secondary font-bold">Step 3 of 3</span>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-brand-primary">Confirm Your Order</h3>
                <p className="text-xs text-brand-primary/65 font-sans leading-relaxed">
                  Please review your details before proceeding to pay.
                </p>
              </div>

              {/* Order Info Summary */}
              <div className="bg-[#F8F6EC] rounded-2xl p-4 border border-brand-secondary/15 space-y-3 text-xs font-sans">
                <div className="flex justify-between border-b border-black/5 pb-2">
                  <span className="text-brand-primary/60">Recipient:</span>
                  <span className="font-semibold text-brand-primary">{buyerName}</span>
                </div>
                <div className="flex justify-between border-b border-black/5 pb-2">
                  <span className="text-brand-primary/60">Phone:</span>
                  <span className="font-semibold text-brand-primary">{buyerPhone}</span>
                </div>
                <div className="flex justify-between border-b border-black/5 pb-2">
                  <span className="text-brand-primary/60">Email:</span>
                  <span className="font-semibold text-brand-primary truncate max-w-[180px]">
                    {buyerEmail}
                  </span>
                </div>
                {emailUpdates && (
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-brand-primary/60">Updates:</span>
                    <span className="font-semibold text-brand-primary">
                      Added (+{formatNaira(UPDATES_FEE)})
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b border-black/5 pb-2">
                  <span className="text-brand-primary/60">Hall & Room:</span>
                  <span className="font-semibold text-brand-primary">{buyerHall}{roomNumber ? `, ${roomNumber}` : ''}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="font-semibold text-brand-primary">Total Payable:</span>
                  <span className="font-bold text-sm text-brand-secondary">₦{totalAmountPayable.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full sm:w-1/3 py-3 rounded-full border border-brand-border text-brand-primary text-xs font-sans font-bold hover:bg-black/5 transition-colors cursor-pointer text-center"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={isSubmitting}
                  className="w-full sm:w-2/3 py-3 rounded-full bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ₦{totalAmountPayable.toLocaleString()}</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
