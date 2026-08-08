const USER_KEY = 'knotify_current_user';
const TOKEN_KEY = 'knotify_access_token';
const LEGACY_TOKEN_KEYS = ['access_token', 'knotify_jwt', 'knotify_token'] as const;
const CLIENT_STORAGE_KEYS = [
  USER_KEY,
  TOKEN_KEY,
  'cu_marketplace_products_v4',
  'cu_marketplace_cart',
  'cu_marketplace_wishlist',
  'knotify_reservations',
] as const;

export function getStoredUser<T = Record<string, unknown>>(): T | null {
  const saved = localStorage.getItem(USER_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as T;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function getAccessToken(): string | null {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('knotify_jwt') ||
    localStorage.getItem('knotify_token')
  );
}

export function persistAuthSession(user: Record<string, unknown>, accessToken?: string) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
  }
}

export function clearAuthSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function clearClientSessionState() {
  CLIENT_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  sessionStorage.clear();
}

/**
 * A wrapper around the normal fetch() function.
 *
 * Its job is to:
 * 1. Get the user's JWT from localStorage.
 * 2. Attach that JWT to the request.
 * 3. Send the request to FastAPI.
 * 4. Detect a 401 Unauthorized response.
 * 5. Clear the frontend session when the JWT is no longer valid.
 *
 * We return the Response object so the caller can still use:
 * response.ok
 * response.status
 * response.json()
 * etc.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response>
{
  const token = getAccessToken();

  // Create a Headers object from any headers the caller already supplied.
  // This lets us add Authorization without destroying existing headers.
  const headers = new Headers(options.headers)

  if (token) {  
    //Authorization ✅ Authorisation❌ 
    headers.set("Authorization", `Bearer ${token}`)
    
  }

  const response = await fetch(url, {
    ...options, headers
  }
  );

  if (response.status == 401) {
    clearAuthSession();
    //Tell react the auth expired
    window.dispatchEvent(new Event("auth-expired"))
  }

  return response;
}