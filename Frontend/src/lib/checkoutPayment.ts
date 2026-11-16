import { getAccessToken } from './authStorage';

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

/**
 * Turn an API failure into something a shopper can act on.
 *
 * The backend answers with `{detail: string}`, FastAPI's validation shape
 * (`{detail: [{loc, msg, type}]}`) or a gateway message. Showing the raw body
 * is how "PGRST204" ends up in front of a customer; showing nothing is how a
 * 409 stock conflict looks like a dead button. This maps both.
 */
export function describeApiError(status: number, data: unknown): string | null {
  const body = data as { detail?: unknown; message?: unknown } | null;
  const detail = body?.detail;

  if (typeof detail === 'string' && detail.trim()) return detail.trim();

  // FastAPI 422: pull the offending field and its message out of the array.
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { loc?: unknown; msg?: unknown };
    const loc = Array.isArray(first?.loc) ? first.loc : [];
    const field = loc.length > 1 ? String(loc[loc.length - 1]) : '';
    const message = typeof first?.msg === 'string' ? first.msg : '';
    if (message) return field ? `${field}: ${message}` : message;
  }

  if (typeof body?.message === 'string' && body.message.trim()) return body.message.trim();

  switch (status) {
    case 400:
      return 'That request was not valid. Please check your details.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'This action is not allowed for your account.';
    case 404:
      return 'That tie is no longer in the catalogue.';
    case 409:
      return 'Some ties are no longer available. Refresh your bag and try again.';
    case 413:
      return 'That request was too large.';
    case 422:
      return 'Some details on the form are not valid. Please check them and try again.';
    case 429:
      return 'Too many attempts. Please wait a minute and try again.';
    case 502:
    case 503:
    case 504:
      return 'Our payment service is temporarily unavailable. Nothing was charged — please try again shortly.';
    default:
      return status >= 500
        ? 'Our server could not complete that request. Nothing was charged — please try again.'
        : null;
  }
}

/** Read the error body (once) and return a displayable message. */
export async function readApiError(response: Response, fallback: string): Promise<string> {
  const data = await response.json().catch(() => null);
  return describeApiError(response.status, data) || fallback;
}

async function postJson(path: string, payload: unknown) {
  const token = getAccessToken();

  try {
    return await fetch(`${getBackendUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // A network/DNS/CORS failure never reaches a status code; say so instead
    // of leaking "Failed to fetch".
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
}

export interface CheckoutSessionResponse {
  checkout_url?: string;
  tx_ref?: string;
}

/** POST /api/pay - every amount is re-priced by the backend. */
export async function createCheckoutSession(payload: unknown): Promise<CheckoutSessionResponse> {
  const response = await postJson('/api/pay', payload);

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Could not create your payment session.'));
  }

  const data = (await response.json().catch(() => null)) as CheckoutSessionResponse | null;
  if (!data || (!data.tx_ref && !data.checkout_url)) {
    throw new Error('The payment server sent an unexpected response. Nothing was charged.');
  }

  return data;
}

export async function checkInventoryAvailability(
  items: Array<{ tie_id: string; quantity: number }>
) {
  const response = await postJson('/quantity/availability', { items });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Could not verify live tie availability.'));
  }

  return response.json() as Promise<Array<{
    tie_id: string;
    requested_quantity: number;
    available_quantity: number;
    available: boolean;
  }>>;
}

export async function fetchOrderStatus(txRef: string) {
  const backendUrl = getBackendUrl();
  const response = await fetch(
    `${backendUrl}/api/status/${encodeURIComponent(txRef)}`
  );

  if (!response.ok) {
    return null;
  }

  // Whitelist mirrors the backend's OrderStatusResponse: GET /api/status
  // no longer returns buyer PII (name/email/phone/room/address/cart), only
  // the status fields this confirmation flow reads.
  const order = await response.json() as {
    tx_ref: string;
    status: string;
    amountpaid?: number;
    items_total?: number;
    item_count?: number;
    currency?: string;
    created_at?: string;
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
