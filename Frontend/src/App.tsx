import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, ShoppingBag, Trash2, ArrowRight, Check } from 'lucide-react';

import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Marketplace from './components/Marketplace';
import ProductDetailModal from './components/ProductDetailModal';
import CheckoutPage from './components/CheckoutPage';
import WishlistPage from './components/WishlistPage';
import BecomeSellerModal from './components/BecomeSellerModal';
import SellPage from './components/SellPage';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';

import { INITIAL_PRODUCTS, Product, CartItem, Reservation } from './types';

interface Toast {
  id: string;
  message: string;
  type: 'cart' | 'wishlist' | 'success';
}

function normalizeUser(user: any) {
  if (!user) return null;

  const name = user.name ?? user.full_name ?? user.fullName ?? '';
  return {
    ...user,
    name,
    full_name: user.full_name ?? name,
  };
}

export default function App() {
  // Page routing state
  const [currentTab, setCurrentTab] = useState<'home' | 'marketplace' | 'sell' | 'checkout' | 'wishlist'>('home');

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('knotify_current_user');
    return saved ? normalizeUser(JSON.parse(saved)) : null;
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'add_to_cart' | 'buy_now' | 'checkout';
    product?: Product;
    quantity?: number;
  } | null>(null);

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'cart' | 'wishlist' | 'success' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAuthSuccess = (user: any) => {
    const normalizedUser = normalizeUser(user);
    setCurrentUser(normalizedUser);
    setIsAuthOpen(false);
    addToast(`Successfully signed in as ${normalizedUser?.name || 'user'}!`, 'success');

    // Resume the pending buying action if it was intercepted
    if (pendingAction) {
      if (pendingAction.type === 'add_to_cart' && pendingAction.product) {
        executeAddToCart(pendingAction.product, pendingAction.quantity || 1);
      } else if (pendingAction.type === 'buy_now' && pendingAction.product) {
        executeDirectBuyNow(pendingAction.product);
      } else if (pendingAction.type === 'checkout') {
        setCurrentTab('checkout');
      }
      setPendingAction(null);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('knotify_current_user');
    localStorage.removeItem('knotify_access_token');
    addToast('Logged out successfully', 'success');
  };

  // Shared filter states from landing page to marketplace
  const [sharedSearchQuery, setSharedSearchQuery] = useState('');
  const [sharedCategory, setSharedCategory] = useState('All');

  const handleBrowseWithFilter = (category: string, searchQuery: string = '') => {
    setSharedCategory(category);
    setSharedSearchQuery(searchQuery);
    setCurrentTab('marketplace');
    // Scroll smoothly to top of window on page switches
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Core database state (simulated local list)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('cu_marketplace_products_v3');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  // Shopping cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cu_marketplace_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Wishlist state (array of product IDs)
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('cu_marketplace_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  // Knotify Customer Journey Reservations State (Stage 8 Internal Operations)
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('knotify_reservations');
    const defaultMocks: Reservation[] = [
      {
        id: 'KNT-2027-00482',
        name: 'Daniel',
        phone: '08012345678',
        email: 'daniel@student.covenant.edu.ng',
        color: 'Plain Black',
        quantity: 1,
        hall: 'Daniel Hall',
        productNames: 'Plain Black Tie (x1)',
        deposit: 1500,
        outstanding: 2000,
        status: 'Ready for Pickup',
        pickupPoint: 'Pickup Point A (Near Joseph Hall)',
        dateAdded: 'Jul 15, 2026'
      }
    ];
    return saved ? JSON.parse(saved) : defaultMocks;
  });

  // Modals overlay controls
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isBecomeSellerOpen, setIsBecomeSellerOpen] = useState(false);

  // Sync state with local storage
  useEffect(() => {
    localStorage.setItem('cu_marketplace_products_v3', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('cu_marketplace_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('cu_marketplace_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('knotify_reservations', JSON.stringify(reservations));
  }, [reservations]);

  const handleAddReservation = (newRes: Reservation) => {
    setReservations((prev) => [newRes, ...prev]);
    addToast(`Reservation ${newRes.id} successfully created!`, 'success');
  };

  const executeAddToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        // Enforce max stock boundaries
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });
    addToast(`"${product.name}" added to bag`, 'cart');
    // Visual high-end trigger - direct to full-page checkout immediately
    setCurrentTab('checkout');
  };

  const executeDirectBuyNow = (product: Product) => {
    executeAddToCart(product, 1);
    setActiveProduct(null);
    setCurrentTab('checkout');
  };

  // Handler functions
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    if (!currentUser) {
      setPendingAction({ type: 'add_to_cart', product, quantity });
      setIsAuthOpen(true);
      return;
    }
    executeAddToCart(product, quantity);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(quantity, targetProduct.stock) }
          : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    const targetItem = cartItems.find((item) => item.product.id === productId);
    if (targetItem) {
      addToast(`Removed "${targetItem.product.name}" from bag`, 'success');
    }
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    addToast('Bag cleared', 'success');
  };

  const handleToggleWishlist = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Avoid triggering card details popup
    }
    setWishlist((prev) => {
      const exists = prev.includes(product.id);
      if (exists) {
        addToast(`Removed "${product.name}" from wishlist`, 'success');
        return prev.filter((id) => id !== product.id);
      } else {
        addToast(`Added "${product.name}" to wishlist`, 'wishlist');
        return [...prev, product.id];
      }
    });
  };

  const handleAddListing = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    addToast(`Listed "${newProduct.name}" for sale!`, 'success');
  };

  const handleDirectBuyNow = (product: Product) => {
    if (!currentUser) {
      setPendingAction({ type: 'buy_now', product });
      setIsAuthOpen(true);
      return;
    }
    executeDirectBuyNow(product);
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const featuredProducts = products.filter((p) => p.isFeatured);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-bg relative antialiased" id="marketplace-viewport">
      
      {/* 1. CUSTOM FLOATING NAVIGATION BAR */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          // Scroll smoothly to top of window on page switches
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenCart={() => setCurrentTab('checkout')}
        onOpenWishlist={() => setCurrentTab('wishlist')}
        onOpenBecomeSeller={() => setCurrentTab('sell')}
        currentUser={currentUser}
        onOpenAuth={() => {
          setPendingAction(null);
          setIsAuthOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* 2. PAGE SECTIONS (ORCHESTRATED LAYOUT) */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentTab === 'home' ? (
            /* LANDING PAGE MODULE */
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <LandingPage
                onBrowseMarketplace={() => handleBrowseWithFilter('All', '')}
                onBrowseWithFilter={handleBrowseWithFilter}
                onOpenBecomeSeller={() => setCurrentTab('sell')}
                products={products}
                featuredProducts={featuredProducts}
                onOpenProductDetail={setActiveProduct}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={(prod, e) => handleAddToCart(prod, 1)}
                isInWishlist={isInWishlist}
              />
            </motion.div>
          ) : currentTab === 'marketplace' ? (
            /* MARKETPLACE GRID MODULE */
            <motion.div
              key="marketplace"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Marketplace
                products={products}
                onOpenProductDetail={setActiveProduct}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={(prod, e) => {
                  e.stopPropagation();
                  handleAddToCart(prod, 1);
                }}
                isInWishlist={isInWishlist}
                initialSearchQuery={sharedSearchQuery}
                initialCategory={sharedCategory}
                onSearchQueryChange={setSharedSearchQuery}
                onCategoryChange={setSharedCategory}
              />
            </motion.div>
          ) : currentTab === 'sell' ? (
            /* SELL PAGE MODULE */
            <motion.div
              key="sell"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <SellPage onAddListing={handleAddListing} />
            </motion.div>
          ) : currentTab === 'wishlist' ? (
            /* WISHLIST PAGE MODULE */
            <motion.div
              key="wishlist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <WishlistPage
                wishlist={wishlist}
                products={products}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={(prod, qty) => {
                  handleAddToCart(prod, qty);
                  setCurrentTab('checkout');
                }}
                onBackToCollection={() => setCurrentTab('marketplace')}
              />
            </motion.div>
          ) : (
            /* CHECKOUT PAGE MODULE */
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <CheckoutPage
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveCartItem}
                onClearCart={() => setCartItems([])}
                onAddReservation={handleAddReservation}
                currentUser={currentUser}
                onOpenAuth={() => {
                  setPendingAction({ type: 'checkout' });
                  setIsAuthOpen(true);
                }}
                onContinueShopping={() => setCurrentTab('marketplace')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. SCANDINAVIAN THEMED FOOTER */}
      <Footer 
        setCurrentTab={setCurrentTab} 
        onOpenBecomeSeller={() => setCurrentTab('sell')}
      />

      {/* ======================================================== */}
      {/* 4. OVERLAY DIALOGS, MODALS, AND MICRO-DRAWERS */}
      {/* ======================================================== */}

      {/* PRODUCT DETAIL MODAL */}
      <AnimatePresence>
        {activeProduct && (
          <ProductDetailModal
            product={activeProduct}
            onClose={() => setActiveProduct(null)}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            isInWishlist={isInWishlist}
            onDirectBuy={handleDirectBuyNow}
          />
        )}
      </AnimatePresence>

      {/* BECOME SELLER FORM MODAL */}
      <AnimatePresence>
        {isBecomeSellerOpen && (
          <BecomeSellerModal
            isOpen={isBecomeSellerOpen}
            onClose={() => setIsBecomeSellerOpen(false)}
            onAddListing={handleAddListing}
          />
        )}
      </AnimatePresence>



      {/* (The cart slide-over drawer has been fully upgraded to the full-page CheckoutPage component) */}

      {/* SECURE IDENTITY PORTAL MODAL */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => {
              setIsAuthOpen(false);
              setPendingAction(null);
            }}
            onSuccess={handleAuthSuccess}
            pendingActionName={
              pendingAction?.type === 'add_to_cart'
                ? `add "${pendingAction.product?.name}" to your reservation list`
                : pendingAction?.type === 'buy_now'
                ? `directly reserve "${pendingAction.product?.name}"`
                : 'proceed to reservation checkout'
            }
          />
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATIONS STACK (APPLE-STYLE GREEN NOTIFICATION SYSTEM) */}
      <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3.5 pointer-events-none w-full max-w-xs sm:max-w-sm px-4" id="toast-notifications-container">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isCart = toast.type === 'cart';
            const isWishlist = toast.type === 'wishlist';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 100, y: -15, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.25 } }}
                className="relative pointer-events-auto bg-[#1F3E2B] border border-brand-accent/20 text-[#FFFEF2] rounded-xl p-3.5 pr-8 shadow-2xl overflow-hidden flex flex-col w-full"
                id={`toast-${toast.id}`}
              >
                {/* Apple App Header Line */}
                <div className="flex items-center justify-between border-b border-[#FFFEF2]/10 pb-1.5 mb-2 w-full">
                  <div className="flex items-center gap-1.5">
                    <div className="bg-[#FFFEF2] text-[#1F3E2B] w-4.5 h-4.5 flex items-center justify-center rounded-md font-serif text-xs font-bold shadow-sm select-none">
                      †
                    </div>
                    <span className="text-[9px] font-mono tracking-[0.25em] text-[#FFFEF2] font-black uppercase">
                      KNOTIFY
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#FFFEF2]/50 font-mono text-[8px] uppercase tracking-widest">
                    <span>{isCart ? 'BAG' : isWishlist ? 'WISHLIST' : 'SYSTEM'}</span>
                    <span>•</span>
                    <span>now</span>
                  </div>
                </div>

                {/* Notification Message */}
                <div className="text-left w-full">
                  <p className="text-xs font-sans text-white/95 leading-relaxed font-medium">
                    {toast.message}
                  </p>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="absolute top-2 right-2 text-[#FFFEF2]/50 hover:text-[#FFFEF2] p-1 hover:bg-white/10 rounded transition-colors cursor-pointer shrink-0"
                  title="Dismiss alert"
                >
                  <X size={10} />
                </button>

                {/* Subtle Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/15 overflow-hidden">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 3.5, ease: 'linear' }}
                    className="h-full bg-brand-bg/65"
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}
