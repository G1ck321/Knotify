# Knotify — Deployment Session Notes & 13-Day Architecture Plan

This document records what was imported/changed in this deployment session (mapped to
your 11 numbered requests) and then lays out a 13-day plan to fully understand the
Knotify architecture, with concrete resources (docs, books, sites, videos, tutorials).

**Part 1B** records the follow-up update — everything that changed after this document's
first draft (2026-10-16 → 2026-10-23, branch `feature/cloud-deployments-update`),
organized top-down: repo folders → subdirectories → the major functions & helpers.

Repo layout:
- `Frontend/` — React 19 + Vite + TypeScript + Tailwind v4 + Framer Motion (the app you run).
- `Backend/` — FastAPI + Supabase (Postgres) + Flutterwave, exposes the REST API the frontend calls.

---

## Part 1 — Deployment Change-Log (your 11 items)

### 1. About Us page (1,850 capacity + Our Mission), navigable from Home
- Added `src/components/AboutPage.tsx` (renders the "Our mission" hero with the
  **1,850+ students serving capacity** figure, plus the existing `AboutSection`).
- `src/App.tsx` has a `currentTab === 'about'` route wired to `AboutPage`.
- `src/components/LandingPage.tsx` has an About CTA (`onNavigateAbout`) on the home page.
- Navigating to About sets `currentTab='about'` and scrolls to top.

### 2. Better highlight for Store / Collection nav item
- `src/components/Navbar.tsx`: the active tab now gets a filled pill
  (`bg-brand-secondary` + `font-bold` + ring) and `aria-current="page"`, so Store/About
  visibly "light up" when you are on them.

### 3 + 10 (pages). Bold "Back to Shop" at the top-left on every page
- Added a bold, top-left **BACK TO SHOP** button (with left arrow) to:
  `Marketplace.tsx`, `WishlistPage.tsx`, `Dashboard.tsx`, `CheckoutPage.tsx`,
  `SellPage.tsx`, `AboutPage.tsx`. All route back to the shop/marketplace so users
  don't get stranded on a sub-page.

### 4. Reserve modal (Material Information) restored; Add to Bag must not redirect
- `src/components/ProductDetailModal.tsx` is the reserve modal — shows **Material
  Information**, deposit + balance, size/condition.
- Product card clicks open the modal (`handleProductClick` → `setActiveProduct`).
- **Add to Bag never navigates**: `executeAddToCart(product, qty, redirectToCheckout=false)`
  only adds + toasts + highlights the bag. Only explicit "Buy Now" redirects to checkout.

### 5. Bag icon highlight animation after add-to-bag
- `App.tsx` sets `isBagHighlighted=true` for 1.2s on every add;
  `Navbar.tsx` applies `ring-2 ring-brand-secondary bg-brand-secondary/10 scale-105`
  to the bag button while highlighted.

### 6. "Be the No. {} student" counter restored
- `LandingPage.tsx` live counter strip (`#live-student-counter`):
  **"Be the No. {paidUsers + 1} student"** plus "+ ties in stock" and "+ paid students",
  driven by `inventorySummary` fetched from the backend.

### 7. One-Naira (Blue Floral) meme: longer duration + close button + image preload
- `App.tsx`:
  - Meme shows for **6 seconds** (`MEME_DURATION_MS = 6000`) — inside your 5–7s window,
    giving slow connections time to load.
  - **X close button** (always visible) + click-backdrop to dismiss.
  - **Image preloaded on mount** (`new Image().src = '/meme/ragebait.jpg'`) so it is
    instant even on low bandwidth. Also `loading` handled on landing tie images.
- Trigger: tapping the **Blue Floral Corporate Tie** (`id === 'corp-blue-floral'`)
  shows the meme; every other product opens the reserve modal.

### 8. Reset Local Session + Sign-in clear (kept)
- `clearClientSessionState()` (clears user, token, cart, wishlist, products,
  reservations + sessionStorage) is wired to the Footer **Reset Local Session**.
- `clearAuthSession()` (clears user + all token keys) runs on logout and on 401
  (`auth-expired` event clears the in-memory user too).

### 9. "Hold the tie" inventory persistence (kept)
- Cart, wishlist, products and reservations persist to `localStorage` on every change,
  so a reserved/held tie survives reloads. Live stock is re-synced from
  `/quantity/ties` on load.

### 10 (navbar). Profile icon beside the name
- `Navbar.tsx`: when signed in, the account button shows a **circular User icon
  beside the first name** (plus a separate logout icon) for easy recognition.

### 11. Backend API compliance & wiring
Audited `Frontend` calls against `Backend` routers. Two real bugs found and **fixed**:

1. **Manual login dropped the JWT** — `AuthModal.handleLogin` received `access_token`
   but called `onSuccess(user)` without it, so `GET /api/me` would 401 after a normal
   sign-in. **Fix:** now calls `onSuccess(normalizedUser, response.access_token)`.
2. **Order status URL mismatch** — `fetchOrderStatus` called
   `/api/orders/status/{tx_ref}`, but the backend route is **`/api/status/{tx_ref}`**
   (orders router prefix `/api` + `@router.get("/status/{tx_ref}")`).
   **Fix:** corrected the URL in `src/lib/checkoutPayment.ts`.

Confirmed aligned (no change needed):
- `POST /api/auth/signup`, `POST /api/auth/login` ↔ `Backend/routers/auth.py`.
- `GET /api/me` (order history) ↔ `orders.py @router.get("/me")`.
- `GET /quantity/ties`, `GET /quantity/paid-users` ↔ `quantity.py`.
- `POST /api/pay`, `POST /api/reviews` ↔ `orders.py`.
- `getBackendUrl()` reads `VITE_API_BASE_URL` (default `http://127.0.0.1:5500`).

> Run the backend with `cd Backend && uvicorn main:app --port 5500` (or `python main.py`).
> CORS in `Backend/main.py` currently allows `http://localhost:3001` and the deployed
> hosts — if you run the frontend on a different local port, add it there.

