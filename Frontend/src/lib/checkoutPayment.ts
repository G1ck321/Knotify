export const PENDING_CHECKOUT_KEY = 'knotify_pending_checkout';

export const PAYMENT_SUCCESS_STATUSES = new Set(['successful', 'completed', 'success']);
export const PAYMENT_FAILURE_STATUSES = new Set(['cancelled', 'canceled', 'failed', 'error']);

export interface PendingCheckout {
  tx_ref: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerHall: string;
  roomNumber: string;
  itemsTotal: number;
  totalAmountPayable: number;
  totalItems: number;
  productNames: string;
  preferredColor: string;
}

export function getBackendUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL || 'https://knotify-p9i2.onrender.com';
  return raw.replace(/\/$/, '');
}

export function savePendingCheckout(payload: PendingCheckout) {
  sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(payload));
}

export function loadPendingCheckout(txRef?: string): PendingCheckout | null {
  const saved = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved) as PendingCheckout;
    if (txRef && parsed.tx_ref !== txRef) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingCheckout() {
  sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
}

export async function fetchOrderStatus(txRef: string) {
  const backendUrl = getBackendUrl();
  const response = await fetch(
    `${backendUrl}/api/status/${encodeURIComponent(txRef)}`
  );

  if (!response.ok) {
    return null;
  }

  const order = await response.json() as {
    tx_ref: string;
    status: string;
    amountpaid?: number;
    buyer_name?: string;
    order_details?: string;
    cart_snapshot?: Array<{ tie_id?: string; tie_name?: string; quantity?: number }>;
    email_snapshot?: string;
    phone_snapshot?: string;
    room_number?: string;
    delivery_address?: string;
    paid_at?: string;
  };

  return {
    ...order,
    status: order.status?.toLowerCase() || '',
  };
}

export function parsePaymentReturnParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    status: (params.get('status') || params.get('tx_status') || '').toLowerCase(),
    txRef: params.get('tx_ref') || params.get('transaction_id') || '',
  };
}

export function clearPaymentReturnParams() {
  window.history.replaceState({}, document.title, window.location.pathname);
}
