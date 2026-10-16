import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Calendar, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  ShoppingBag, 
  Edit3, 
  Save, 
  Heart,
  Copy, 
  Check, 
  QrCode, 
  X, 
  LogOut, 
  LogIn, 
  Star, 
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { Product, Reservation, COVENANT_HALLS } from '../types';
import TiePlaceholder from './TiePlaceholder';
import { getBackendUrl } from '../lib/checkoutPayment';

interface DashboardProps {
  currentUser: any;
  onUpdateUser: (updatedUser: any) => void;
  reservations: Reservation[];
  onUpdateReservation: (updatedRes: Reservation) => void;
  wishlist: string[];
  products: Product[];
  onToggleWishlist: (product: Product, e?: React.MouseEvent) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onLogout?: () => void;
  onOpenAuth?: () => void;
  setCurrentTab?: (tab: 'home' | 'marketplace' | 'sell' | 'checkout' | 'wishlist' | 'dashboard') => void;
}

export default function Dashboard({
  currentUser,
  onUpdateUser,
  reservations,
  onUpdateReservation,
  wishlist,
  products,
  onToggleWishlist,
  onAddToCart,
  onLogout,
  onOpenAuth,
  setCurrentTab,
}: DashboardProps) {
  // Tabs: 'reservations' | 'wishlist' | 'settings' | 'reviews'
  const [activeTab, setActiveTab] = useState<'reservations' | 'wishlist' | 'settings' | 'reviews'>('reservations');
  
  // Filter for reservations: 'all' | 'pending' | 'completed'
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Modals state
  const [activePassRes, setActivePassRes] = useState<Reservation | null>(null);
  const [activeRescheduleRes, setActiveRescheduleRes] = useState<Reservation | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  
  // Copy to clipboard state
  const [copiedResId, setCopiedResId] = useState<string | null>(null);

  // Profile edit form state
  const [editName, setEditName] = useState(currentUser?.name || currentUser?.full_name || '');
  const [editPhone, setEditPhone] = useState(currentUser?.telegramPhone || currentUser?.phone || '');
  const [editRoom, setEditRoom] = useState(currentUser?.roomNumber || '');
  const [editHall, setEditHall] = useState(currentUser?.residenceHall || currentUser?.address || COVENANT_HALLS[0]);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Review form state
  const [reviewEmail, setReviewEmail] = useState(currentUser?.email || '');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoveredRating, setReviewHoveredRating] = useState<number | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Sync settings when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || currentUser.full_name || '');
      setEditPhone(currentUser.telegramPhone || currentUser.phone || '');
      setEditRoom(currentUser.roomNumber || '');
      setEditHall(currentUser.residenceHall || currentUser.address || COVENANT_HALLS[0]);
      setReviewEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewEmail || !reviewText) {
      setReviewError('Please enter your email and your review text.');
      return;
    }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const response = await fetch(`${getBackendUrl()}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: reviewEmail.trim(),
          review: reviewText.trim(),
          review_text: reviewText.trim(),
          text: reviewText.trim(),
          rating: reviewRating,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      setReviewSuccess(true);
      setReviewText('');
    } catch {
      setReviewError('Unable to send review right now. Please try again later.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Filter reservations for current user
  const userReservations = currentUser ? reservations.filter(
    (res) =>
      (res.name && currentUser.name && res.name.toLowerCase() === currentUser.name.toLowerCase()) ||
      (res.phone && (res.phone === currentUser.telegramPhone || res.phone === currentUser.phone)) ||
      (res.email && currentUser.email && res.email.toLowerCase() === currentUser.email.toLowerCase())
  ) : [];

  // Categorize for filters
  const filteredReservations = userReservations.filter((res) => {
    const isCompleted = res.status === 'Collected';
    if (filter === 'pending') return !isCompleted;
    if (filter === 'completed') return isCompleted;
    return true; // 'all'
  });

  // Count badges
  const pendingCount = userReservations.filter((res) => res.status !== 'Collected').length;
  const completedCount = userReservations.filter((res) => res.status === 'Collected').length;

  // Find wishlist items
  const savedProducts = wishlist
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  // Actions
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const updated = {
      ...currentUser,
      name: editName.trim(),
      full_name: editName.trim(),
      telegramPhone: editPhone.trim(),
      phone: editPhone.trim(),
      roomNumber: editRoom.trim(),
      residenceHall: editHall,
      address: editHall
    };
    
    onUpdateUser(updated);
    setSettingsSuccess(true);
    setTimeout(() => {
      setSettingsSuccess(false);
    }, 3500);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedResId(code);
    setTimeout(() => setCopiedResId(null), 2000);
  };

  const toggleReservationStatus = (res: Reservation) => {
    const nextStatus = res.status === 'Collected' ? 'Ready for Pickup' : 'Collected';
    onUpdateReservation({
      ...res,
      status: nextStatus,
    });
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRescheduleRes || !rescheduleDate) return;

    const dateObj = new Date(rescheduleDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    onUpdateReservation({
      ...activeRescheduleRes,
      dateAdded: formattedDate
    });

    setActiveRescheduleRes(null);
    setRescheduleDate('');
  };

  // Mock QR Code Generator SVG
  const QRCodeSVG = ({ code }: { code: string }) => (
    <svg width="140" height="140" viewBox="0 0 140 140" className="mx-auto bg-white p-2.5 border border-black/10 rounded-xl shadow-xs">
      <rect x="10" y="10" width="30" height="30" fill="#1F3E2B" />
      <rect x="15" y="15" width="20" height="20" fill="white" />
      <rect x="20" y="20" width="10" height="10" fill="#1F3E2B" />
      
      <rect x="100" y="10" width="30" height="30" fill="#1F3E2B" />
      <rect x="105" y="15" width="20" height="20" fill="white" />
      <rect x="110" y="20" width="10" height="10" fill="#1F3E2B" />
      
      <rect x="10" y="100" width="30" height="30" fill="#1F3E2B" />
      <rect x="15" y="105" width="20" height="20" fill="white" />
      <rect x="20" y="110" width="10" height="10" fill="#1F3E2B" />

      <rect x="100" y="100" width="15" height="15" fill="#1F3E2B" />
      <rect x="105" y="105" width="5" height="5" fill="white" />
      
      <path d="M 50,10 H 60 V 20 H 70 V 30 H 60 V 50 H 50 Z" fill="#1F3E2B" />
      <path d="M 80,10 H 90 V 40 H 80 Z" fill="#1F3E2B" />
      <path d="M 10,50 H 30 V 60 H 10 Z" fill="#1F3E2B" />
      <path d="M 40,60 H 70 V 70 H 60 V 90 H 40 Z" fill="#1F3E2B" />
      <path d="M 80,60 H 110 V 70 H 120 V 90 H 100 V 80 H 80 Z" fill="#1F3E2B" />
      <path d="M 10,80 H 20 V 90 H 10 Z" fill="#1F3E2B" />
      <path d="M 50,100 H 70 V 110 H 80 V 130 H 70 V 120 H 50 Z" fill="#1F3E2B" />
      <path d="M 90,100 H 100 V 120 H 90 Z" fill="#1F3E2B" />
      <path d="M 30,120 H 40 V 130 H 30 Z" fill="#1F3E2B" />
      <path d="M 75,45 H 85 V 55 H 75 Z" fill="#1F3E2B" />
      <path d="M 95,45 H 105 V 55 H 95 Z" fill="#1F3E2B" />
    </svg>
  );

  // Helper for star rating text
  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5: return 'Excellent! Very satisfied';
      case 4: return 'Very good! Great experience';
      case 3: return 'Good, met expectations';
      case 2: return 'Fair, could be better';
      case 1: return 'Poor, needs improvement';
      default: return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-24 sm:pt-32 pb-28 sm:pb-16 space-y-6 sm:space-y-8 font-sans" id="knotify-user-profile">
      
      {/* 👤 1. PROFILE HEADER CARD */}
      <div className="bg-gradient-to-br from-[#1F3E2B] via-[#244732] to-[#172E20] rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-[#FFFEF2] relative overflow-hidden shadow-md border border-white/10">
        
        {/* Soft background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

        {currentUser ? (
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              
              {/* User details & avatar */}
              <div className="flex items-center gap-4 sm:gap-5 text-left">
                {/* Initials Avatar */}
                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-[#FFFEF2] text-[#1F3E2B] flex items-center justify-center font-display font-bold text-2xl sm:text-3xl shadow-sm ring-4 ring-[#D4AF37]/25 shrink-0">
                  {currentUser.name
                    ? currentUser.name
                        .split(' ')
                        .filter(Boolean)
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2)
                    : 'CU'}
                </div>
                
                {/* Name, Hall & Badges */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display font-bold text-xl sm:text-3xl text-[#FFFEF2] tracking-tight">
                      {currentUser.name || currentUser.full_name || 'Covenant Student'}
                    </h1>
                    <span className="inline-flex items-center gap-1 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F5E6B3] text-[10px] sm:text-xs font-medium px-2.5 py-0.5 rounded-full">
                      <ShieldCheck size={12} className="text-[#D4AF37]" />
                      {currentUser.isSeller ? 'Tie Merchant' : 'Verified Student'}
                    </span>
                  </div>

                  {/* Contact pills */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-[#FFFEF2]/80">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#D4AF37] shrink-0" />
                      <span>{currentUser.residenceHall || currentUser.address || 'Daniel Hall'}, Room {currentUser.roomNumber || '302'}</span>
                    </span>
                    <span className="hidden sm:inline text-white/30">•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={13} className="text-[#D4AF37] shrink-0" />
                      <span>{currentUser.telegramPhone || currentUser.phone || 'No phone set'}</span>
                    </span>
                    {currentUser.email && (
                      <>
                        <span className="hidden md:inline text-white/30">•</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Mail size={13} className="text-[#D4AF37] shrink-0" />
                          <span className="truncate max-w-[200px]">{currentUser.email}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-[#FFFEF2] text-[#1F3E2B] shadow-sm font-semibold'
                      : 'bg-white/10 hover:bg-white/20 text-[#FFFEF2] border border-white/15'
                  }`}
                >
                  <Edit3 size={14} />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => onLogout?.()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-rose-500/25 hover:border-rose-400/40 text-[#FFFEF2] border border-white/15 transition-all cursor-pointer"
                  title="Sign out of your account"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>

            {/* Quick Glance Stats Cards */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-4 border-t border-white/15">
              <button
                onClick={() => {
                  setActiveTab('reservations');
                  setFilter('all');
                }}
                className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-3 sm:p-4 text-left transition-all cursor-pointer group"
              >
                <span className="text-[10px] sm:text-xs text-[#FFFEF2]/70 block font-medium">My Orders</span>
                <span className="text-xl sm:text-2xl font-bold font-display text-[#FFFEF2] group-hover:scale-105 inline-block transition-transform">
                  {userReservations.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('reservations');
                  setFilter('pending');
                }}
                className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-3 sm:p-4 text-left transition-all cursor-pointer group"
              >
                <span className="text-[10px] sm:text-xs text-[#FFFEF2]/70 block font-medium">Ready for Pickup</span>
                <span className="text-xl sm:text-2xl font-bold font-display text-emerald-300 group-hover:scale-105 inline-block transition-transform">
                  {pendingCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('wishlist')}
                className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-3 sm:p-4 text-left transition-all cursor-pointer group"
              >
                <span className="text-[10px] sm:text-xs text-[#FFFEF2]/70 block font-medium">Saved Ties</span>
                <span className="text-xl sm:text-2xl font-bold font-display text-[#F5E6B3] group-hover:scale-105 inline-block transition-transform">
                  {wishlist.length}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Guest Welcome State */
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-left">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFFEF2] shrink-0">
                <User size={26} />
              </div>
              <div className="space-y-1">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-[#FFFEF2]">
                  Welcome to Knotify
                </h2>
                <p className="text-xs sm:text-sm text-[#FFFEF2]/80 max-w-md leading-relaxed">
                  Sign in to view your orders, get your hostel pickup pass, and save your delivery details.
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenAuth?.()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#FFFEF2] text-[#1F3E2B] hover:bg-white transition-all shadow-sm cursor-pointer shrink-0"
            >
              <LogIn size={15} />
              <span>Sign In / Sign Up</span>
            </button>
          </div>
        )}
      </div>

      {/* 📌 2. MODERN TAB NAVIGATION BAR */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 border-b border-black/8" id="dashboard-navbar-tabs">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'reservations'
              ? 'bg-brand-secondary text-[#FFFEF2] shadow-sm font-semibold'
              : 'text-brand-primary/70 hover:text-brand-primary hover:bg-black/5'
          }`}
        >
          <PackageCheck size={16} />
          <span>My Orders</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            activeTab === 'reservations' ? 'bg-white/20 text-white' : 'bg-black/5 text-brand-primary/70'
          }`}>
            {currentUser ? userReservations.length : 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'wishlist'
              ? 'bg-brand-secondary text-[#FFFEF2] shadow-sm font-semibold'
              : 'text-brand-primary/70 hover:text-brand-primary hover:bg-black/5'
          }`}
        >
          <Heart size={16} />
          <span>Wishlist</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            activeTab === 'wishlist' ? 'bg-white/20 text-white' : 'bg-black/5 text-brand-primary/70'
          }`}>
            {wishlist.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-brand-secondary text-[#FFFEF2] shadow-sm font-semibold'
              : 'text-brand-primary/70 hover:text-brand-primary hover:bg-black/5'
          }`}
        >
          <User size={16} />
          <span>Profile Details</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-brand-secondary text-[#FFFEF2] shadow-sm font-semibold'
              : 'text-brand-primary/70 hover:text-brand-primary hover:bg-black/5'
          }`}
        >
          <Star size={16} />
          <span>Leave a Review</span>
        </button>
      </div>

      {/* 📦 3. TAB CONTENTS */}
      <div className="min-h-[380px]">
        {/* If Guest/Not Signed In and trying to see orders or settings */}
        {!currentUser && activeTab !== 'wishlist' && activeTab !== 'reviews' ? (
          <div className="max-w-md mx-auto py-12 px-6 bg-white border border-black/8 rounded-2xl text-center space-y-5 shadow-xs">
            <div className="w-14 h-14 bg-emerald-50 text-brand-secondary border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
              <User size={24} />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-lg text-brand-primary">
                Please Sign In
              </h3>
              <p className="font-sans text-xs sm:text-sm text-neutral-600 leading-relaxed">
                You need to be signed in to see your tie orders, lobby pickup passes, and saved hostel details.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => onOpenAuth?.()}
                className="flex-1 py-2.5 bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Sign In to Knotify
              </button>
              <button
                onClick={() => setCurrentTab?.('marketplace')}
                className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer"
              >
                Browse Shop
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── A. MY ORDERS TAB ── */}
            {activeTab === 'reservations' && (
              <div className="space-y-5 text-left">
                
                {/* Filter pills & helpful tip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all border cursor-pointer ${
                        filter === 'all'
                          ? 'bg-brand-secondary text-[#FFFEF2] border-brand-secondary'
                          : 'bg-white hover:bg-neutral-50 text-neutral-600 border-black/10'
                      }`}
                    >
                      All Orders ({userReservations.length})
                    </button>
                    <button
                      onClick={() => setFilter('pending')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all border cursor-pointer ${
                        filter === 'pending'
                          ? 'bg-brand-secondary text-[#FFFEF2] border-brand-secondary'
                          : 'bg-white hover:bg-neutral-50 text-neutral-600 border-black/10'
                      }`}
                    >
                      Ready for Pickup ({pendingCount})
                    </button>
                    <button
                      onClick={() => setFilter('completed')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all border cursor-pointer ${
                        filter === 'completed'
                          ? 'bg-brand-secondary text-[#FFFEF2] border-brand-secondary'
                          : 'bg-white hover:bg-neutral-50 text-neutral-600 border-black/10'
                      }`}
                    >
                      Picked Up ({completedCount})
                    </button>
                  </div>

                  <div className="text-[11px] text-neutral-500 font-sans flex items-center gap-1.5 bg-amber-50/70 border border-amber-200/60 px-3 py-1.5 rounded-xl">
                    <Sparkles size={13} className="text-amber-600 shrink-0" />
                    <span>Show your pickup code at your hall lobby to collect your tie.</span>
                  </div>
                </div>

                {filteredReservations.length === 0 ? (
                  <div className="py-16 px-4 bg-white border border-dashed border-black/12 rounded-2xl text-center space-y-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
                      <Calendar size={22} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-brand-primary">No orders found</h4>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                        {filter === 'all'
                          ? "You haven't reserved any ties yet. Browse our store to order approved ties for resumption."
                          : `You have no orders currently in "${filter === 'pending' ? 'Ready for Pickup' : 'Picked Up'}" status.`}
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentTab?.('marketplace')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-secondary text-[#FFFEF2] text-xs font-semibold rounded-xl hover:bg-brand-accent transition-all cursor-pointer"
                    >
                      <span>Explore Ties</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    {filteredReservations.map((res) => {
                      const isPickedUp = res.status === 'Collected';
                      
                      return (
                        <div 
                          key={res.id}
                          className={`bg-white border rounded-2xl p-5 sm:p-6 transition-all shadow-xs flex flex-col justify-between gap-4 ${
                            isPickedUp 
                              ? 'border-black/8 opacity-80 hover:opacity-100' 
                              : 'border-brand-secondary/25 hover:border-brand-secondary/40 hover:shadow-md'
                          }`}
                        >
                          <div className="space-y-3.5">
                            {/* Card Top: Code & Status */}
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase block mb-1">
                                  Pickup Code
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm sm:text-base font-bold text-brand-secondary bg-neutral-100 px-2.5 py-1 rounded-lg border border-black/5">
                                    {res.id}
                                  </span>
                                  <button
                                    onClick={() => handleCopyCode(res.id)}
                                    className="p-1.5 rounded-lg text-neutral-500 hover:text-brand-secondary hover:bg-neutral-100 transition-colors cursor-pointer"
                                    title="Copy pickup code"
                                  >
                                    {copiedResId === res.id ? (
                                      <Check size={14} className="text-emerald-600" />
                                    ) : (
                                      <Copy size={14} />
                                    )}
                                  </button>
                                </div>
                              </div>
                              
                              {/* Status Badge */}
                              <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                isPickedUp
                                  ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                {isPickedUp ? 'Picked Up' : 'Ready for Pickup'}
                              </span>
                            </div>

                            {/* Product Name */}
                            <div>
                              <h4 className={`font-serif font-bold text-base sm:text-lg text-brand-primary ${isPickedUp ? 'line-through text-neutral-400' : ''}`}>
                                {res.productNames}
                              </h4>
                              <p className="text-xs text-neutral-500 mt-0.5">
                                Quantity: <span className="font-semibold text-neutral-700">{res.quantity} {res.quantity > 1 ? 'Ties' : 'Tie'}</span>
                              </p>
                            </div>

                            {/* Details 2x2 grid */}
                            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-black/5 text-xs">
                              <div className="bg-neutral-50 rounded-xl p-2.5">
                                <span className="text-[10px] text-neutral-500 block mb-0.5">Pickup Location</span>
                                <span className="font-semibold text-neutral-800 flex items-center gap-1">
                                  <MapPin size={12} className="text-emerald-600 shrink-0" />
                                  <span className="truncate">{res.pickupPoint || `${res.hall} Lobby`}</span>
                                </span>
                              </div>
                              <div className="bg-neutral-50 rounded-xl p-2.5">
                                <span className="text-[10px] text-neutral-500 block mb-0.5">Pickup Date</span>
                                <span className="font-semibold text-neutral-800 flex items-center gap-1">
                                  <Clock size={12} className="text-amber-600 shrink-0" />
                                  <span>{res.dateAdded}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Bottom: Action buttons */}
                          <div className="pt-3 border-t border-black/5 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActivePassRes(res)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
                              >
                                <QrCode size={13} />
                                <span>Digital Pass</span>
                              </button>

                              {!isPickedUp && (
                                <button
                                  onClick={() => {
                                    setActiveRescheduleRes(res);
                                    setRescheduleDate('');
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-secondary hover:bg-brand-secondary/10 transition-colors cursor-pointer"
                                >
                                  <Calendar size={13} />
                                  <span>Change Date</span>
                                </button>
                              )}
                            </div>

                            <button
                              onClick={() => toggleReservationStatus(res)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                isPickedUp
                                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              }`}
                            >
                              {isPickedUp ? 'Mark Uncollected' : 'Mark Picked Up'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── B. WISHLIST TAB ── */}
            {activeTab === 'wishlist' && (
              <div className="space-y-5 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-black/8">
                  <div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-brand-primary">
                      Your Saved Ties
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Ties you've bookmarked while exploring the catalog.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-brand-secondary bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    {savedProducts.length} {savedProducts.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {savedProducts.length === 0 ? (
                  <div className="py-16 px-4 bg-white border border-dashed border-black/12 rounded-2xl text-center space-y-4">
                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                      <Heart size={22} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-brand-primary">Your wishlist is empty</h4>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                        Tap the heart icon on any tie in the store to save it here so you can easily review and order it later.
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentTab?.('marketplace')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-secondary text-[#FFFEF2] text-xs font-semibold rounded-xl hover:bg-brand-accent transition-all cursor-pointer"
                    >
                      <span>Browse Ties</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" id="dashboard-wishlist-grid">
                    {savedProducts.map((prod) => (
                      <div 
                        key={prod.id} 
                        className="bg-white border border-black/8 rounded-2xl p-4 flex flex-col justify-between text-left transition-all duration-200 hover:shadow-md group relative"
                      >
                        {/* Remove button */}
                        <button
                          onClick={() => onToggleWishlist(prod)}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-white hover:bg-rose-50 border border-black/8 text-neutral-400 hover:text-rose-600 transition-colors shadow-xs cursor-pointer z-10"
                          title="Remove from wishlist"
                        >
                          <Trash2 size={13} />
                        </button>

                        <div className="space-y-3">
                          {/* Image */}
                          <div className="aspect-[4/3] w-full bg-neutral-50 rounded-xl overflow-hidden border border-black/5 relative flex items-center justify-center p-2">
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="h-full w-full object-contain group-hover:scale-105 transition-all duration-300"
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
                            <span className="absolute bottom-2 left-2 text-[9px] font-semibold bg-white/90 backdrop-blur-xs text-brand-secondary px-2 py-0.5 rounded-md border border-black/5">
                              {prod.category}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="space-y-1">
                            <h5 className="font-serif font-bold text-sm sm:text-base text-brand-primary line-clamp-1">
                              {prod.name}
                            </h5>
                            <p className="text-xs text-neutral-500">
                              {prod.stock > 0 ? (
                                <span className="text-emerald-700 font-medium">{prod.stock} available</span>
                              ) : (
                                <span className="text-rose-600 font-medium">Out of stock</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] text-neutral-400 block">Price</span>
                            <span className="font-bold text-sm text-brand-primary">
                              ₦{(prod.price ?? prod.originalPrice ?? 0).toLocaleString()}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              onAddToCart(prod, 1);
                              setCurrentTab?.('checkout');
                            }}
                            disabled={prod.stock === 0}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              prod.stock === 0
                                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                : 'bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] shadow-xs'
                            }`}
                          >
                            <ShoppingBag size={13} />
                            <span>{prod.stock === 0 ? 'Out of Stock' : 'Reserve'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── C. PROFILE DETAILS (SETTINGS) TAB ── */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 border border-black/8 rounded-2xl shadow-xs text-left space-y-6">
                <div className="border-b border-black/8 pb-4">
                  <h3 className="font-display font-bold text-lg text-brand-primary">
                    Personal Information
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Keep your contact and hostel information updated so your ties are delivered to the right hall lobby.
                  </p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Daniel Adeleke"
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-black/10 focus:border-brand-secondary focus:bg-white focus:ring-2 focus:ring-brand-secondary/15 text-neutral-800 rounded-xl text-xs sm:text-sm focus:outline-none transition-all"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">Your registered name for lobby verification.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={currentUser?.email || ''}
                      className="w-full px-4 py-2.5 bg-neutral-100 border border-black/10 text-neutral-500 rounded-xl text-xs sm:text-sm cursor-not-allowed"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">Your student account email address (used for order receipts).</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Phone Number (WhatsApp / Call)
                    </label>
                    <input
                      type="tel"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-black/10 focus:border-brand-secondary focus:bg-white focus:ring-2 focus:ring-brand-secondary/15 text-neutral-800 rounded-xl text-xs sm:text-sm focus:outline-none transition-all"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">We will contact you on this number when your tie arrives in the lobby.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Hall of Residence
                      </label>
                      <select
                        value={editHall}
                        onChange={(e) => setEditHall(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-black/10 focus:border-brand-secondary focus:bg-white focus:ring-2 focus:ring-brand-secondary/15 text-neutral-800 rounded-xl text-xs sm:text-sm focus:outline-none transition-all"
                      >
                        {COVENANT_HALLS.map((hall) => (
                          <option key={hall} value={hall}>
                            {hall}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Room Number
                      </label>
                      <input
                        type="text"
                        required
                        value={editRoom}
                        onChange={(e) => setEditRoom(e.target.value)}
                        placeholder="e.g. B204"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-black/10 focus:border-brand-secondary focus:bg-white focus:ring-2 focus:ring-brand-secondary/15 text-neutral-800 rounded-xl text-xs sm:text-sm focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {settingsSuccess && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span className="font-medium">Profile details updated successfully!</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                    >
                      <Save size={15} />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── D. LEAVE A REVIEW TAB ── */}
            {activeTab === 'reviews' && (
              <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 border border-black/8 rounded-2xl shadow-xs text-left space-y-6">
                <div className="border-b border-black/8 pb-4">
                  <h3 className="font-display font-bold text-lg text-brand-primary">
                    Share Your Feedback
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    How was your experience with Knotify? We read every review to make the tie pickup service better for you.
                  </p>
                </div>

                {reviewSuccess ? (
                  <div className="space-y-4 py-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto">
                      <CheckCircle2 size={28} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-brand-primary">Thank you for your feedback!</h4>
                      <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                        Your review has been saved. We appreciate you taking the time to help us improve.
                      </p>
                    </div>
                    <button
                      onClick={() => setReviewSuccess(false)}
                      className="px-5 py-2.5 bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      Write Another Review
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Your Email
                      </label>
                      <input
                        type="email"
                        required
                        value={reviewEmail}
                        onChange={(e) => setReviewEmail(e.target.value)}
                        placeholder="e.g. student@covenant.edu.ng"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-black/10 focus:border-brand-secondary focus:bg-white focus:ring-2 focus:ring-brand-secondary/15 text-neutral-800 rounded-xl text-xs sm:text-sm focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        How would you rate your experience?
                      </label>
                      <div className="flex items-center gap-1.5 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            onMouseEnter={() => setReviewHoveredRating(star)}
                            onMouseLeave={() => setReviewHoveredRating(null)}
                            className="p-1 hover:scale-115 transition-transform cursor-pointer"
                            title={`${star} Star`}
                          >
                            <Star
                              size={26}
                              fill={(reviewHoveredRating !== null ? star <= reviewHoveredRating : star <= reviewRating) ? '#D4AF37' : 'none'}
                              stroke={(reviewHoveredRating !== null ? star <= reviewHoveredRating : star <= reviewRating) ? '#D4AF37' : 'currentColor'}
                              className={
                                (reviewHoveredRating !== null ? star <= reviewHoveredRating : star <= reviewRating)
                                  ? 'text-[#D4AF37]'
                                  : 'text-neutral-300'
                              }
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-medium text-brand-secondary block mt-0.5">
                        {getRatingLabel(reviewHoveredRating !== null ? reviewHoveredRating : reviewRating)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Your Feedback
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Tell us what went well, or what we can do better..."
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-black/10 focus:border-brand-secondary focus:bg-white focus:ring-2 focus:ring-brand-secondary/15 text-neutral-800 rounded-xl text-xs sm:text-sm focus:outline-none transition-all resize-none"
                      />
                    </div>

                    {reviewError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle size={15} className="shrink-0 text-rose-600" />
                        <span>{reviewError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="w-full py-3 bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <MessageSquare size={15} />
                      <span>{reviewSubmitting ? 'Sending Review...' : 'Submit Feedback'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 📱 4. INTERACTIVE MODALS */}
      
      {/* 1. DIGITAL PASS MODAL */}
      {activePassRes && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFEF2] border border-black/10 max-w-sm w-full rounded-3xl shadow-2xl p-6 relative text-left space-y-5">
            
            {/* Close */}
            <button
              onClick={() => setActivePassRes(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-brand-primary hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Modal Title */}
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono text-brand-secondary font-bold uppercase tracking-widest block">
                Knotify • Covenant University
              </span>
              <h3 className="font-display font-bold text-xl text-brand-primary">
                Lobby Pickup Pass
              </h3>
              <p className="text-xs text-neutral-500">
                Show this ticket to collect your tie
              </p>
            </div>

            {/* QR Code */}
            <div className="py-1">
              <QRCodeSVG code={activePassRes.id} />
              <p className="text-[10px] text-center text-neutral-500 mt-2">
                Scan or read code to verify
              </p>
            </div>

            {/* Pickup Code Details with Copy */}
            <div className="bg-neutral-50 border border-black/8 p-3.5 rounded-2xl space-y-1.5">
              <span className="text-[10px] text-neutral-500 block uppercase font-medium">
                Pickup Code
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-bold text-brand-secondary tracking-wider">
                  {activePassRes.id}
                </span>
                
                <button
                  onClick={() => handleCopyCode(activePassRes.id)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-neutral-100 text-brand-secondary border border-black/10 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                >
                  {copiedResId === activePassRes.id ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Pass Metadata */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-neutral-700 pt-2 border-t border-black/8">
              <div>
                <span className="text-[10px] text-neutral-400 block">Student</span>
                <span className="font-semibold text-brand-primary">{activePassRes.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">Pickup Date</span>
                <span className="font-semibold text-brand-primary">{activePassRes.dateAdded}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-neutral-400 block">Tie Ordered</span>
                <span className="font-semibold text-brand-primary">{activePassRes.productNames} ({activePassRes.quantity})</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">Hall Lobby</span>
                <span className="font-semibold text-emerald-800">{activePassRes.pickupPoint || `${activePassRes.hall} Lobby`}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 block">Status</span>
                <span className="font-semibold text-emerald-700">{activePassRes.status}</span>
              </div>
            </div>

            <button
              onClick={() => setActivePassRes(null)}
              className="w-full py-2.5 bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer text-center block shadow-xs"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* 2. RESCHEDULE DATE MODAL */}
      {activeRescheduleRes && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFEF2] border border-black/10 max-w-sm w-full rounded-3xl shadow-2xl p-6 relative text-left space-y-4">
            
            {/* Close */}
            <button
              onClick={() => setActiveRescheduleRes(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-brand-primary hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-brand-secondary font-bold uppercase tracking-wider block">
                Pickup Date
              </span>
              <h3 className="font-display font-bold text-lg text-brand-primary">
                Reschedule Pickup
              </h3>
            </div>

            <p className="font-sans text-xs text-neutral-600 leading-relaxed">
              Choose a new date to collect your tie (<strong className="font-mono text-brand-secondary">{activeRescheduleRes.id}</strong>) from your hostel lobby.
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Choose New Date
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-black/10 focus:border-brand-secondary focus:outline-none rounded-xl text-xs text-neutral-800"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveRescheduleRes(null)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-xl cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] text-xs font-semibold rounded-xl cursor-pointer text-center shadow-xs"
                >
                  Save Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