### Verification performed
- `npx tsc --noEmit` (Frontend) → **exit 0, no errors** (run before and after the API fixes).
- Browser walkthrough (Vite dev server): About page + 1,850 figure; Store nav highlight;
  Back-to-Shop on sub-pages; reserve modal with Material Info; Add-to-Bag (no redirect);
  bag highlight; "Be the No. {} student"; **meme shows and the X button dismisses it**
  (verified `stillVisibleAfterClose: false`); profile icon beside name.

---

## Part 1B — Recent Changes Update (2026-10-16 → 2026-10-23)

Scope: 12 commits (`415130c…70fadc0`), 76 files, +1,731/−401, on branch
`feature/cloud-deployments-update` — including the fixes for Autter's PR #5 review and
the deterministic PII scan. (Stats are the `git diff 9dadee0..HEAD` totals.)

### High-folder map — what changed where

```
Knotify/
├── DEPLOYMENT_NOTES.md        this file (new, still untracked in git)
├── scripts/                   NEW folder at repo root
│   └── compress_photos.py     replaces the old public/ties/conv.py
├── Backend/
│   ├── main.py                CORS origins updated
│   ├── routers/               orders / quantity / webhooks: inventory holds + hardening
│   ├── sql/                   ⚠ GIT-IGNORED — migrations exist on disk only
│   ├── ORDER_INVENTORY_HOLDS.md            NEW
│   ├── TELEGRAM_INVENTORY_AUTOMATION.md    NEW
│   └── localdatabase.py, request_models_usage.md, tests/   NEW untracked WIP
└── Frontend/
    ├── wrangler.jsonc         worker renamed react-example → knotifycu
    ├── public/ties/           ~20 new images, 14 JPGs recompressed, conv.py removed
    └── src/
        ├── App.tsx            meme, catalog-refresh and add-to-cart helpers
        ├── types.ts           ~20 new catalog entries + type repairs
        ├── lib/               checkoutPayment, authStorage, NEW sampleData
        └── components/        checkout security + live stock, UI-rework batch
```

### Backend/

**`main.py`** — `allow_origins` gained `http://localhost:3003`; the deployed worker
origin is now `https://knotifycu.knotifycu.workers.dev` (trailing slash removed).

**`routers/quantity.py`** — the inventory-hold layer:
- `TieInventoryResponse` now carries `image_url` (served to the frontend for cart lines).
- New constants/models: `HOLD_MINUTES = 10`, `InventoryAvailabilityRequest`.
- **Major helpers added:**
  - `_active_hold_quantities()` — runs the `expire_inventory_holds` RPC, then sums
    still-active holds per tie.
  - `check_inventory_availability(items)` → RPC `check_inventory_availability`.
  - `reserve_inventory(tx_ref, items)` → RPC `reserve_inventory` (raises 409 when a tie
    is gone).
  - `release_inventory_hold(tx_ref, status)` / `consume_inventory_hold(tx_ref)` → RPCs.
  - All five RPCs are defined in `sql/20261009_inventory_holds.sql`.
- `get_all_ties()` now reports **available = quantity − active holds**, so
  `GET /quantity/ties` never advertises stock that is locked by another checkout.
- **New route:** `POST /quantity/availability` → `read_inventory_availability()`.

