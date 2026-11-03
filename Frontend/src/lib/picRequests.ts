import { getAccessToken } from './authStorage';
import { getBackendUrl } from './checkoutPayment';

/**
 * Feature C — "Request knotted tie pic" (+₦150, 48-hour inventory hold).
 *
 * Two client-side responsibilities, nothing more:
 *   1. keep the per-device `client_key` stable. It is an unguessable bearer
 *      secret that lets a GUEST's outstanding ₦150 rows be matched at checkout
 *      and lets their own 48h hold be ignored by the availability check.
 *   2. remember which pic requests this device opened, so checkout can SHOW
 *      the fee line. The amount actually charged is always decided server-side
 *      from the `pic_requests` table — this list is display only.
 *
 * The Telegram bot token never appears here; the backend returns a one-time
 * t.me deep link and that is all the browser ever sees.
 */

export const PIC_FEE = 150;

const CLIENT_KEY_STORAGE = 'knotify_pic_client_key';
const LOCAL_REQUESTS_STORAGE = 'knotify_pic_requests';

function randomKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Stable 128-bit device secret, valid against the backend's [A-Za-z0-9_-]{16,64} rule. */
export function getPicClientKey(): string {
  try {
    const existing = localStorage.getItem(CLIENT_KEY_STORAGE);
    if (existing && /^[A-Za-z0-9_-]{16,64}$/.test(existing)) return existing;
    const fresh = randomKey();
    localStorage.setItem(CLIENT_KEY_STORAGE, fresh);
    return fresh;
  } catch {
    // Private-mode / storage-blocked: still functional, just not durable.
    return randomKey();
  }
}

export interface PicRequestResult {
  tx_ref: string;
  tie_id: string;
  tie_name: string;
  status: string;
  fee: number;
  fee_status: string;
  hold_expires_at: string;
  deep_link: string | null;
  already_requested: boolean;
}

export function getLocalPicRequests(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_REQUESTS_STORAGE);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function rememberPicRequest(txRef: string) {
  try {
    const current = getLocalPicRequests();
    if (!current.includes(txRef)) {
      localStorage.setItem(LOCAL_REQUESTS_STORAGE, JSON.stringify([...current, txRef]));
    }
  } catch {
    /* storage unavailable — the server remains the source of truth anyway */
  }
}

/** Outstanding ₦150 rows this device opened. Display only; server re-decides. */
export function getOutstandingPicFee(): number {
  return getLocalPicRequests().length * PIC_FEE;
}

/** Called once an order actually completed: its pic fees were charged. */
export function clearLocalPicRequests() {
  try {
    localStorage.removeItem(LOCAL_REQUESTS_STORAGE);
  } catch {
    /* ignore */
  }
}

export async function createPicRequest(input: {
  tieId: string;
  email?: string | null;
  note?: string | null;
}): Promise<PicRequestResult> {
  const token = getAccessToken();
  const response = await fetch(`${getBackendUrl()}/api/pic-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      tie_id: input.tieId,
      client_key: getPicClientKey(),
      email: input.email || undefined,
      note: input.note || undefined,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === 'string'
        ? data.detail
        : 'Could not create your pic request. Please try again.'
    );
  }

  const result = data as PicRequestResult;
  if (result?.tx_ref) rememberPicRequest(result.tx_ref);
  return result;
}
