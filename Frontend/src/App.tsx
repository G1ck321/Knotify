import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Marketplace from './components/Marketplace';
import ProductDetailModal from './components/ProductDetailModal';
import CheckoutPage from './components/CheckoutPage';
import WishlistPage from './components/WishlistPage';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import SellPage from './components/SellPage';

import { INITIAL_PRODUCTS, Product, CartItem, Reservation } from './types';
import { clearAuthSession, clearClientSessionState, getStoredUser, persistAuthSession } from './lib/authStorage';
import { getAccessToken } from './lib/authStorage';
import { getBackendUrl } from './lib/checkoutPayment';

function normalizeUser(user: any) {
  if (!user) return user;
  const name = user.name ?? user.full_name ?? user.fullName ?? '';
  return {
    ...user,
    name,
    full_name: user.full_name ?? name,
  };
}

type InventoryRow = {
  tie_id: string;
  tie_name: string;
  price: number;
  quantity: number;
  is_active: boolean;
  is_sold_out: boolean;
};

type InventorySummary = {
  totalQuantity: number;
  availableTies: number;
  paidUsers: number;
};

interface Toast {
  id: string;
  message: string;
  type: 'cart' | 'wishlist' | 'success';
}

type OrderHistoryRow = {
  tx_ref: string;
  buyer_name: string;
  amount: number;
  status: string;
  items: string;
  email_snapshot?: string | null;
  phone_snapshot?: string | null;
  room_number?: string | null;
  delivery_address?: string | null;
  cart_snapshot?: Array<{
    tie_id?: string;
    tie_name?: string;
    quantity?: number;
    product?: { name?: string };
  }>;
  created_at: string;
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'marketplace' | 'sell' | 'checkout' | 'wishlist' | 'dashboard'>('home');
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const parsed = getStoredUser();
    return parsed ? normalizeUser(parsed) : null;
  });
  const [inventorySummary, setInventorySummary] = useState<InventorySummary>({
    totalQuantity: 0,
    availableTies: 0,
    paidUsers: 0,
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'add_to_cart' | 'buy_now' | 'checkout';
    product?: Product;
    quantity?: number;
  } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sharedSearchQuery, setSharedSearchQuery] = useState('');
  const [sharedCategory, setSharedCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('cu_marketplace_products_v4');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cu_marketplace_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('cu_marketplace_wishlist');
    return saved ? JSON.parse(saved) : [];
  });
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
        dateAdded: 'Jul 15, 2026',
      },
    ];
    return saved ? JSON.parse(saved) : defaultMocks;
  });
  const [orderHistoryReservations, setOrderHistoryReservations] = useState<Reservation[]>([]);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isBecomeSellerOpen, setIsBecomeSellerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadOrderHistory = async () => {
      const token = getAccessToken();
      if (!currentUser || !token) {
        if (!cancelled) {
          setOrderHistoryReservations([]);
        }
        return;
      }

      try {
        const response = await fetch(`${getBackendUrl()}/api/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (!cancelled) setOrderHistoryReservations([]);
          return;
        }

        const orders = (await response.json().catch(() => [])) as OrderHistoryRow[];
        if (cancelled) return;

        const mappedReservations = orders.map((order) => {
          const cartSnapshot = Array.isArray(order.cart_snapshot) ? order.cart_snapshot : [];
          const productNames = cartSnapshot.length
            ? cartSnapshot
                .map((item) => `${item.tie_name || item.product?.name || item.tie_id || 'Tie'} (x${item.quantity || 1})`)
                .join(', ')
            : order.items;

          return {
            id: order.tx_ref,
            name: order.buyer_name,
            phone: order.phone_snapshot || currentUser.telegramPhone || '',
            email: order.email_snapshot || currentUser.email,
            color: 'N/A',
            quantity: cartSnapshot.reduce((total, item) => total + Number(item.quantity || 0), 0) || 1,
            hall: order.delivery_address || order.room_number || currentUser.residenceHall || 'N/A',
            productNames,
            deposit: Number(order.amount || 0),
            outstanding: 0,
            status: order.status === 'paid' ? 'Ready for Pickup' : order.status === 'collected' ? 'Collected' : 'Reserved',
            pickupPoint: order.delivery_address || `${order.room_number || currentUser.roomNumber || 'N/A'} Lobby`,
            dateAdded: new Date(order.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          } satisfies Reservation;
        });

        setOrderHistoryReservations(mappedReservations);
      } catch {
        if (!cancelled) {
          setOrderHistoryReservations([]);
        }
      }
    };

    loadOrderHistory();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const mergedReservations = [...orderHistoryReservations, ...reservations].reduce<Reservation[]>((accumulator, reservation) => {
    if (accumulator.some((entry) => entry.id === reservation.id)) {
      return accumulator;
    }
    return [...accumulator, reservation];
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadInventory = async () => {
      try {
        const [tiesResponse, paidUsersResponse] = await Promise.all([
          fetch(`${getBackendUrl()}/quantity/ties`),
          fetch(`${getBackendUrl()}/quantity/paid-users`),
        ]);

        const ties = (await tiesResponse.json().catch(() => [])) as InventoryRow[];
        const paidUsers = (await paidUsersResponse.json().catch(() => ({ paid_orders: 0, unique_paid_users: 0 }))) as {
          paid_orders?: number;
          unique_paid_users?: number;
        };

        if (cancelled) return;

        const tieMap = new Map(ties.map((row) => [row.tie_id, row]));

        setProducts((previousProducts) =>
          previousProducts.map((product) => {
            const liveTie = tieMap.get(product.id);
            if (!liveTie) return product;

            return {
              ...product,
              name: liveTie.tie_name || product.name,
              price: Number(liveTie.price ?? product.price),
              stock: Number(liveTie.quantity ?? product.stock),
            };
          })
        );

        setInventorySummary({
          totalQuantity: ties.reduce((total, tie) => total + Number(tie.quantity || 0), 0),
          availableTies: ties.filter((tie) => tie.is_active && !tie.is_sold_out).length,
          paidUsers: Number(paidUsers.unique_paid_users ?? paidUsers.paid_orders ?? 0),
        });
      } catch {
        if (!cancelled) {
          setInventorySummary({ totalQuantity: 0, availableTies: 0, paidUsers: 0 });
        }
      }
    };

    loadInventory();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('cu_marketplace_products_v4', JSON.stringify(products));
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = (params.get('status') || params.get('tx_status') || '').toLowerCase();
    const txRef = params.get('tx_ref') || params.get('transaction_id');
    if (status || txRef) {
      setCurrentTab('checkout');
    }
  }, []);

  const addToast = (message: string, type: 'cart' | 'wishlist' | 'success' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((previous) => [...previous, { id, message, type }]);
    setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  };

  const handleAuthSuccess = (user: any, accessToken?: string) => {
    const normalizedUser = normalizeUser(user);
    setCurrentUser(normalizedUser);
    persistAuthSession(normalizedUser, accessToken);
    setIsAuthOpen(false);
    addToast(`Successfully signed in as ${normalizedUser.name}!`, 'success');

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
    clearAuthSession();
    addToast('Logged out successfully', 'success');
  };

  const handleResetLocalSession = () => {
    clearClientSessionState();
    window.location.reload();
  };

  const handleBrowseWithFilter = (category: string, searchQuery: string = '') => {
    setSharedCategory(category);
    setSharedSearchQuery(searchQuery);
    setCurrentTab('marketplace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddReservation = (newReservation: Reservation) => {
    setReservations((previous) => [newReservation, ...previous]);
    addToast(`Reservation ${newReservation.id} successfully created!`, 'success');
  };

  const handleUpdateUser = (updatedUser: any) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('knotify_current_user', JSON.stringify(updatedUser));
  };

  const handleUpdateReservation = (updatedReservation: Reservation) => {
    setReservations((previous) => previous.map((reservation) => (reservation.id === updatedReservation.id ? updatedReservation : reservation)));
  };

  const executeAddToCart = (product: Product, quantity: number = 1) => {
    setCartItems((previous) => {
      const safeQuantity = Number(quantity) || 0;
      const maxStock = Number(product.stock) || 0;
      const existing = previous.find((item) => item.product.id === product.id);
      if (existing) {
        const newQuantity = Math.min(existing.quantity + safeQuantity, maxStock);
        return previous.map((item) => (item.product.id === product.id ? { ...item, quantity: newQuantity } : item));
      }
      return [...previous, { product, quantity: Math.min(safeQuantity, maxStock) }];
    });
    addToast(`"${product.name}" added to bag`, 'cart');
    setCurrentTab('checkout');
  };

  const executeDirectBuyNow = (product: Product) => {
    executeAddToCart(product, 1);
    setActiveProduct(null);
    setCurrentTab('checkout');
  };

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    executeAddToCart(product, quantity);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    const targetProduct = products.find((product) => product.id === productId);
    if (!targetProduct) return;

    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }

    setCartItems((previous) =>
      previous.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.min(Number(quantity) || 0, Number(targetProduct.stock) || 0) } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    const targetItem = cartItems.find((item) => item.product.id === productId);
    if (targetItem) {
      addToast(`Removed "${targetItem.product.name}" from bag`, 'success');
    }
    setCartItems((previous) => previous.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    addToast('Bag cleared', 'success');
  };

  const handleToggleWishlist = (product: Product, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    setWishlist((previous) => {
      const exists = previous.includes(product.id);
      if (exists) {
        addToast(`Removed "${product.name}" from wishlist`, 'success');
        return previous.filter((id) => id !== product.id);
      }

      addToast(`Added "${product.name}" to wishlist`, 'wishlist');
      return [...previous, product.id];
    });
  };

  const handleAddListing = (newProduct: Product) => {
    setProducts((previous) => [newProduct, ...previous]);
    addToast(`Listed "${newProduct.name}" for sale!`, 'success');
  };

  const handleDirectBuyNow = (product: Product) => {
    executeDirectBuyNow(product);
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlist.length;
  const featuredProducts = products.filter((product) => product.isFeatured);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-bg relative antialiased" id="marketplace-viewport">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
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

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentTab === 'home' ? (
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
                products={products}
                featuredProducts={featuredProducts}
                onOpenProductDetail={setActiveProduct}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={(product) => handleAddToCart(product, 1)}
                isInWishlist={isInWishlist}
                inventorySummary={inventorySummary}
              />
            </motion.div>
          ) : currentTab === 'marketplace' ? (
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
            </motion.div>
          ) : currentTab === 'sell' ? (
            <motion.div
              key="sell"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <SellPage />
            </motion.div>
          ) : currentTab === 'wishlist' ? (
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
                onAddToCart={(product, quantity) => {
                  handleAddToCart(product, quantity);
                  setCurrentTab('checkout');
                }}
                onBackToCollection={() => setCurrentTab('marketplace')}
              />
            </motion.div>
          ) : currentTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard
                currentUser={currentUser}
                onUpdateUser={handleUpdateUser}
                reservations={mergedReservations}
                onUpdateReservation={handleUpdateReservation}
                wishlist={wishlist}
                products={products}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
                onLogout={handleLogout}
                onOpenAuth={() => {
                  setPendingAction(null);
                  setIsAuthOpen(true);
                }}
                setCurrentTab={setCurrentTab}
              />
            </motion.div>
          ) : (
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
                onClearCart={handleClearCart}
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

      <Footer
        setCurrentTab={setCurrentTab}
        onOpenBecomeSeller={() => setCurrentTab('sell')}
        onResetLocalSession={handleResetLocalSession}
      />

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

      <AnimatePresence>
        {isBecomeSellerOpen && <SellPage />}
      </AnimatePresence>

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

      <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3.5 pointer-events-none w-full max-w-xs sm:max-w-sm px-4" id="toast-notifications-container">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.25 } }}
              className="relative pointer-events-auto bg-[#1F3E2B] border border-brand-accent/20 text-[#FFFEF2] rounded-xl p-3.5 pr-8 shadow-2xl overflow-hidden flex flex-col w-full"
              id={`toast-${toast.id}`}
            >
              <div className="flex items-center justify-between border-b border-[#FFFEF2]/10 pb-1.5 mb-2 w-full">
                <div className="flex items-center gap-1.5">
                  <div className="bg-[#FFFEF2] text-[#1F3E2B] w-4.5 h-4.5 flex items-center justify-center rounded-md font-serif text-xs font-bold shadow-sm select-none">
                    †
                  </div>
                  <span className="text-[9px] font-mono tracking-[0.25em] text-[#FFFEF2] font-black uppercase">KNOTIFY</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#FFFEF2]/50 font-mono text-[8px] uppercase tracking-widest">
                  <span>{toast.type === 'cart' ? 'BAG' : toast.type === 'wishlist' ? 'WISHLIST' : 'SYSTEM'}</span>
                  <span>•</span>
                  <span>now</span>
                </div>
              </div>

              <div className="text-left w-full">
                <p className="text-xs font-sans text-white/95 leading-relaxed font-medium">{toast.message}</p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="absolute top-2 right-2 text-[#FFFEF2]/50 hover:text-[#FFFEF2] p-1 hover:bg-white/10 rounded transition-colors cursor-pointer shrink-0"
                title="Dismiss alert"
              >
                <X size={10} />
              </button>

              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/15 overflow-hidden">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 3.5, ease: 'linear' }}
                  className="h-full bg-brand-bg/65"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}