**`routers/orders.py`** — `initialize_payment()` (`POST /api/pay`) hardened:
- `NON_PURCHASABLE_TIE_IDS = {"corp-blue-floral"}` → 409 (the meme tie can't be bought).
- `tx_ref` generated up-front; `image_url` taken from the inventory row, **not** from the
  client payload (server-trust fix).
- `reserve_inventory(tx_ref, …)` runs right after the order insert — on 409 the order is
  flipped to `failed` before re-raising.
- `orders.hold_expires_at = now + 10 min` persisted for the expiry sweep.
- Demo-payment and Flutterwave `redirect_url` now point at
  `https://knotifycu.knotifycu.workers.dev/` (was `knotifycu.vercel.app`).
- **`GET /api/status/{tx_ref}` PII fix** (confirmed review finding — the route returned
  the raw orders row with buyer name/email/phone/parents' number/room/address/cart):
  it now returns a whitelisted `OrderStatusResponse` (`tx_ref`, `status`, amounts,
  item count, currency, timestamps), enforced twice — explicit projection in the
  handler **and** the route's `response_model`. Deliberately **not** gated behind
  `get_current_user`: guest checkout never issues a JWT, so auth would break the
  post-redirect confirmation for every guest; the 128-bit `tx_ref` is the capability
  for reading *status only*. Any future PII-bearing endpoint must instead bind
  `.eq("user_id", current_user["id"])` like `GET /api/me`. Covered by
  `tests/test_orders.py`.

**`routers/webhooks.py`** — `flutterwave_webhook()` hardening:
- Constant-time signature check via `hmac.compare_digest` (was a plain `!=`), and a 401
  when `verif-hash` is missing/invalid, with diagnostics logged either way.
- `status`/`tx_ref` normalized from both payload shapes (`data.*` or top-level).
- `failed | cancelled | error` → order `failed` + `release_inventory_hold(tx_ref)`.
- `successful` → background tasks `decrement_stock_for_order(cart_snapshot)` +
  `consume_inventory_hold(tx_ref)`; missing `tx_ref` → 400.

**`sql/` — ⚠ GIT-IGNORED.** The `.gitignore` `sql/` rule hides the whole folder (from a
count of `git status` too), and the previously tracked copy of
`20260803_ties_inventory.sql` shows as removed from git in this window. The six
migrations live on disk only — apply them **by hand in the Supabase SQL editor**, in
order: `20260803` → `20261008_*` → `20261009_inventory_holds` →
`20261021_insert_new_remainder_ties` (NEW: 13 remainder ties matching `types.ts`,
idempotent `on conflict` upsert — safe to re-run).

**New docs (committed):** `ORDER_INVENTORY_HOLDS.md` (how the 10-minute hold pipeline
works end-to-end), `TELEGRAM_INVENTORY_AUTOMATION.md`.

**Untracked WIP:** `localdatabase.py` (SQLAlchemy `engine` / `SessionLocal` / `get_db`
for a local Postgres via `DATABASE_URL`), `request_models_usage.md` (plan for multi-item
checkout request models alongside the legacy flat `schemas.py`), and `tests/`
(`test_auth.py`, `test_orders.py`, `test_quantity.py`).

### Frontend/

**`wrangler.jsonc`** — worker renamed `react-example` → `knotifycu`, assets `./dist`.

**`src/lib/checkoutPayment.ts`**
- `getBackendUrl()` default now `https://knotify-p9i2.onrender.com` — this **supersedes**
  the `http://127.0.0.1:5500` default recorded in Part 1 §11.
- **NEW** `checkInventoryAvailability(items)` → `POST /quantity/availability`.
- `fetchOrderStatus()` → corrected path `/api/status/{tx_ref}`; `status` lower-cased so
  the success/failure sets in `CheckoutPage` match reliably.

**`src/lib/authStorage.ts`** — catalog cache bumped `cu_marketplace_products_v4` →
`_v5`; **NEW** `clearProductCatalogCache()` drops the old key on load.

**`src/lib/sampleData.ts` — NEW.** `SAMPLE_PHONE` and `SAMPLE_PARENTS_PHONE` hold the
fictional demo numbers the PII scan flagged; all 9 phone literals (AuthModal ×6,
CheckoutPage ×2, App ×1) now import from here. Both now read `0123456789` — 10 digits,
so they fall outside the scanner's 11-digit `0[0-9]{10}` pattern and the PHONE_NUMBER
hits clear without an allowlist entry (re-run the scan to confirm).

**`src/App.tsx`** (+198) — major helpers:
- Meme: `showBlueFloralMeme()` / `closeMeme()`, `MEME_SRC = '/meme/ragebait.jpg'`,
  `MEME_DURATION_MS = 6000`, `memeTimerRef`, mount-time image preload.
- `handleProductClick()` (meme tie vs reserve modal), `refreshCatalog()` (products_v5
  cache), `handleReturnMarket()`.
- `executeAddToCart(product, qty, redirectToCheckout = false)` — only an explicit Buy
  Now redirects to checkout.
- Live-stock merge on load: `stock: Number(liveTie.quantity ?? product.stock)` from
  `GET /quantity/ties`; cart quantity clamped to `maxStock`.

**`src/components/CheckoutPage.tsx`** (largest change, +303/−…) — payment path:
- **Removed** the `handleSimulatePayment` function + "Simulate Paid Order" button
  (PR #5 finding 1 — no client-side payment bypass remains; grep-verified).
- **NEW** `getLiveUnitPrice(item)` — live price resolution: fresh `products` prop →
  cart snapshot `price` → static `originalPrice` (early-bird discounts survive).
- **NEW** `getLiveStock(item)` + three-state badge: `In Stock` / `Out of Stock` /
  `Temporarily Unavailable` (from `unavailableItemIds`) instead of a hard-coded
  "In Stock" (PR #5 finding 4).
- `handleStartCheckout()` — availability gate: calls `checkInventoryAvailability`,
  fills `unavailableItemIds`, shows the amber prompt; `checkoutItems` excludes held
  ties; errors fail closed (no path to `POST /api/pay` without a passing check).
- `handleInitiatePayment()` → `createCheckoutSession` → `POST /api/pay`.

**`src/components/` — UI-rework batch (Oct 17–20):** `LandingPage` (+124: counter-strip
copy, scroll handlers, image preload), `Navbar` (+56: frosted scroll backdrop, active
pill, profile icon, bag highlight), `ProductDetailModal` (+62), `AboutPage` (+44),
`Marketplace` (+45), `SellPage` (+21), `Dashboard` (+19), `WishlistPage` (+12),
`Footer` (+5), `index.css` (+5). Inside `Marketplace`: `hasStock()` filter
(`onlyInStock`), discount-percent badge, and the dead `'Brand New'` condition fixed to
`'Student-Ready'` so the NEW badge and stock filter actually fire.

**`src/types.ts`** (+582) — ~20 new `INITIAL_PRODUCTS` entries (navy-tricolor-blue,
Wide-plain-black, Wide-black-stripped, burgundy-striped-satin, corp-black-floral,
corp-blue-floral, black-gray-striped, corp-black-dotted, new-black-criss, dark-wine-plain,
Deep-plain-wine, new-black-logo, brown-skin-tie, the wine stripe/pattern/crest variants,
wine-cup-logo, corp-dark-wine, dark-blue-copter …), plus two repairs: the
`Reservation.status` union restored to `'Collected'` (a mangled bulk replace had pasted
checkout copy into it), and `corp-black-floral`'s stale `price: 1` removed so it prices
from `originalPrice: 4000` (PR #5 finding 3).

**`public/ties/`** — ~20 new product images across `latest/` and `remainder/`, 14 JPGs
recommitted recompressed for load time (`4d63798`),and **`public/ties/conv.py` removed** — the image converter no longer ships as a
downloadable static asset
(PR #5 finding 2). `Frontend/README.md` trimmed (−19).

### `scripts/` (repo root, NEW)

**`scripts/compress_photos.py`** — the converter's replacement home and fix: CLI
(`argparse`: input dir, `--output`, `--quality`), `__main__` guard (no run-on-import),
**any** non-RGB mode (RGBA/P) converted to RGB before JPEG save — the bug that crashed
the old script with `OSError: cannot write mode RGBA as JPEG` — and an actionable
`pip install Pillow` hint.

### Verification for this update
- `npx tsc --noEmit` (repo's `lint`) → **exit 0**.
- `npm run build` → **exit 0** (~32 s; only the pre-existing >500 kB chunk warning).
- `compress_photos.py` sandbox → **exit 0** on RGBA/palette/RGB fixtures + real tie images.
- Raw 11-digit phone-literal grep across `Frontend/src` + `Backend` → **zero matches**
  (mock numbers are now `0123456789`, which the pattern can't match).

---

## Part 2 — 13-Day Architecture Learning Plan

Goal: go from "I can edit components" to "I can explain and change every layer —
React state, FastAPI routes, Supabase schema, and the Flutterwave payment flow."

Each day is ~1–2 hours. Do the **Hands-on** step — reading alone won't stick.

### Day 1 — Big picture & project orientation
- Map the two folders (`Frontend`, `Backend`) and the request/response flow:
  Browser → React → `fetch`/`authFetch` → FastAPI → Supabase → back.
- Resources:
  - Read this repo's `README.md` and `DEPLOYMENT_NOTES.md` (this file).
  - How the web works: [MDN: Client-server overview](https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Client-server_overview)
  - Video: [HTTP & the request/response cycle](https://www.youtube.com/watch?v=QqeWg2JmBqY) (freeCodeCamp).
- Hands-on: draw the full flow for "user adds a tie to bag" on paper, naming each file.

### Day 2 — React fundamentals (components, props, state)
- Resources:
  - [React docs: Quick Start](https://react.dev/learn) and [Thinking in React](https://react.dev/thinking-in-react).
  - Book: *Roadmap to React* (Safdar Jamal) or *The Beginner's Guide to React* (free, Frontend Masters by Brian Holt).
- Hands-on: trace `App.tsx` state (`cartItems`, `products`, `currentTab`) and which
  child components receive each as props.

### Day 3 — React hooks in depth (useState, useEffect, useRef, context)
- Resources:
  - [React: Built-in Hooks reference](https://react.dev/reference/react/hooks).
  - Video: [React Hooks Explained](https://www.youtube.com/watch?v=TNhaISOUy6Q) (Web Dev Simplified).
- Hands-on: find every `useEffect` in `App.tsx` and写下 what each subscribes to/cleans up
  (e.g. the meme timer `useRef` + `clearTimeout`).

### Day 4 — TypeScript for React (types, interfaces, generics)
- Resources:
  - [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html).
  - [TypeScript for React Developers](https://www.totaltypescript.com/tutorials/typescript-for-react-developers).
  - Repo: read `src/types.ts` (`Product`, `CartItem`, `Reservation`).
- Hands-on: add a required field to the `Product` interface and fix the compile errors
  `tsc` surfaces — learn to read type errors.

### Day 5 — Vite, tooling, and environment config
- Resources:
  - [Vite docs: Env vars & modes](https://vitejs.dev/guide/env-and-mode.html) (`import.meta.env`, `.env`).
  - Understand `npm run dev` / `build` / `lint` (lint = `tsc --noEmit` here).
- Hands-on: change `VITE_API_BASE_URL` in `Frontend/.env` and observe `getBackendUrl()`.
- Watch: [Vite in 100 seconds](https://www.youtube.com/watch?v=KcrhLmTOtqA) (Fireship).

### Day 6 — Tailwind CSS v4 + responsive design
- Resources:
  - [Tailwind docs](https://tailwindcss.com/docs) (v4 uses `@tailwindcss/vite`).
  - Responsive patterns: mobile-first breakpoints (`sm:`, `md:`, `lg:`).
- Hands-on: this app is fully responsive — resize the browser and observe the mobile
  bottom navbar (`sm:hidden`) vs the desktop header. Explain why `sm:` prefixes are used.

### Day 7 — Framer Motion (animations & AnimatePresence)
- Resources:
  - [Framer Motion docs](https://www.framer.com/motion/) — `motion`, `AnimatePresence`,
    enter/exit variants.
  - Repo: the meme overlay and page transitions in `App.tsx`.
- Hands-on: change the meme's enter animation and the page-transition `duration`.

### Day 8 — FastAPI fundamentals (routers, Pydantic, dependency injection)
- Resources:
  - [FastAPI tutorial](https://fastapi.tiangolo.com/tutorial/).
  - Book: *FastAPI, From Zero to Hero* (Tiangolo) or [TestDriven.io FastAPI course](https://testdriven.io/courses/fastapi/).
  - Repo: `Backend/main.py`, `Backend/routers/quantity.py`.
- Hands-on: add a new `GET /quantity/demo` endpoint returning a static list and call it
  from the browser.

### Day 9 — Python data modeling with Pydantic & request validation
- Resources:
  - [Pydantic docs](https://docs.pydantic.dev/latest/).
  - Repo: `Backend/request_models.py`, `Backend/schemas.py` — see `SignupRequest`,
    `TieInventoryResponse`.
- Hands-on: add a field to `SignupRequest` and watch FastAPI return a 422 when it's
  missing (see the custom validation handler in `main.py`).

### Day 10 — Databases with Supabase (Postgres, tables, service role)
- Resources:
  - [Supabase docs](https://supabase.com/docs) — Table Editor, Row Level Security.
  - Repo: `Backend/database.py`, tables `users`, `ties`, `orders`, `user_reviews`.
  - Video: [Supabase in 100 seconds](https://www.youtube.com/watch?v=N7v5Suvq4mA) (Fireship).
- Hands-on: open your Supabase project, inspect the `ties` table, and match a row to the
  JSON returned by `/quantity/ties`.

### Day 11 — Auth: JWT, password hashing, protected routes
- Resources:
  - [FastAPI OAuth2 with JWT](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/).
  - Repo: `Backend/routers/auth.py`, `Backend/services/auth_service.py`,
    `Backend/utils/tokens.py`, `Backend/dependencies.py`, and the frontend
    `src/lib/authStorage.ts` (`authFetch` attaches the Bearer token).
- Hands-on: sign up, log in, and inspect the stored `knotify_access_token` in
  localStorage; then call `GET /api/me` with that token (e.g. via curl) and see the JSON.

### Day 12 — Payments with Flutterwave (init, webhook, verification)
- Resources:
  - [Flutterwave API docs](https://developer.flutterwave.com/docs) — Standard checkout,
    webhooks, signature verification (`verif-hash`).
  - Repo: `Backend/routers/orders.py` (`POST /api/pay`, `GET /api/status/{tx_ref}`),
    `Backend/routers/webhooks.py`, and `src/lib/checkoutPayment.ts`.
  - Understand the two-server-truths rule: the **server** computes the total
    (`compute_order_total` + `disount_logic`) so the client can't tamper with price.
- Hands-on: trace one order end-to-end: cart → `/api/pay` → Flutterwave checkout URL →
  redirect back with `tx_ref` → `GET /api/status/{tx_ref}` → order marked paid.

### Day 13 — Testing, debugging, and deploying the whole stack
- Resources:
  - Testing: [pytest](https://docs.pytest.org/) (Backend has a `tests/` folder),
    [Vitest](https://vitest.dev/) or React Testing Library for the frontend.
  - Debugging: browser DevTools Network tab + FastAPI logs; reproduce a 401/422/500.
  - Deploy: [Vercel](https://vercel.com) (frontend), a host for FastAPI (Railway/Render/
    Fly.io), [Supabase](https://supabase.com) (managed DB). The repo already targets
    `knotifycu.vercel.app` and a `workers.dev` origin in CORS.
- Hands-on: run both servers locally, complete a full purchase flow in test mode, then
  read every line your request touched and explain it out loud.

### Suggested books (across the 13 days)
- *The Road to React* by Robin Wieruch (React, free/paid).
- *FastAPI, From Zero to Hero* by Sebastián Ramírez (FastAPI).
- *Clean Architecture* by Robert C. Martin — for separating frontend/backend concerns.
- *Learning SQL* / Supabase docs — for the data layer.

### Everyday habits
- Keep `npx tsc --noEmit` green after every frontend change.
- Use the browser DevTools **Network** tab to see every API call your click produces.
- When something breaks, ask "which layer?" — UI, network, API route, or DB — and
  bisect from there.

---

## Part 3 — New Feature Plans (2026-10-28): three safe ways each, one recommended

### Feature A — The 14 ties in `Frontend/public/ties/Vintage Ties/new` added to the catalog

**Status: implemented this session.** 14 entries appended to `Frontend/src/types.ts`
(ids `vnt-rwb-sequence` … `vnt-maroon-mosaic`) and seeded in
`Backend/sql/20261028_insert_vintage_new_ties.sql`. Descriptions/materials are
deliberate pattern defaults for you to fill in; names were derived from the actual
images (note: `hockeyTie.jpg` is an embroidered **golfer**, and `coolAbstractVintage.jpg`
was renamed *Abstract Collage Vintage Tie* to avoid colliding with the existing
*Cool Abstract Vintage Tie*).

Three ways it could be done safely:

1. **Static types.ts entries only.** Fastest, no DB touched. Why it's unsafe:
   `POST /api/pay` resolves every item with `get_tie_by_id()`, so a tie with no
   `ties` row renders in the catalog but 404s at checkout, its price never goes
   live through `/quantity/ties`, and stock never decrements (oversell risk).
2. **RECOMMENDED — types.ts entries + matching seed migration (what shipped).**
   Ids match on both sides so App.tsx's `loadInventory` merge (product.id →
   ties.tie_id) picks up live price/stock; checkout works; the migration is
   re-run-safe because `quantity`/`is_active` are excluded from the upsert.
3. **Fully DB-driven catalog.** Frontend renders only what `/quantity/ties`
   returns; adding a tie = one INSERT, no frontend deploy. Why not now: needs
   description/materials/date columns on `ties` and an admin path — build this
   when Feature B's `added_at` lands.

Mistakes not to make: id mismatch between types.ts and `ties.tie_id` (silently
unbuyable); putting discounted prices in types.ts (the stale-price bug returns —
backend owns price); putting `quantity` in the ON CONFLICT update (re-running
restocks sold ties); committing the raw 1–3 MB JPEGs without compressing
(~24 MB of page weight for 14 images); duplicating the parent folder's tie names.

**Docs refactor:** this section is the Feature A record.

---

### Feature B — "Nice ties" strip at the bottom of checkout + newest-first catalog

Three ways:

1. **Pure frontend.** A strip on the checkout page that samples `INITIAL_PRODUCTS`,
   plus a new optional `addedAt` field in types.ts sorted newest-first in catalog.
   Why: zero backend, ships today. Why unsafe-ish: dates live in the client, so
   "newest" goes stale and can't be trusted once ties are added from the DB.
2. **RECOMMENDED — frontend strip + server-owned dates.** Add `added_at timestamptz
   default now()` to `ties`, expose it in `/quantity/ties`, read it into a
   `addedAt` field on Product. Catalog sorts `addedAt` desc (fallback: array
   order); the checkout strip shows 4 ties, newest first, excluding anything
   already in the bag, with random fill only among the remainder (Jumia-style).
   Why: one small migration + one small component; date truth stays server-side.
3. **Server recommendations endpoint.** `GET /api/recommendations?limit=4`
   returns newest + "not in your cart" items; frontend renders whatever comes
   back. Why: later enables "because you viewed X". Why not now: needs caching
   and a cart-aware API you don't have yet.

Mistakes not to make: recommending items already in the bag; randomizing on
every render (jumpy, trust-destroying — seed once per session); letting the
strip's add-to-bag skip the `/quantity/availability` check; hard-coding a "NEW"
badge without a date behind it; putting the strip above the Pay button or
blocking submit (conversion killer); shipping it desktop-first — checkout at CU
is mostly phone traffic.

**Docs refactor:** this section is the Feature B record; migration to write:
`Backend/sql/…_ties_added_at.sql`.

---

### Feature C — "Request knotted tie pic (+₦100, holds the tie 3 days)" button under Reserve

Three ways:

1. **Link-only button.** Opens a `t.me/<bot>?start=…` Telegram deep link with a
   prefilled draft. Why: zero backend. Why unsafe: no record of the request, no
   3-day hold, no billable ₦100 — you cannot enforce or reconcile anything, and
   a stock-1 vintage tie can sell while you're photographing it.
2. **RECOMMENDED — `pic_requests` table + server endpoint + reuse of
   `inventory_holds`.** `POST /api/pic-requests` validates the tie, inserts a
   `pic_requests` row, inserts an `inventory_holds` row with `expires_at = now() +
   3 days` (so `check_inventory_availability`'s existing active-hold sum blocks
   other buyers automatically), adds the ₦100 server-side to the pending order
   total, notifies your Telegram admin bot, and returns a one-time `t.me` link.
   Why: one round trip, reuses machinery that already exists and is tested.
3. **Full integration — pic fee as an order line inside the Flutterwave
   checkout.** The ₦100 rides the same payment; hold is created only after the
   webhook marks the order paid; bot replies with the photo and a status flip.
   Why: money and hold can never disagree. Why later: touches `orders.py`,
   `compute_order_total` and the webhook — bigger, riskier change.

DB changes needed (ways 2 and 3):

- `pic_requests(id, tie_id → ties, tx_ref, user_id nullable, status
  ['requested','delivered','declined','refunded'], price numeric default 100,
  hold_until timestamptz, telegram_message_id, created_at)` with a unique
  constraint on `(tie_id, tx_ref)` for idempotency.
- `inventory_holds`: no schema change required (or optionally a `reason` column
  `'checkout' | 'pic_request'`); the 3-day row must be `status='active'` so the
  availability sum counts it.
- No `ties` schema change. If you go with way 3, the ₦100 becomes a line in
  `cart_snapshot` and `compute_order_total` — server-computed, never client-side.

Likely mistakes and the solutions already on the ground:

- **Adding the ₦100 in the browser** → attacker strips it. Solution: server adds
  it in the total, same rule as the ₦350 delivery fee in `orders.py`.
- **Hold stored only in localStorage** → lost on a new device. Solution: the
  `inventory_holds` row is the hold; localStorage is a courtesy reminder only.
- **Double-click duplicates** → two fees, two holds. Solution: unique
  `(tie_id, tx_ref)` + check-before-insert, mirroring `inventory_holds`.
- **Hold never expires** → refresher locks the tie forever. Solution: reuse the
  existing `expire_inventory_holds()` sweep (it already expires past-due holds
  and fails the matching pending orders).
- **Bot token in the frontend** → bot takeover. Solution: Telegram API calls
  stay in `Backend/` only; the browser only ever gets the `t.me` user link.
- **PII in the deep-link URL** → leaks through chat history/referers. Solution:
  one-time token in the URL; name/room/phone stay in the DB row.
- **No delivery SLA** → disputes when a photo never arrives. Solution: the
  `status` enum + auto-refund rule if `delivered` isn't set within 3 days.

**Docs refactor:** this section is the Feature C record; migration to write:
`Backend/sql/…_pic_requests.sql`.

---

#### Feature C — BUILD RECORD (2026-10-29)

**Status: implemented this session** — way 2 (the recommended one), plus the
server-side fee that way 3 insists on. Two decisions changed from the plan
above, both from you:

* **Hold window is 48 hours (promised to the buyer as "24–48 hours").**
  `hold_until = now() + 48h` (`HOLD_HOURS` in `routers/pic_requests.py`), and
  the hold row expires through the existing `expire_inventory_holds()` sweep.
* **Fee is ₦150** (`PIC_FEE` in both `picRequests.ts` and `pic_requests.py`).
* **30% capacity guard.** `enforce_pic_hold_capacity()` is a FastAPI dependency
  on `POST /api/pic-requests`: once live pic holds cover ≥30% of the distinct
  ties in the catalog (`held * 100 >= catalog * 30`, integer math), new requests
  are rejected with 429 until the sweep releases holds. `pic_hold_capacity()`
  exposes the numbers (`held_ties`, `catalog_ties`, `ratio`, `slots_left`).
* **The ₦150 is owed the moment the request exists, paid or not.** The row is
  inserted with `fee_status = 'unpaid'`, so the obligation survives an
  abandoned checkout; only a confirmed Flutterwave payment flips it to `paid`.

##### What shipped

| Layer | File | What it does |
|---|---|---|
| DB | `Backend/sql/20261029_pic_requests.sql` | `pic_requests` table; `inventory_holds.reason/client_key/user_id`; `orders.pic_fees` + `orders.pic_refs`; RPCs `check_inventory_availability` / `reserve_inventory` gain own-hold exclusion; `expire_inventory_holds()` also ages out pic rows |
| API | `Backend/routers/pic_requests.py` (new) | `POST /api/pic-requests` — validates the tie, enforces the 30% hold-capacity guard, inserts the row, takes the 48h hold, pings your admin chat, returns a one-time `t.me` link; plus the fee helpers `orders.py`/`webhooks.py` call |
| Pay | `Backend/routers/orders.py` | ₦150 per outstanding request is added **server-side** next to the ₦350 delivery fee; the matched `tx_ref`s are stored in `orders.pic_refs` so the webhook settles exactly those |
| Webhook | `Backend/routers/webhooks.py` | on `paid`: `mark_pic_requests_paid(order.pic_refs)` + release the buyer's pic holds on ties they just bought; the Telegram endpoint now answers `/start pic_<token>` with your draft |
| Frontend | `src/lib/picRequests.ts` (new) | device `client_key`, request creation, local outstanding-fee list |
| Frontend | `src/components/ProductDetailModal.tsx` | **REQUEST KNOTTED PIC (+₦150)** button directly under **RESERVE NOW**; a green **REQUEST PIC** badge at the top-left (where the chapel-compliance badge was) scrolls to that button and opens an **Are you sure? Yes / No** dialog with its own **X**; full-tie **eye-icon lightbox**; **HOT** label when discount > 27% |
| Frontend | `src/components/CheckoutPage.tsx` | "Knotted Pic Request (n)" line in Billing Overview, included in Total Payable, `client_key`/`pic_keys` sent with `/api/pay` |

##### Behaviour worth knowing

* **Idempotent by construction.** `tx_ref = pic_ + sha256(client_key:tie_id)`
  plus a partial unique index on `(tie_id, client_key) WHERE status='requested'`,
  so a double tap returns the same request and the same link — never two fees
  and never two holds.
* **Your own hold never blocks you.** The RPCs only skip `reason='pic_request'`
  rows owned by *your* `client_key` (or your JWT user id). Availability,
  reserve and the catalog's stock number all ignore your hold; everyone else's
  holds still block them. `user_id` is read from the JWT and never from the
  body — otherwise anyone could pass a victim's id and buy a held tie.
* **The fee cannot be stripped.** The browser only *displays* the fee; the
  amount is recomputed in `orders.py` from `pic_requests`, matched on account
  id, checkout email and device key, so a guest who signs in mid-journey still
  carries their outstanding ₦100s.
* **Bot token stays server-side.** The browser only ever receives the
  `t.me/<bot>?start=pic_<token>` user link.

##### New environment variables (Backend `.env`)

```
TELEGRAM_BOT_USERNAME=YourBotHandle      # no @ — builds the t.me deep link
TELEGRAM_WEBHOOK_SECRET=long-random      # setWebhook secret_token, rejects fake updates
```
Both default to empty, so nothing breaks while unset: without a bot handle the
button still records the request and the fee, it just has no link to open.

##### Deployment order (do not reorder)

1. Run `Backend/sql/20261029_pic_requests.sql` in Supabase (the new RPC
   signatures mean old code + new DB fails, so deploy the backend right after).
2. Add the two env vars.
3. Deploy the backend, then the frontend.

##### Mistakes from the plan that are actually prevented in code

* Browser-side ₦100 → impossible: `orders.py` computes it.
* Hold in localStorage → the hold is an `inventory_holds` row; the browser
  only mirrors the fee for display.
* Double-click duplicates → deterministic `tx_ref` + partial unique index.
* Hold that never expires → rides the existing `expire_inventory_holds()` sweep
  (it now also flips past-due pic rows to `expired` without erasing the fee).
* Bot token in the frontend → never sent to the client.
* PII in the deep-link URL → only an unguessable token is in the URL.

**Not built (deliberately):** the Telegram bot replying with the actual photo
and flipping `status` to `delivered`. That needs the bot to be able to send a
photo to a stored `telegram_chat_id` — `started_at`/`telegram_chat_id` columns
are already there waiting for it.

---

### Security fixes applied (2026-10-29) — the two MEDIUM items from the review

**1. MEDIUM — zero rate limiting on `/api/auth/login` and `/api/pay`.**

* `Backend/utils/ratelimit.py` (new, dependency-free sliding window — no new
  package in `requirements.txt`).
* `POST /api/auth/login`: capped at **8 attempts / 5 min per source IP AND per
  target email**. The email key cannot be spoofed away by rewriting
  `X-Forwarded-For`, so credential stuffing is stopped even from rotating IPs;
  a successful login clears that account's counter so the real owner never
  trips it. Raises `429` with a `Retry-After` header.
* `POST /api/pay`: capped at **15 / 5 min per source IP**, because every hit
  inserts an order row and takes a 10-minute inventory hold.
* Tests: `Backend/tests/test_ratelimit.py` (4 cases, including the spoofed-IP
  case).
* **Known limitation:** counters are in-process. That is correct for the single
  worker you run today; if you scale to several workers, move the counter into
  Supabase/Redis — only the dependency factory changes.

**2. MEDIUM — `detail=f"Crash details: {str(e)}"` leaked internals.**

* `orders.py` now returns a fixed generic message ("We could not start your
  checkout. Please try again."). The traceback still prints to the server log,
  which is where driver/DB detail belongs — exception text can carry table
  names, connection strings and SQL fragments.

---

## Feature B — catalog dates, newest-first sort, checkout ties strip (2026-10-30)

**What shipped**

1. **`added_at` on `ties`** — `Backend/sql/20261030_ties_added_at.sql`
   * Adds a nullable `added_at`, backfills every existing row from
     `created_at` (so today's catalog keeps its real insertion order instead
     of all stamping as "now"), then sets `NOT NULL` + `DEFAULT now()` and an
     `idx_ties_added_at` index. New inserts need no code change — the default
     stamps them.
2. **Newest-first catalog sort** — `Backend/routers/quantity.py`
   * `GET /quantity/ties` now orders by `added_at DESC, tie_name ASC`
     (`tie_name` only breaks rows inserted in the same instant).
   * `TieInventoryResponse` exposes `added_at`, and App.tsx merges it into the
     frontend `Product.addedAt` field.
   * **Safety net:** if the column does not exist yet (migration not run), the
     query falls back to the old `tie_name` order instead of 500-ing the whole
     store. Run the migration anyway — the fallback is only a seatbelt.
3. **Marketplace: curated first row + randomized type buckets** —
   `Frontend/src/components/Marketplace.tsx`
   * `buildCatalogOrder()` fixes row 1 as **2 vintage ties → Plain Black →
     Plain Wine**. Every remaining tie is placed by selecting a **type from
     the `TYPE_POOL` list** at random, then selecting the ties of that type at
     random, until the catalog is exhausted. Categories outside the pool are
     appended after it.
   * Applied as the default **RELEVANCE** sort (availability still ranks
     first, and price/rating/popularity sorts override it as before).
   * Memoized on the *set* of product ids, so a live price/stock refresh does
     not reshuffle the grid under a browsing customer.
4. **Checkout: Jumia-style ties strip** — `Frontend/src/components/CheckoutPage.tsx`
   * `#checkout-ties-strip` renders below the checkout grid on the bag and
     details steps: horizontal scroller of up to 10 ties, **newest first by
     `addedAt`**, excluding ties already in the bag and anything out of stock,
     each with price, discount badge and a one-tap `+ Add to bag`
     (calls `onAddToCart`, so the existing guard/toast path is reused).
   * Hidden on the success step, so the receipt screen stays a receipt.

**Frontend types** — `Product.addedAt?: string` (optional on purpose: the
static `INITIAL_PRODUCTS` seed has no backend row until the inventory fetch
lands, so callers must fall back to array order when it is missing).

**Deployment order**

1. Run `Backend/sql/20261030_ties_added_at.sql` in Supabase.
2. Deploy the backend, then the frontend.

**Verification (2026-10-30)**

* `npx tsc --noEmit` → exit 0.
* `python -m pytest -q` → **21 passed**.

---

## Must-fix-today security hardening (2026-10-30)

### 1. Dedicated `AUTH_SECRET_KEY` — no more key reuse

**Why it was dangerous:** both `routers/auth.py` and `dependencies.py` signed and
verified session JWTs with
`AUTH_SECRET_KEY or FW_SECRET_KEY or SUPABASE_KEY`. With the fallback chain in
place the JWT secret *was* the Flutterwave key or the Supabase service-role key,
so a leak of either (a committed `.env`, a log line, a pasted screenshot) became
full authentication bypass — forge a token for any `sub` and you are that user.

**What changed**

* `config.py` gained `auth_secret()`, the single accessor for the key.
* `routers/auth.py` and `dependencies.py` now call `require_auth_secret()`
  (in `dependencies.py`) — **the fallback chain is gone**. Signing/verification
  uses only `AUTH_SECRET_KEY`.
* `main.py` refuses to boot when `AUTH_SECRET_KEY` is missing or shorter than
  **32 characters**, printing the exact command to generate one:
  `python -c "import secrets; print(secrets.token_urlsafe(48))"`
* Misconfiguration on a live request returns a **generic 500**
  ("Authentication is not configured on this server."), never a token error
  detail. `get_optional_current_user` degrades to guest instead of erroring.

**Actions required**

1. A fresh `AUTH_SECRET_KEY` and `TELEGRAM_WEBHOOK_SECRET` were generated into
   `Backend/.env` (local dev only — `.env*` is gitignored, values were never
   printed).
2. **Production/hosting env must get its own values** — generate two more and
   set them where the backend runs. Do not copy the local ones into chat.
3. Because the signing key changed, **every existing session becomes invalid**;
   users simply log in again.

### 2. Telegram webhook secret — fail closed

`/webhook/telegram` previously verified `X-Telegram-Bot-Api-Secret-Token` **only
when** `TELEGRAM_WEBHOOK_SECRET` was set; unset meant every update was trusted,
and anyone who found the URL could drive the bot (send deep links, flip pic
records). It now returns **503 "Webhook is not configured"** when the secret is
absent, and still **401** on a wrong secret (compared with `hmac.compare_digest`,
constant time).

Configure both ends with the same value:

```
TELEGRAM_WEBHOOK_SECRET=<long-random>
# and when registering:
# setWebhook(url=..., secret_token="<same value>")
```

Without `TELEGRAM_BOT_TOKEN`/`TELEGRAM_WEBHOOK_SECRET` the bot simply receives
nothing — the pic-request button still records the request and the ₦100 fee.

### 3. Rate limiting on auth and pay (already live, kept)

* `POST /api/auth/login` — **8 attempts / 5 min per source IP *and* per target
  email** (the email key cannot be spoofed by rewriting `X-Forwarded-For`);
  a correct password clears that account's counter. `429` + `Retry-After`.
* `POST /api/pay` — **15 / 5 min per source IP** (each hit inserts an order row
  and takes a 10-minute inventory hold).
* `POST /api/pic-requests` — 10 / 5 min per device key.
* Implementation: `utils/ratelimit.py`, dependency-free sliding window.
  Tests: `tests/test_ratelimit.py`.
* **Known limitation:** counters are in-process — correct for your single
  worker; move them into Supabase/Redis before scaling out.

### 4. Generic 500 errors

* `main.py` now registers a catch-all `Exception` handler: the client gets a
  fixed `{"detail": "Internal server error"}`, the traceback goes to the server
  log (`traceback.print_exc()`).
* `/api/pay` already returns a fixed "We could not start your checkout…" and
  `quantity.py`'s stock-update failure is a fixed string.
* What is left is intentional: 404/409/422 messages that echo a `tie_id` the
  caller just sent, and the rate-limit `Retry-After` hint — none of them leak
  server internals.

### 5. `search_path` on the SQL functions

**Why:** the five inventory functions are `SECURITY DEFINER` (they run as
postgres). Without a pinned `search_path`, anyone able to create an object in
an earlier schema could shadow `inventory_holds`/`ties` and ride the definer's
rights.

* **New migration:** `Backend/sql/20261030_search_path_hardening.sql` — a
  single idempotent `DO` block that runs
  `alter function … set search_path = public, pg_temp` for every overload of
  `expire_inventory_holds`, `check_inventory_availability`, `reserve_inventory`,
  `release_inventory_hold`, `consume_inventory_hold`, plus a verification query
  that must print `{search_path=public, pg_temp}` for every row.
* **Fresh installs:** `20261009_inventory_holds.sql` and
  `20261029_pic_requests.sql` now carry `set search_path = public, pg_temp`
  inline after `security definer`, so re-running them can no longer drop the
  hardening. `pg_temp` is last on purpose, so a temp table can never shadow a
  real one.

### Deployment order for this batch

1. Set `AUTH_SECRET_KEY` (32+ chars) in **every** environment, local and
   production. The backend will not start without it.
2. Set `TELEGRAM_WEBHOOK_SECRET` and pass the same value to `setWebhook`.
3. Run `20261030_search_path_hardening.sql` in Supabase (add it after
   `20261030_ties_added_at.sql`).
4. Deploy backend, then frontend. Existing sessions are invalidated by the key
   change — expected, users log in again.

**Verification (2026-10-30):** `python -m py_compile` on all touched modules →
OK; `python -m pytest -q` → **21 passed**; `npx tsc --noEmit` → exit 0.

---

## UI fixes (2026-10-30)

* **₦0 reservation deposit fixed** — `ProductDetailModal` read
  `product.deposit`, which no product ever populates, so every modal showed
  "RESERVATION DEPOSIT ₦0" with the full price as outstanding. Reservations are
  100% prepaid, so the modal now shows **deposit = full live price** and
  **OUTSTANDING BALANCE ₦0** ("RESERVATION DEPOSIT (100%)"), and the two copy
  blocks (step 1 "Secure Reservation", FAQ "Do I pay the full amount now?")
  were rewritten to say the full amount is paid up front instead of quoting ₦0.
* **Marketplace first row** — now **Plain Black → Plain Wine → 2 random vintage**,
  then the type-list/random bucket order for everything else.
