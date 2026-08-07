import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  ShoppingBag, 
  Edit3, 
  Save, 
  Heart,
  AlertCircle,
  Copy,
  Check,
  QrCode,
  X,
  LogOut,
  LogIn,
  Star,
  MessageSquare
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

  // Settings form state
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editPhone, setEditPhone] = useState(currentUser?.telegramPhone || '');
  const [editRoom, setEditRoom] = useState(currentUser?.roomNumber || '');
  const [editHall, setEditHall] = useState(currentUser?.residenceHall || COVENANT_HALLS[0]);
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
      setEditName(currentUser.name || '');
      setEditPhone(currentUser.telegramPhone || '');
      setEditRoom(currentUser.roomNumber || '');
      setEditHall(currentUser.residenceHall || COVENANT_HALLS[0]);
      setReviewEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewEmail || !reviewText) {
      setReviewError('Please fill in both your email and review.');
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
    } catch (err) {
      setReviewError('Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Filter reservations for current user
  const userReservations = currentUser ? reservations.filter(
    (res) =>
      res.name.toLowerCase() === currentUser.name.toLowerCase() ||
      res.phone === currentUser.telegramPhone ||
      res.email === currentUser.email
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
      name: editName,
      telegramPhone: editPhone,
      roomNumber: editRoom,
      residenceHall: editHall
    };
    
    onUpdateUser(updated);
    setSettingsSuccess(true);
    setTimeout(() => {
      setSettingsSuccess(false);
    }, 3000);
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

    // Convert date string from yyyy-mm-dd to readable format
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
    <svg width="140" height="140" viewBox="0 0 140 140" className="mx-auto bg-white p-2 border border-brand-border/40 rounded-xs shadow-xs">
      {/* Position Detection Patterns */}
      <rect x="10" y="10" width="30" height="30" fill="#1F3E2B" />
      <rect x="15" y="15" width="20" height="20" fill="white" />
      <rect x="20" y="20" width="10" height="10" fill="#1F3E2B" />
      
      <rect x="100" y="10" width="30" height="30" fill="#1F3E2B" />
      <rect x="105" y="15" width="20" height="20" fill="white" />
      <rect x="110" y="20" width="10" height="10" fill="#1F3E2B" />
      
      <rect x="10" y="100" width="30" height="30" fill="#1F3E2B" />
      <rect x="15" y="105" width="20" height="20" fill="white" />
      <rect x="20" y="110" width="10" height="10" fill="#1F3E2B" />

      {/* Alignment / Smaller marker */}
      <rect x="100" y="100" width="15" height="15" fill="#1F3E2B" />
      <rect x="105" y="105" width="5" height="5" fill="white" />
      
      {/* QR code noise simulation */}
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 select-none" id="knotify-user-dashboard">
      
      {/* 👤 1. PROFILE HEADER CARD (FULL-WIDTH DARK GREEN) */}
      <div className="bg-[#1F3E2B] border border-brand-primary/10 rounded-xs p-6 sm:p-8 text-[#FFFEF2] relative overflow-hidden shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Decorative Grid Line styling */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,254,242,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
        
        {currentUser ? (
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 text-left">
            {/* Avatar Circle */}
            <div className="bg-[#FFFEF2] text-[#1F3E2B] w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full font-display text-2xl font-bold shadow-sm shrink-0 border border-brand-primary/5">
              {currentUser.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'S'}
            </div>
            
            {/* Details */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-display font-black text-2xl sm:text-3xl text-[#FFFEF2] uppercase tracking-wide">
                  {currentUser.name}
                </h2>
                
                {/* Scholar Status Badge */}
                <span className="bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-[#D4AF37] font-mono text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-xs">
                  {currentUser.isSeller ? 'Tie Merchant' : 'Verified Scholar'}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#FFFEF2]/80 font-sans">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#D4AF37]" />
                  <span>{currentUser.residenceHall || 'Daniel Hall'}, Room {currentUser.roomNumber || '302'}</span>
                </span>
                <span className="hidden sm:inline text-[#FFFEF2]/40">•</span>
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="text-[#D4AF37]" />
                  <span className="font-mono">{currentUser.telegramPhone || 'N/A'}</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex items-center gap-4 text-left">
            <div className="bg-[#FFFEF2]/10 text-[#FFFEF2] w-14 h-14 flex items-center justify-center rounded-full font-display text-xl font-bold border border-white/20">
              ?
            </div>
            <div>
              <h2 className="font-display font-black text-2xl text-[#FFFEF2] uppercase tracking-wide">
                Guest Scholar
              </h2>
              <p className="text-xs text-[#FFFEF2]/75 font-sans mt-0.5">
                Authentication required to track reservations.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="relative z-10 shrink-0 flex items-center gap-3 self-start md:self-center">
          {currentUser && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2.5 border text-xs font-mono font-bold uppercase tracking-widest rounded-xs transition-all duration-300 cursor-pointer shadow-xs ${
                activeTab === 'settings' 
                  ? 'bg-[#FFFEF2] text-[#1F3E2B] border-[#FFFEF2]' 
                  : 'bg-transparent text-[#FFFEF2] border-[#FFFEF2]/30 hover:border-[#FFFEF2] hover:bg-[#FFFEF2]/5'
              }`}
            >
              Account Settings
            </button>
          )}

          {currentUser ? (
            <button
              onClick={() => onLogout?.()}
              className="px-4 py-2.5 bg-[#FFFEF2] hover:bg-[#FFFEF2]/90 text-[#1F3E2B] text-xs font-mono font-bold uppercase tracking-widest rounded-xs transition-all duration-300 cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <LogOut size={12} />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth?.()}
              className="px-4 py-2.5 bg-[#FFFEF2] hover:bg-[#FFFEF2]/90 text-[#1F3E2B] text-xs font-mono font-bold uppercase tracking-widest rounded-xs transition-all duration-300 cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <LogIn size={12} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* 📌 2. TOP NAVIGATION BAR */}
      <div className="border-b border-brand-border/40 pb-px flex items-center justify-between" id="dashboard-navbar-tabs">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('reservations')}
            className={`pb-4 text-[10px] font-mono tracking-[0.25em] uppercase border-b-2 transition-all duration-300 cursor-pointer flex items-center gap-2 ${
              activeTab === 'reservations'
                ? 'border-brand-secondary text-brand-secondary font-black scale-105'
                : 'border-transparent text-neutral-500 hover:text-brand-secondary hover:border-brand-border'
            }`}
          >
            <span>My Reservations</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold transition-colors ${
              activeTab === 'reservations' 
                ? 'bg-[#1F3E2B] text-[#FFFEF2]' 
                : 'bg-brand-card text-neutral-600'
            }`}>
              {currentUser ? userReservations.length : 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`pb-4 text-[10px] font-mono tracking-[0.25em] uppercase border-b-2 transition-all duration-300 cursor-pointer flex items-center gap-2 ${
              activeTab === 'wishlist'
                ? 'border-brand-secondary text-brand-secondary font-black scale-105'
                : 'border-transparent text-neutral-500 hover:text-brand-secondary hover:border-brand-border'
            }`}
          >
            <span>Wish List</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold transition-colors ${
              activeTab === 'wishlist' 
                ? 'bg-[#1F3E2B] text-[#FFFEF2]' 
                : 'bg-brand-card text-neutral-600'
            }`}>
              {wishlist.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-[10px] font-mono tracking-[0.25em] uppercase border-b-2 transition-all duration-300 cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-brand-secondary text-brand-secondary font-black scale-105'
                : 'border-transparent text-neutral-500 hover:text-brand-secondary hover:border-brand-border'
            }`}
          >
            Submit Review
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 text-[10px] font-mono tracking-[0.25em] uppercase border-b-2 transition-all duration-300 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-brand-secondary text-brand-secondary font-black scale-105'
                : 'border-transparent text-neutral-500 hover:text-brand-secondary hover:border-brand-border'
            }`}
          >
            Account Settings
          </button>
        </div>
      </div>

      {/* 📦 3. TAB CONTENTS */}
      <div className="min-h-[400px]">
        {/* If Guest/Not Signed In, block access with beautiful prompt */}
        {!currentUser && activeTab !== 'wishlist' && activeTab !== 'reviews' ? (
          <div className="max-w-md mx-auto py-16 px-6 border border-brand-border/40 bg-brand-card/25 rounded-xs text-center space-y-6 shadow-xs">
            <div className="w-12 h-12 bg-brand-secondary/5 text-brand-secondary border border-brand-secondary/20 rounded-full flex items-center justify-center mx-auto">
              <User size={20} />
            </div>
            <div className="space-y-2">
              <h3 className="font-mono text-xs uppercase font-bold text-brand-secondary tracking-widest">
                AUTHENTICATION REQUIRED
              </h3>
              <p className="font-sans text-xs text-neutral-600 leading-relaxed">
                Access to reservations, lobby pickup tickets, and personal account configurations is reserved for authenticated Covenant scholars.
              </p>
            </div>
            <button
              onClick={() => onOpenAuth?.()}
              className="w-full py-3 bg-[#1F3E2B] hover:bg-[#2E5C3E] text-[#FFFEF2] text-xs font-mono font-bold uppercase tracking-widest rounded-xs transition-all duration-300 shadow-sm cursor-pointer"
            >
              Sign In to Knotify
            </button>
          </div>
        ) : (
          <>
            {/* A. MY RESERVATIONS TAB */}
            {activeTab === 'reservations' && (
              <div className="space-y-6 text-left">
                {/* Filter Bar */}
                <div className="flex items-center justify-between border-b border-brand-border/20 pb-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-wider font-bold rounded-xs transition-all border cursor-pointer ${
                        filter === 'all'
                          ? 'bg-[#1F3E2B] text-[#FFFEF2] border-[#1F3E2B]'
                          : 'bg-brand-card hover:bg-brand-light-gray text-neutral-600 border-brand-border/30'
                      }`}
                    >
                      All ({userReservations.length})
                    </button>
                    <button
                      onClick={() => setFilter('pending')}
                      className={`px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-wider font-bold rounded-xs transition-all border cursor-pointer ${
                        filter === 'pending'
                          ? 'bg-[#1F3E2B] text-[#FFFEF2] border-[#1F3E2B]'
                          : 'bg-brand-card hover:bg-brand-light-gray text-neutral-600 border-brand-border/30'
                      }`}
                    >
                      Not Picked Up ({pendingCount})
                    </button>
                    <button
                      onClick={() => setFilter('completed')}
                      className={`px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-wider font-bold rounded-xs transition-all border cursor-pointer ${
                        filter === 'completed'
                          ? 'bg-[#1F3E2B] text-[#FFFEF2] border-[#1F3E2B]'
                          : 'bg-brand-card hover:bg-brand-light-gray text-neutral-600 border-brand-border/30'
                      }`}
                    >
                      Picked Up ({completedCount})
                    </button>
                  </div>
                  
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">
                    LOBBY RESERVATION TRACKING
                  </span>
                </div>

                {filteredReservations.length === 0 ? (
                  <div className="py-16 border border-dashed border-brand-border/40 rounded-xs text-center space-y-4 bg-brand-card/10">
                    <Calendar size={28} className="text-neutral-400 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-mono text-brand-secondary uppercase font-bold tracking-wider">No matching reservations</h4>
                      <p className="text-xs text-neutral-500 max-w-xs mx-auto font-sans leading-relaxed">
                        No pickup records found matching this filter status. Buy custom ties in the collection tab to create reservations.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredReservations.map((res) => {
                      const isPickedUp = res.status === 'Collected';
                      
                      return (
                        <div 
                          key={res.id}
                          className={`bg-brand-card border rounded-xs p-5 transition-all shadow-xs relative flex flex-col justify-between ${
                            isPickedUp 
                              ? 'border-brand-border/40 opacity-75 hover:opacity-100' 
                              : 'border-brand-border hover:border-brand-secondary/40'
                          }`}
                        >
                          <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <span className="text-[10px] font-mono font-bold text-brand-secondary tracking-widest bg-white border border-brand-border/30 px-2 py-0.5 rounded-xs">
                                  {res.id}
                                </span>
                                <h4 className={`font-display font-bold text-base text-brand-primary uppercase mt-2.5 ${isPickedUp ? 'line-through text-neutral-500' : ''}`}>
                                  {res.productNames}
                                </h4>
                              </div>
                              
                              {/* Status Badge */}
                              <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs border ${
                                isPickedUp
                                  ? 'bg-neutral-100 text-neutral-600 border-neutral-300/40'
                                  : 'bg-[#D4AF37]/15 text-[#B8860B] border-[#D4AF37]/35 animate-pulse'
                              }`}>
                                {isPickedUp ? 'Picked Up' : 'Not Picked Up'}
                              </span>
                            </div>

                            {/* Info grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-brand-border/25">
                              <div>
                                <span className="text-[8px] font-mono text-neutral-400 block uppercase tracking-wider">Lobby pickup point</span>
                                <span className="font-sans font-bold text-neutral-800">{res.pickupPoint || `${res.hall} Lobby`}</span>
                              </div>
                              <div>
                                <span className="text-[8px] font-mono text-neutral-400 block uppercase tracking-wider">Pickup Date</span>
                                <span className="font-sans font-bold text-neutral-800 flex items-center gap-1">
                                  <Clock size={11} className="text-[#D4AF37] shrink-0" />
                                  {res.dateAdded}
                                </span>
                              </div>
                              <div className="col-span-2 bg-[#FFFEF2] p-2 border border-brand-border/20 rounded-xs flex items-center justify-between">
                                <span className="text-[9px] font-mono text-neutral-500 uppercase">Amount of Ties:</span>
                                <span className="font-mono text-xs font-bold text-brand-secondary">
                                  {res.quantity} {res.quantity > 1 ? 'Ties' : 'Tie'}
                                </span>
                              </div>
                            </div>

                            {/* Financial Details */}
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-brand-border/25 pt-3">
                              <div className="text-[#1F3E2B]">
                                <span>Deposit Paid: </span>
                                <strong>₦{res.deposit.toLocaleString()}</strong>
                              </div>
                              <div className="text-right text-amber-700">
                                <span>Balance: </span>
                                <strong>₦{res.outstanding.toLocaleString()}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Action Bar */}
                          <div className="pt-4 mt-4 border-t border-brand-border/25 flex items-center justify-between gap-2">
                            <div className="flex gap-2">
                              {!isPickedUp && (
                                <button
                                  onClick={() => {
                                    setActiveRescheduleRes(res);
                                    setRescheduleDate('');
                                  }}
                                  className="text-[9px] font-mono uppercase font-bold text-brand-secondary hover:text-[#FFFEF2] border border-brand-secondary/40 hover:bg-[#1F3E2B] px-2.5 py-1.5 rounded-xs cursor-pointer transition-all"
                                >
                                  Reschedule Date
                                </button>
                              )}
                              <button
                                onClick={() => setActivePassRes(res)}
                                className="text-[9px] font-mono uppercase font-bold text-neutral-600 hover:text-brand-primary border border-brand-border hover:bg-brand-light-gray px-2.5 py-1.5 rounded-xs cursor-pointer transition-all"
                              >
                                Pass / Code
                              </button>
                            </div>

                            <button
                              onClick={() => toggleReservationStatus(res)}
                              className={`text-[9px] font-mono uppercase font-bold px-3 py-1.5 rounded-xs shadow-xs cursor-pointer transition-all border ${
                                isPickedUp
                                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                                  : 'bg-[#1F3E2B] hover:bg-[#2E5C3E] text-[#FFFEF2] border-[#1F3E2B]'
                              }`}
                            >
                              {isPickedUp ? 'Mark Uncollected' : 'Mark as Picked Up'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* B. WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6 text-left">
                <div className="border-b border-brand-border/20 pb-3 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">
                    SAVED MARKETPLACE ITEMS
                  </span>
                  <span className="font-mono text-[9px] text-[#1F3E2B] font-bold">
                    {savedProducts.length} Items Total
                  </span>
                </div>

                {savedProducts.length === 0 ? (
                  <div className="py-16 border border-dashed border-brand-border/40 rounded-xs text-center space-y-4 bg-brand-card/10">
                    <Heart size={28} className="text-neutral-400 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-mono text-brand-secondary uppercase font-bold tracking-wider">Your wishlist is empty</h4>
                      <p className="text-xs text-neutral-500 max-w-xs mx-auto font-sans leading-relaxed">
                        Browse the marketplace, inspect certified ties, and click the wishlist trigger to build your list.
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentTab?.('marketplace')}
                      className="px-4 py-2 bg-[#1F3E2B] text-[#FFFEF2] text-[10px] font-mono font-bold uppercase tracking-wider rounded-xs cursor-pointer hover:bg-[#2E5C3E]"
                    >
                      Browse Collection
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" id="dashboard-wishlist-grid">
                    {savedProducts.map((prod) => (
                      <div 
                        key={prod.id} 
                        className="bg-brand-card border border-brand-border/40 rounded-xs p-4 flex flex-col justify-between text-left transition-all duration-300 shadow-xs hover:shadow-sm group relative"
                      >
                        {/* Remove button */}
                        <button
                          onClick={() => onToggleWishlist(prod)}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-[#FFFEF2] hover:bg-red-50 border border-brand-border/40 text-neutral-500 hover:text-red-600 transition-colors shadow-xs cursor-pointer z-10"
                          title="Remove from Wishlist"
                        >
                          <Trash2 size={12} />
                        </button>

                        <div className="space-y-3">
                          {/* Image */}
                          <div className="aspect-w-16 aspect-h-12 w-full h-36 bg-white rounded-xs overflow-hidden border border-brand-border/20 relative">
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="h-full w-full object-cover grayscale-[5%] group-hover:grayscale-0 group-hover:scale-102 transition-all duration-500"
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
                          </div>

                          {/* Info */}
                          <div className="space-y-1">
                            <span className="text-[7px] font-mono bg-[#1F3E2B]/10 text-brand-secondary px-1.5 py-0.5 rounded-xs font-bold uppercase tracking-wider inline-block">
                              {prod.category}
                            </span>
                            <h5 className="font-display font-bold text-sm text-brand-primary leading-tight uppercase line-clamp-1">
                              {prod.name}
                            </h5>
                            <p className="text-[8px] font-mono text-neutral-400 uppercase">
                              Seller: {prod.seller} • {prod.stock} left
                            </p>
                          </div>
                        </div>

                        {/* Prices & Reserve */}
                        <div className="mt-4 pt-3 border-t border-brand-border/25">
                          <div className="flex items-center justify-between text-xs mb-3 font-mono">
                            <div>
                              <span className="text-[8px] text-neutral-400 block uppercase">Full Price</span>
                              <span className="font-bold text-brand-primary">₦{prod.price.toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] text-neutral-400 block uppercase">Deposit Required</span>
                              <span className="font-bold text-[#B8860B]">₦{prod.deposit.toLocaleString()}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onAddToCart(prod, 1);
                              setCurrentTab?.('checkout');
                            }}
                            disabled={prod.stock === 0}
                            className={`w-full py-2 font-mono tracking-widest uppercase text-[9px] font-bold flex items-center justify-center gap-1.5 transition-all rounded-xs cursor-pointer border ${
                              prod.stock === 0
                                ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                                : 'bg-[#1F3E2B] hover:bg-[#2E5C3E] text-[#FFFEF2] border-[#1F3E2B]'
                            }`}
                          >
                            <ShoppingBag size={11} />
                            {prod.stock === 0 ? 'Out of Stock' : 'Reserve Now'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* C. ACCOUNT SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-6 text-left max-w-xl mx-auto bg-brand-card/35 p-6 sm:p-8 border border-brand-border/40 rounded-xs shadow-xs">
                <div className="border-b border-brand-border/25 pb-3">
                  <h3 className="font-display font-bold text-lg text-brand-secondary uppercase">
                    Pickup Contact Configuration
                  </h3>
                  <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mt-0.5">
                    Essential details used for lobby verification and pickup coordination.
                  </p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                      Scholar Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. DANIEL KOWALSKI"
                      className="w-full px-4 py-2.5 bg-[#FFFEF2] border border-brand-border/50 focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary/20 text-brand-primary rounded-xs font-sans text-xs focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                      Contact Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="w-full px-4 py-2.5 bg-[#FFFEF2] border border-brand-border/50 focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary/20 text-brand-primary rounded-xs font-mono text-xs focus:outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                        Room Number
                      </label>
                      <input
                        type="text"
                        required
                        value={editRoom}
                        onChange={(e) => setEditRoom(e.target.value)}
                        placeholder="e.g. 302"
                        className="w-full px-4 py-2.5 bg-[#FFFEF2] border border-brand-border/50 focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary/20 text-brand-primary rounded-xs font-mono text-xs focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                        Residence Hall
                      </label>
                      <select
                        value={editHall}
                        onChange={(e) => setEditHall(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#FFFEF2] border border-brand-border/50 focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary/20 text-brand-primary rounded-xs font-sans text-xs focus:outline-none transition-all"
                      >
                        {COVENANT_HALLS.map((hall) => (
                          <option key={hall} value={hall}>
                            {hall}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {settingsSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-[10px] font-mono uppercase tracking-wider rounded-xs flex items-center gap-2">
                      <CheckCircle size={12} className="text-green-600" />
                      <span>Configuration settings updated and saved!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1F3E2B] hover:bg-[#2E5C3E] text-[#FFFEF2] text-xs font-mono font-bold uppercase tracking-widest rounded-xs transition-all duration-300 shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Save size={13} />
                    <span>Save Settings</span>
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6 text-left max-w-xl mx-auto bg-brand-card/35 p-6 sm:p-8 border border-brand-border/40 rounded-xs shadow-xs">
                <div className="border-b border-brand-border/25 pb-3">
                  <h3 className="font-display font-bold text-lg text-brand-secondary uppercase">
                    Submit Experience Feedback
                  </h3>
                  <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mt-0.5">
                    We appreciate your thoughts! Share your experience with Knotify.
                  </p>
                </div>

                {reviewSuccess ? (
                  <div className="space-y-4 py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-800 mx-auto">
                      <CheckCircle size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-mono text-brand-secondary uppercase font-bold tracking-wider">Review Submitted Successfully!</h4>
                      <p className="text-xs text-neutral-500 max-w-xs mx-auto font-sans leading-relaxed">
                        Thank you for taking the time to share your feedback.
                      </p>
                    </div>
                    <button
                      onClick={() => setReviewSuccess(false)}
                      className="px-6 py-2.5 bg-[#1F3E2B] hover:bg-[#2E5C3E] text-[#FFFEF2] text-xs font-mono font-bold uppercase tracking-widest rounded-xs transition-all duration-300 shadow-sm cursor-pointer"
                    >
                      Write Another Review
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={reviewEmail}
                        onChange={(e) => setReviewEmail(e.target.value)}
                        placeholder="e.g. scholar@covenant.edu"
                        className="w-full px-4 py-2.5 bg-[#FFFEF2] border border-brand-border/50 focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary/20 text-brand-primary rounded-xs font-sans text-xs focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                        Experience Rating
                      </label>
                      <div className="flex gap-1.5 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            onMouseEnter={() => setReviewHoveredRating(star)}
                            onMouseLeave={() => setReviewHoveredRating(null)}
                            className="p-1 text-brand-primary hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              size={22}
                              fill={(reviewHoveredRating !== null ? star <= reviewHoveredRating : star <= reviewRating) ? '#D4AF37' : 'none'}
                              stroke={(reviewHoveredRating !== null ? star <= reviewHoveredRating : star <= reviewRating) ? '#D4AF37' : 'currentColor'}
                              className={
                                (reviewHoveredRating !== null ? star <= reviewHoveredRating : star <= reviewRating)
                                  ? 'text-[#D4AF37]'
                                  : 'text-brand-primary/40'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                        Your Feedback / Review
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Tell us about your experience..."
                        className="w-full px-4 py-2.5 bg-[#FFFEF2] border border-brand-border/50 focus:border-[#1F3E2B] focus:ring-1 focus:ring-[#1F3E2B]/20 text-brand-primary rounded-xs font-sans text-xs focus:outline-none transition-all resize-none"
                      />
                    </div>

                    {reviewError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-[10px] font-mono uppercase tracking-wider rounded-xs">
                        {reviewError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="w-full py-3 bg-[#1F3E2B] hover:bg-[#2E5C3E] text-[#FFFEF2] text-xs font-mono font-bold uppercase tracking-widest rounded-xs transition-all duration-300 shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <MessageSquare size={13} />
                      <span>{reviewSubmitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 📱 4. INTERACTIVE MODALS */}
      
      {/* 1. DIGITAL PASS / CODE MODAL */}
      {activePassRes && (
        <div className="fixed inset-0 z-50 bg-[#1B1B19]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFEF2] border border-brand-border max-w-sm w-full rounded-xs shadow-xl p-6 relative text-left space-y-6">
            
            {/* Close */}
            <button
              onClick={() => setActivePassRes(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:text-brand-primary hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Modal Title */}
            <div className="text-center space-y-1">
              <span className="text-[9px] font-mono text-[#D4AF37] font-bold uppercase tracking-[0.25em] block">
                COVENANT UNIVERSITY
              </span>
              <h3 className="font-display font-black text-xl text-brand-primary uppercase">
                Digital Pickup Pass
              </h3>
            </div>

            {/* QR Code */}
            <div className="py-2">
              <QRCodeSVG code={activePassRes.id} />
              <p className="text-[8px] font-mono text-center text-neutral-400 mt-2 uppercase tracking-widest">
                Scan at lobby station for verification
              </p>
            </div>

            {/* Pickup Code Details with Copy */}
            <div className="bg-brand-card/50 border border-brand-border/30 p-3.5 rounded-xs space-y-2">
              <span className="text-[8px] font-mono text-neutral-400 block uppercase tracking-wider">
                Pickup Alphanumeric Code
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-black text-brand-secondary tracking-widest">
                  {activePassRes.id}
                </span>
                
                <button
                  onClick={() => handleCopyCode(activePassRes.id)}
                  className="px-2.5 py-1 text-[9px] font-mono uppercase font-black bg-white hover:bg-brand-secondary hover:text-[#FFFEF2] text-brand-secondary border border-brand-secondary/30 hover:border-brand-secondary rounded-xs cursor-pointer transition-all flex items-center gap-1"
                >
                  {copiedResId === activePassRes.id ? (
                    <>
                      <Check size={10} className="text-green-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={10} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Pass Metadata details */}
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-[10px] font-sans text-neutral-700 pt-1 border-t border-brand-border/20">
              <div>
                <span className="text-[8px] font-mono text-neutral-400 block uppercase">Scholar Name</span>
                <span className="font-bold text-brand-primary uppercase">{activePassRes.name}</span>
              </div>
              <div>
                <span className="text-[8px] font-mono text-neutral-400 block uppercase">Date Scheduled</span>
                <span className="font-bold text-brand-primary">{activePassRes.dateAdded}</span>
              </div>
              <div>
                <span className="text-[8px] font-mono text-neutral-400 block uppercase">Amount of Ties</span>
                <span className="font-bold text-brand-primary">{activePassRes.quantity} {activePassRes.quantity > 1 ? 'Ties' : 'Tie'}</span>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-mono text-neutral-400 block uppercase">Outstanding Balance</span>
                <span className="font-mono font-bold text-amber-700 text-xs">₦{activePassRes.outstanding.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setActivePassRes(null)}
              className="w-full py-2.5 bg-[#1F3E2B] hover:bg-[#2E5C3E] text-[#FFFEF2] text-xs font-mono font-bold uppercase tracking-widest rounded-xs transition-colors cursor-pointer text-center block"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* 2. RESCHEDULE DATE MODAL */}
      {activeRescheduleRes && (
        <div className="fixed inset-0 z-50 bg-[#1B1B19]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFEF2] border border-brand-border max-w-sm w-full rounded-xs shadow-xl p-6 relative text-left space-y-5">
            
            {/* Close */}
            <button
              onClick={() => setActiveRescheduleRes(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:text-brand-primary hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="space-y-1">
              <span className="text-[9px] font-mono text-[#D4AF37] font-bold uppercase tracking-[0.2em] block">
                RESERVATION ADJUSTMENT
              </span>
              <h3 className="font-display font-black text-lg text-brand-primary uppercase">
                Reschedule Pickup Date
              </h3>
            </div>

            <p className="font-sans text-xs text-neutral-500 leading-relaxed">
              Adjust the scheduled collection date for reservation <strong className="font-mono text-brand-secondary">{activeRescheduleRes.id}</strong>. Rescheduling ensures lobby merchant notification.
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                  Select Future Date
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // restrict past dates
                  className="w-full px-3 py-2 bg-brand-card/40 border border-brand-border/40 focus:border-brand-secondary focus:outline-none rounded-xs font-mono text-xs text-brand-primary"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveRescheduleRes(null)}
                  className="flex-1 py-2.5 bg-brand-card hover:bg-brand-light-gray text-neutral-700 text-xs font-mono font-bold uppercase tracking-widest rounded-xs border border-brand-border/30 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1F3E2B] hover:bg-[#2E5C3E] text-[#FFFEF2] text-xs font-mono font-bold uppercase tracking-widest rounded-xs cursor-pointer text-center"
                >
                  Confirm Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
