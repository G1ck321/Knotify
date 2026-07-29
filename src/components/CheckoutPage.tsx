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
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, COVENANT_HALLS } from '../types';
import TiePlaceholder from './TiePlaceholder';
import { getAccessToken } from '../lib/authStorage';
import {
  clearPaymentReturnParams,
  clearPendingCheckout,
  fetchOrderStatus,
  loadPendingCheckout,
  parsePaymentReturnParams,
  PAYMENT_FAILURE_STATUSES,
  PAYMENT_SUCCESS_STATUSES,
  savePendingCheckout,
} from '../lib/checkoutPayment';

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
  
  // Student Form Details
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [parentsPhone, setParentsPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerHall, setBuyerHall] = useState(COVENANT_HALLS[0] || 'Daniel Hall');
  const [roomNumber, setRoomNumber] = useState('');
  const [matricNumber, setMatricNumber] = useState('');

  // Payment Execution State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [generatedTxRef, setGeneratedTxRef] = useState('');

  // Fixed Delivery Fee (₦200 across all residence halls)
  const DELIVERY_FEE = 200;

  // Pre-fill user details if logged in
  useEffect(() => {
    if (currentUser) {
      setBuyerName(currentUser.name || currentUser.full_name || '');
      setBuyerPhone(currentUser.telegramPhone || currentUser.phone || '');
      setParentsPhone(currentUser.parentsNumber || '');
      setBuyerEmail(currentUser.email || '');
    }
  }, [currentUser]);

  // Check URL query parameters for Flutterwave payment callback redirect
  useEffect(() => {
    const { status, txRef } = parsePaymentReturnParams();
    if (!status && !txRef) return;

    clearPaymentReturnParams();

    const finalizePaidOrder = (confirmedTxRef: string) => {
      const pending = loadPendingCheckout(confirmedTxRef);
      setGeneratedTxRef(confirmedTxRef);

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
          deposit: pending.totalAmountPayable,
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
      onClearCart();
    };

    const handlePaymentReturn = async () => {
      if (txRef && PAYMENT_SUCCESS_STATUSES.has(status)) {
        const order = await fetchOrderStatus(txRef);
        if (order && order.status === 'paid') {
          finalizePaidOrder(txRef);
          return;
        }

        // Webhook may lag behind the redirect — trust gateway success when order is still pending.
        if (order && order.status === 'pending') {
          finalizePaidOrder(txRef);
          return;
        }

        setPaymentError('We could not confirm your payment yet. Please contact support with your tx_ref.');
        setCheckoutStep('form');
        return;
      }

      if (status && PAYMENT_FAILURE_STATUSES.has(status)) {
        setPaymentError('Payment was cancelled or failed. Your bag is still saved — try again when ready.');
        setCheckoutStep('form');
        return;
      }

      if (status && !PAYMENT_SUCCESS_STATUSES.has(status)) {
        setPaymentError('Payment was not completed. No charge was made.');
        setCheckoutStep('cart');
      }
    };

    handlePaymentReturn();
  }, []);

  // Pricing calculations
  const totalItems = cartItems.reduce((acc, item) => acc + (item?.quantity ?? 0), 0);
  const itemsTotal = cartItems.reduce((acc, item) => acc + (item?.product?.price ?? 0) * (item?.quantity ?? 0), 0);
  const totalAmountPayable = itemsTotal > 0 ? itemsTotal + DELIVERY_FEE : 0;

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
      setPaymentError('Please fill in your name, contact phone, and email address.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    const productNames = cartItems.map(item => `${item.product.name} (x${item.quantity})`).join(', ');
    const preferredColor = cartItems.map(item => item.product.color).join(', ');

    const orderPayload = {
      name: buyerName,
      email: buyerEmail,
      telegramPhone: buyerPhone,
      parentsNumber: parentsPhone || buyerPhone,
      whatsApp: buyerPhone,
      matricNumber: matricNumber || undefined,
      address: buyerHall,
      roomNumber: roomNumber || 'N/A',
      amount: itemsTotal,
      items: cartItems.map(item => ({
        item_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        image_url: item.product.image || undefined,
      })),
      orderDetails: cartItems.map(item => `${item.quantity}x ${item.product.name}`).join(', ')
    };

    try {
      const token = getAccessToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'https://my-backend-1-7fft.onrender.com';
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || 'Could not start payment');
      }

      const txRef = data.tx_ref;
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

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      throw new Error('Payment gateway did not return a checkout URL');
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Could not connect to payment gateway');
      setIsProcessingPayment(false);
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
      
      {/* 1. PROGRESS BAR / HEADER */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-border pb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-brand-primary uppercase tracking-tight">
            Checkout & Direct Payment
          </h1>
          <p className="text-xs text-brand-secondary/85 mt-1 font-sans">
            Direct online payment via Flutterwave. Instant confirmation & hall lobby delivery.
          </p>
        </div>

        {/* Step Indicators */}
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
            Your shopping bag is currently empty. Explore our collection of chapel-compliant ties to complete your checkout.
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
                      Shopping Bag Items ({cartItems.length})
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
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-[9px] font-sans bg-brand-bg border border-brand-border px-2 py-0.5 text-brand-primary/70 uppercase font-semibold">
                                  {item.product.category}
                                </span>
                                <span className="text-[9px] font-sans bg-emerald-950/20 border border-emerald-800/30 px-2 py-0.5 text-emerald-700 font-semibold uppercase">
                                  Full Direct Purchase
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
                      PROCEED TO DELIVERY & PAYMENT
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* SCREEN 2: CUSTOMER & PAYMENT DETAILS FORM */}
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
                      Delivery & Payment Coordinates
                    </h2>
                    <p className="text-xs text-brand-secondary mt-1 font-sans">
                      Provide student details for instant delivery assignment to your Covenant residence hall.
                    </p>
                  </div>

                  {paymentError && (
                    <div className="mb-6 bg-red-950/30 border border-red-800/40 text-red-400 p-4 rounded-2xl text-xs font-sans">
                      {paymentError}
                    </div>
                  )}

                  <form onSubmit={handleInitiatePayment} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
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
                            className="w-full pl-9 pr-4 py-3.5 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border border-brand-border focus:border-brand-secondary focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Email input */}
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
                          RESIDENCE HALL *
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/45">
                            <Building size={13} />
                          </span>
                          <select
                            value={buyerHall}
                            onChange={(e) => setBuyerHall(e.target.value)}
                            className="w-full pl-9 pr-4 py-3.5 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border border-brand-border focus:border-brand-secondary focus:outline-none transition-all cursor-pointer"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Room Number */}
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-brand-secondary uppercase tracking-widest mb-1.5">
                          ROOM NUMBER
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/45">
                            <Hash size={13} />
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. A304"
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                            className="w-full pl-9 pr-4 py-3.5 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border border-brand-border focus:border-brand-secondary focus:outline-none transition-all uppercase"
                          />
                        </div>
                      </div>

                      {/* Matric Number */}
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-brand-secondary uppercase tracking-widest mb-1.5">
                          MATRIC NUMBER (OPTIONAL)
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/45">
                            <Hash size={13} />
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. 21CG028491"
                            value={matricNumber}
                            onChange={(e) => setMatricNumber(e.target.value)}
                            className="w-full pl-9 pr-4 py-3.5 bg-brand-bg text-brand-primary font-sans text-xs rounded-xl border border-brand-border focus:border-brand-secondary focus:outline-none transition-all uppercase"
                          />
                        </div>
                      </div>

                    </div>

                    <div className="bg-brand-bg p-4 rounded-2xl border border-brand-border text-[11px] text-brand-primary/80 font-sans leading-relaxed">
                      <p className="font-bold text-brand-primary mb-1 flex items-center gap-1.5">
                        <Info size={13} className="text-brand-secondary" />
                        Targeted Payment Gateway: Flutterwave
                      </p>
                      Clicking <strong>PAY VIA FLUTTERWAVE</strong> opens Flutterwave's secure online checkout supporting Cards, Bank Transfer, USSD, and OPay. Standard campus delivery fee is fixed at ₦200.
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
                        disabled={isProcessingPayment}
                        className="w-full sm:w-auto px-8 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-sans tracking-widest uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                      >
                        {isProcessingPayment ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            CONNECTING GATEWAY...
                          </>
                        ) : (
                          <>
                            <CreditCard size={14} />
                            PAY ₦{totalAmountPayable.toLocaleString()} VIA FLUTTERWAVE
                          </>
                        )}
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
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.05] rounded-full filter blur-[80px] pointer-events-none" />

                  {/* Header confirmation */}
                  <div className="text-center max-w-lg mx-auto space-y-4 relative z-10">
                    <div className="w-14 h-14 rounded-full bg-emerald-950/40 border border-emerald-700/50 flex items-center justify-center text-emerald-400 mx-auto">
                      <CheckCircle size={28} />
                    </div>

                    <h2 className="font-display font-black text-2xl sm:text-3xl uppercase text-brand-primary tracking-tight">
                      Order Paid & Confirmed!
                    </h2>
                    
                    <p className="text-xs sm:text-sm text-brand-primary/80 font-sans leading-relaxed">
                      Payment successful! Your order has been logged and assigned for hall lobby delivery.
                    </p>
                  </div>

                  {/* High-End Coordinates Panel */}
                  <div className="bg-brand-bg border border-brand-border rounded-2xl p-6 space-y-5 relative z-10">
                    
                    {/* Unique transaction ref header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-border pb-4 gap-3">
                      <div>
                        <span className="text-[9px] font-sans text-brand-primary/50 block tracking-widest uppercase font-semibold">TRANSACTION REFERENCE (TX_REF)</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-sans text-base font-bold text-brand-primary tracking-wider">{generatedTxRef}</span>
                          <button 
                            onClick={copyToClipboard}
                            className="p-1.5 bg-brand-card border border-brand-border rounded-lg hover:text-brand-secondary hover:bg-brand-bg transition-colors text-brand-primary cursor-pointer"
                            title="Copy Ref"
                          >
                            {copiedId ? <Check size={13} className="text-emerald-500" /> : <Clipboard size={13} />}
                          </button>
                        </div>
                      </div>

                      <div className="bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 px-4 py-2 rounded-xl text-center">
                        <span className="text-[9px] font-sans block tracking-wider uppercase font-semibold">PAYMENT STATUS</span>
                        <span className="font-sans text-base font-extrabold flex items-center gap-1.5 justify-center">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          PAID IN FULL
                        </span>
                      </div>
                    </div>

                    {/* Meta coordinates breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 text-xs font-sans uppercase text-brand-secondary">
                      <div className="bg-brand-card p-3.5 rounded-xl border border-brand-border text-left">
                        <p className="text-[9px] text-brand-primary/50 tracking-wider font-semibold">RESIDENCE HALL / ROOM</p>
                        <p className="text-brand-primary font-bold text-xs mt-1">{buyerHall} {roomNumber ? `(Room ${roomNumber})` : ''}</p>
                      </div>

                      <div className="bg-brand-card p-3.5 rounded-xl border border-brand-border text-left">
                        <p className="text-[9px] text-brand-primary/50 tracking-wider font-semibold">ASSIGNED PICKUP POINT</p>
                        <p className="text-brand-secondary font-bold text-xs mt-1 leading-tight truncate" title={getAssignedPickupPoint(buyerHall)}>
                          {getAssignedPickupPoint(buyerHall)}
                        </p>
                      </div>

                      <div className="bg-brand-card p-3.5 rounded-xl border border-brand-border text-left">
                        <p className="text-[9px] text-brand-primary/50 tracking-wider font-semibold">ITEMS SUBTOTAL</p>
                        <p className="text-brand-primary font-bold text-xs mt-1">₦{itemsTotal.toLocaleString()}</p>
                      </div>

                      <div className="bg-brand-card p-3.5 rounded-xl border border-brand-border text-left">
                        <p className="text-[9px] text-brand-primary/50 tracking-wider font-semibold">DELIVERY FEE (FIXED)</p>
                        <p className="text-brand-primary font-bold text-xs mt-1">₦{DELIVERY_FEE}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reassurance Action Block */}
                  <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-left space-y-4 relative z-10">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-brand-secondary flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-brand-secondary" />
                      ORDER PICKUP INSTRUCTIONS
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[11.5px] font-sans text-brand-primary/80 leading-tight">
                      <div className="flex items-start gap-2.5 bg-brand-bg p-3 rounded-xl border border-brand-border">
                        <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span><strong>Keep your transaction reference</strong> ({generatedTxRef}) saved or screenshotted.</span>
                      </div>
                      <div className="flex items-start gap-2.5 bg-brand-bg p-3 rounded-xl border border-brand-border">
                        <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span>Show your <strong>tx_ref</strong> at your assigned hall pickup point during resumption.</span>
                      </div>
                      <div className="flex items-start gap-2.5 bg-brand-bg p-3 rounded-xl border border-brand-border">
                        <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span>Keep your phone active for direct Telegram/WhatsApp dispatch notifications.</span>
                      </div>
                      <div className="flex items-start gap-2.5 bg-brand-bg p-3 rounded-xl border border-brand-border">
                        <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span>Zero extra fees upon pickup — your order is 100% paid and cleared.</span>
                      </div>
                    </div>
                  </div>

                  {/* JOIN CAMPUS COMMUNITIES BLOCK */}
                  <div className="bg-brand-bg border border-brand-border rounded-2xl p-6 text-left space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-emerald-400" />
                        JOIN OFFICIAL CAMPUS DISPATCH CHANNELS
                      </p>
                      <span className="text-[9px] font-sans bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 text-emerald-400 rounded uppercase font-semibold">
                        LIVE UPDATES
                      </span>
                    </div>

                    <p className="text-xs text-brand-primary/80 font-sans leading-relaxed">
                      Connect to our official Covenant student channels to receive real-time hall delivery alerts, lobby dispatch times, and direct customer support.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      {/* Telegram Channel Button */}
                      <a
                        href="https://t.me/knotifycu_bot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3.5 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0088cc] text-white flex items-center justify-center font-bold text-xs">
                            TG
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-brand-primary group-hover:text-[#0088cc] transition-colors">Telegram Dispatch Bot</p>
                            <p className="text-[10px] text-brand-primary/60">Live Order Tracking & Bot</p>
                          </div>
                        </div>
                        <ExternalLink size={13} className="text-[#0088cc]" />
                      </a>

                      {/* WhatsApp Community Button */}
                      <a
                        href="https://chat.whatsapp.com/knotifycu"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center font-bold text-xs">
                            WA
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-brand-primary group-hover:text-[#25D366] transition-colors">WhatsApp Guild</p>
                            <p className="text-[10px] text-brand-primary/60">Student Community Group</p>
                          </div>
                        </div>
                        <ExternalLink size={13} className="text-[#25D366]" />
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

          {/* RIGHT SIDE CONTENT: STICKY BILLING OVERVIEW */}
          {checkoutStep !== 'success' && (
            <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
              
              {/* STICKY CARD */}
              <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm text-left">
                <h3 className="text-xs font-sans tracking-widest uppercase font-bold text-brand-primary/60 mb-4 pb-2 border-b border-brand-border">
                  Order Payment Summary
                </h3>

                <div className="space-y-3.5 text-xs font-sans uppercase pb-5 border-b border-brand-border">
                  <div className="flex justify-between text-brand-primary/70">
                    <span>Items total ({totalItems})</span>
                    <span className="font-sans font-bold text-brand-primary">₦{itemsTotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-brand-primary/70">
                    <span>Campus Delivery & Dev Fee</span>
                    <span className="font-sans font-bold text-brand-primary">₦{DELIVERY_FEE}</span>
                  </div>

                  <div className="flex justify-between text-emerald-400 font-bold text-sm pt-2 border-t border-brand-border">
                    <span>Total Amount Payable</span>
                    <span className="font-sans font-extrabold">₦{totalAmountPayable.toLocaleString()}</span>
                  </div>
                </div>

                {/* Main Call to Action Button inside sticky card */}
                {checkoutStep === 'cart' ? (
                  <button
                    onClick={handleStartCheckout}
                    className="w-full mt-5 py-4 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-sans tracking-widest uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    PROCEED TO PAYMENT
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleInitiatePayment}
                    disabled={isProcessingPayment}
                    className="w-full mt-5 py-4 bg-emerald-700 hover:bg-emerald-600 text-white font-sans tracking-widest uppercase text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        PROCESSING...
                      </>
                    ) : (
                      <>
                        <CreditCard size={13} />
                        PAY ₦{totalAmountPayable.toLocaleString()}
                      </>
                    )}
                  </button>
                )}

                <div className="text-[10px] text-brand-primary/50 font-sans text-center mt-3 leading-relaxed">
                  🔒 Encrypted connection. Target Gateway: Flutterwave.
                </div>
              </div>

              {/* TRUST REASSURANCE CARD */}
              <div className="bg-brand-card p-5 rounded-2xl border border-brand-border text-[11.5px] font-sans leading-relaxed text-brand-primary/85 text-left space-y-2.5">
                <p className="font-bold text-brand-primary flex items-center gap-2 text-xs">
                  <ShieldCheck size={15} className="text-brand-secondary" />
                  Buyer Protection Policy
                </p>
                <p className="text-xs text-brand-primary/70">
                  Direct online payments are processed through Flutterwave's PCI-DSS compliant engine. 
                </p>
                <p className="text-xs text-brand-primary/70">
                  Your order is backed by our <strong>Authenticity & Quality Guarantee</strong>: if your tie presents any flaw upon hall delivery, instant replacement or full refund is provided.
                </p>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
