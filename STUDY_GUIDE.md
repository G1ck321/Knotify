# Knotify — The 90-Minute Daily Study Guide

Timeboxed version of the resource list in [DEPLOYMENT_NOTES.md](DEPLOYMENT_NOTES.md)
(**Part 2 — 13-Day Architecture Learning Plan**), wired to the actual files in this repo.

**Goal (after 13 days):** go from "I can edit components" to "I can explain and change
every layer — React state, FastAPI routes, Supabase schema, and the Flutterwave flow."

---

## The rules (these are the point — do not renegotiate them)

Every day is exactly **1:30**, split into four fixed blocks:

| Block | Time | Minutes | What happens |
|---|---|---|---|
| **Recap** | 0:00 – 0:10 | 10 | Rewrite yesterday's 3 bullets from memory, then open today's files. No notes re-reading. |
| **Learn** | 0:10 – 0:40 | 30 | The day's resources, in the listed order. **Hard stop at 0:40**, even mid-video. |
| **In the repo** | 0:40 – 1:20 | 40 | The hands-on step. You must touch real files. |
| **Verify & log** | 1:20 – 1:30 | 10 | Run today's check, write 3 bullets in `STUDY_LOG.md`. |

- **Videos longer than the slot:** watch at 1.5× and stop at the 0:40 cut. Put the
  remainder at tomorrow's Recap — that's what Recap is for.
- **Reading never counts as the hands-on step.** The 40-minute block is code.
- **Hands-on edits don't pollute `main`:** `git switch -c study/day-04` before you change
  anything, and reset the branch afterwards. Day 4's exercise in particular is meant to
  be reverted.
- **If you miss a day:** do not double up the next day (2×90 min breaks the format).
  Repeat the missed day and drop the last day of the plan.
- **Log format** — create `STUDY_LOG.md`, three bullets per day:
  `### Day N` → what clicked / what's still fuzzy / one question to ask.

### Repo orientation (what "the project structure" means here)

```
Frontend/                    React 19 + Vite 6 + TS 5.8 + Tailwind v4 + motion
  src/App.tsx                root: routing state, cart, auth, effects
  src/components/            Marketplace, CheckoutPage, Dashboard, Navbar, modals...
  src/lib/authStorage.ts     authFetch() — attaches the Bearer token
  src/lib/checkoutPayment.ts payment redirect + status polling
  src/types.ts               Product, CartItem, Reservation...
Backend/                     FastAPI + Pydantic + Supabase (Postgres)
  main.py                    app, CORS allowlist, 422 handler, runs on :5500
  routers/                   auth.py · orders.py · quantity.py · webhooks.py
  request_models.py          request bodies (SignupRequest, OrderCreateRequest...)
  dependencies.py            get_current_user / get_optional_current_user
  database.py, sql/          Supabase client + migration scripts
  tests/                     pytest (test_auth, test_orders, test_quantity)
```

**Run it:** backend `cd Backend && python main.py` (port 5500, activates `Backend/.venv`
first) · frontend `cd Frontend && npm run dev` (port 3001) · `.env` points
`VITE_API_BASE_URL` at `http://127.0.0.1:5500`.

---

## Day 1 — Big picture & project orientation

**Files today:** `README.md`, `DEPLOYMENT_NOTES.md`, `Frontend/src/App.tsx`, `Backend/main.py`

- **0:00–0:10 Recap** — Day 1 has no yesterday: write 3 bullets on what Knotify does
  (from the README) before reading anything else.
- **0:10–0:40 Learn**
  1. [MDN: Client-server overview](https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Client-server_overview) (~12 min read)
  2. [HTTP & the request/response cycle](https://www.youtube.com/watch?v=QqeWg2JmBqY) — freeCodeCamp, 1.5×, stop at 0:40
- **0:40–1:20 In the repo** — draw the request/response flow on paper, naming each real
  file for one action: *user adds a tie to bag*. Start at `App.tsx` (`setCartItems`),
  through `fetch` (`lib/checkoutPayment.ts`), into `Backend/main.py` → `routers/` →
  `database.py` → Supabase → back. Then do the same for *user logs in*
  (`lib/authStorage.ts` → `routers/auth.py`).
- **1:20–1:30 Verify** — start both servers (commands above), add a tie in the UI, open
  DevTools → Network, and confirm you can name which file initiated each request you see.
- **Done when:** you can draw the flow without looking, and the two servers serve the app.

---

## Day 2 — React fundamentals (components, props, state)

**Files today:** `src/App.tsx` (lines 76–145 hold nearly all state), `src/components/Marketplace.tsx`, `src/components/Navbar.tsx`, `src/components/ProductDetailModal.tsx`

- **0:00–0:10 Recap** — redraw yesterday's flow from memory.
- **0:10–0:40 Learn**
  1. [React docs: Quick Start](https://react.dev/learn)
  2. [Thinking in React](https://react.dev/thinking-in-react) — stop at 0:40 if unfinished
  3. Book (stretch): *Roadmap to React* (Safdar Jamal) or Brian Holt's free *Beginner's Guide to React*
- **0:40–1:20 In the repo** — build a prop map. For `currentTab`, `products`,
  `cartItems`, `wishlist`: which state in `App.tsx`, which handler mutates it, which
  child receives it as a prop, which prop passes it further down. Cover `Marketplace`
  → `ProductDetailModal` and `Navbar` → page switch.
- **1:20–1:30 Verify** — pick any three components and say out loud: *inputs (props),
  outputs (callbacks), state (local vs lifted)*. Log it.
- **Done when:** the prop map has zero "?" boxes.

---

## Day 3 — React hooks in depth

**Files today:** `src/App.tsx` (11 `useEffect`), `src/components/CheckoutPage.tsx` (5 `useEffect`)

- **0:00–0:10 Recap** — prop map, from memory.
- **0:10–0:40 Learn**
  1. [React: Built-in Hooks reference](https://react.dev/reference/react/hooks)
  2. [React Hooks Explained](https://www.youtube.com/watch?v=TNhaISOUy6Q) — Web Dev Simplified, 1.5×
- **0:40–1:20 In the repo** — audit every `useEffect`: dependency array, what it
  subscribes to, what it cleans up. Start with the two meme timers
  (`memeTimerRef` / `blueFloralMemeTimer` in `App.tsx`) and the payment-return poll in
  `CheckoutPage.tsx` (`handlePaymentReturn`'s 6-attempt retry loop).
- **1:20–1:30 Verify** — write the dependency array you *think* each effect should have
  and compare with the code; note any mismatch as a fuzzy point in the log.
- **Done when:** every effect has a one-line purpose you wrote yourself.

---

## Day 4 — TypeScript for React

**Files today:** `src/types.ts`, then any file the compiler points at

- **0:00–0:10 Recap** — the effect audit's two best bullets.
- **0:10–0:40 Learn**
  1. [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
  2. [TypeScript for React Developers](https://www.totaltypescript.com/tutorials/typescript-for-react-developers)
- **0:40–1:20 In the repo** — `git switch -c study/day-04`, then add a **required** field
  (e.g. `brand: string`) to the `Product` interface in `types.ts`. Run `npm run lint`
  and chase every error it reports — read them as a to-do list, fix them one by one.
- **1:20–1:30 Verify** — `npm run lint` must end exit 0 *with* your change (or revert
  with `git switch main` once you understand each error). Log the three most
  instructive error messages.
- **Done when:** you can explain "Argument of type X is not assignable..." without panic.

---

## Day 5 — Vite, tooling, environment config

**Files today:** `Frontend/vite.config.ts`, `Frontend/.env`, `src/lib/checkoutPayment.ts` (`getBackendUrl`), `Frontend/package.json`, `Frontend/wrangler.jsonc`

- **0:00–0:10 Recap** — one TypeScript error you fixed, explained.
- **0:10–0:40 Learn**
  1. [Vite: Env vars & modes](https://vitejs.dev/guide/env-and-mode.html) — `import.meta.env`, `.env`
  2. [Vite in 100 seconds](https://www.youtube.com/watch?v=KcrhLmTOtqA) — Fireship
  3. Read the `scripts` in `package.json`: `dev`, `build`, `lint` (= `tsc --noEmit`)
- **0:40–1:20 In the repo** — change `VITE_API_BASE_URL` in `Frontend/.env` to a dead
  port (`http://127.0.0.1:9999`), restart `npm run dev`, and watch `getBackendUrl()`
  produce requests that fail. Read the error in DevTools. Restore `.env`.
- **1:20–1:30 Verify** — app loads data again; also run `npm run build` once and note
  where `dist/` comes from. Log what `.env` vs `.env.example` are for.
- **Done when:** you know exactly which value each request's base URL came from.

---

## Day 6 — Tailwind CSS v4 + responsive design

**Files today:** `src/index.css` (the `@import "tailwindcss"` + `@theme` block), `src/components/Navbar.tsx`, `src/components/Marketplace.tsx`

- **0:00–0:10 Recap** — env/config bullets.
- **0:10–0:40 Learn**
  1. [Tailwind docs](https://tailwindcss.com/docs) — v4 setup (`@tailwindcss/vite`), `@theme`
  2. Mobile-first breakpoints: `sm:`, `md:`, `lg:` — read whichever doc page covers variants
- **0:40–1:20 In the repo** — resize the browser from 320px to desktop and find the
  switch points: the mobile bottom navbar vs the desktop header in `Navbar.tsx`
  (the `sm:hidden` / `sm:flex` pairs), and the product grid in `Marketplace.tsx`.
  Then add one utility class of your own (e.g. `md:text-lg` on a heading) and see it.
- **1:20–1:30 Verify** — `npm run lint`, and explain *why* the code uses `sm:` prefixes
  instead of a desktop-first width. Log the breakpoint you added.
- **Done when:** you can say which classes apply at 375px vs 1280px on any element you picked.

---

## Day 7 — Framer Motion (animations & AnimatePresence)

**Files today:** `src/App.tsx` (page transitions, meme overlay), `src/components/ProductDetailModal.tsx`, `src/components/AuthModal.tsx`

- **0:00–0:10 Recap** — responsive notes.
- **0:10–0:40 Learn**
  1. [Motion docs](https://www.framer.com/motion/) — `motion`, `AnimatePresence`, enter/exit variants
  2. One example section of your choice from the docs' examples gallery
- **0:40–1:20 In the repo** — find every `AnimatePresence` and its exit animation (modal
  close is the clearest). Change the meme overlay's enter animation and a page
  transition `duration`, watch it hot-reload, tune it twice.
- **1:20–1:30 Verify** — reload and confirm enter *and* exit both animate; revert or
  keep your tuning deliberately (branch `study/day-07`). Log how exit animations depend
  on `AnimatePresence`.
- **Done when:** you can point to the component that controls one exit animation.

---

## Day 8 — FastAPI fundamentals (routers, DI, app wiring)

**Files today:** `Backend/main.py`, `Backend/routers/quantity.py`

- **0:00–0:10 Recap** — motion bullets.
- **0:10–0:40 Learn**
  1. [FastAPI tutorial](https://fastapi.tiangolo.com/tutorial/) — Path Ops + Request Body
  2. [TestDriven.io FastAPI course](https://testdriven.io/courses/fastapi/) (free chapters) or *FastAPI, From Zero to Hero*
- **0:40–1:20 In the repo** — add `GET /quantity/demo` to `routers/quantity.py`
  returning a static tie list; confirm `main.py` already mounts that router (no new
  wiring needed — understand *why*). Call `http://127.0.0.1:5500/quantity/demo` in the
  browser and hit `/docs` to see it appear in Swagger.
- **1:20–1:30 Verify** — JSON renders in the browser; delete the endpoint or keep it on
  your study branch. Log how a router gets its `prefix` and where routes compose.
- **Done when:** you can add an endpoint without reading a tutorial.

---

## Day 9 — Pydantic & request validation

**Files today:** `Backend/request_models.py`, `Backend/schemas.py`, `Backend/main.py` (422 handler)

- **0:00–0:10 Recap** — how routers mount, in 3 bullets.
- **0:10–0:40 Learn**
  1. [Pydantic docs](https://docs.pydantic.dev/latest/) — models, validation errors
  2. Re-read `request_models.py` as documentation: `UserCreateRequest`, `SignupRequest`
     (line 131, extends `UserCreateRequest`), `OrderCreateRequest`, `CheckoutRequest`
- **0:40–1:20 In the repo** — add a required field to `SignupRequest`, restart the
  backend, and `POST /api/auth/signup` **without** it (curl or the `/docs` form). Read
  the custom `RequestValidationError` handler in `main.py` and see how it formats the
  422 body. Revert the field.
- **1:20–1:30 Verify** — you get a 422 whose `detail` names your field; revert and
  confirm signup works again. Log the difference between `schemas.py` (response-ish)
  and `request_models.py` (request bodies) as this repo uses them.
- **Done when:** you can predict the 422 body before sending the request.

---

## Day 10 — Databases with Supabase (Postgres, tables, migrations)

**Files today:** `Backend/database.py`, `Backend/sql/*.sql`, tables `users`, `ties`, `orders`, `user_reviews`

- **0:00–0:10 Recap** — validation bullets.
- **0:10–0:40 Learn**
  1. [Supabase docs](https://supabase.com/docs) — Table Editor, SQL, Row Level Security
  2. [Supabase in 100 seconds](https://www.youtube.com/watch?v=N7v5Suvq4mA) — Fireship
- **0:40–1:20 In the repo** — read `sql/20260803_ties_inventory.sql` and
  `sql/20261009_inventory_holds.sql` (these create/extend what you query), then open
  your Supabase Table Editor, pick one `ties` row, and match every column to the JSON
  `GET /quantity/ties` returns. Note `database.py`'s client setup (service role vs anon key).
- **1:20–1:30 Verify** — you can name the table + column behind three UI values
  (price, stock, image). Log how a migration file maps to a live table.
- **Done when:** row ↔ API JSON mapping is obvious.

---

## Day 11 — Auth: JWT, password hashing, protected routes

**Files today:** `Backend/routers/auth.py`, `Backend/services/auth_service.py`, `Backend/utils/tokens.py`, `Backend/utils/security.py`, `Backend/dependencies.py`, `Frontend/src/lib/authStorage.ts`

- **0:00–0:10 Recap** — table/column mapping bullets.
- **0:10–0:40 Learn**
  1. [FastAPI OAuth2 with JWT](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
  2. Then read `dependencies.py` side by side: `get_current_user` (hard requirement)
     vs `get_optional_current_user` (guest checkout) — and *why* both exist
- **0:40–1:20 In the repo** — sign up and log in in the UI, find the
  `knotify_access_token` in DevTools → Application → localStorage, decode it at
  jwt.io, then `curl -H "Authorization: Bearer <token>" http://127.0.0.1:5500/api/me`.
  Follow how `authFetch()` (line 73) attaches that header on the frontend side.
- **1:20–1:30 Verify** — run `python -m pytest tests/ -q` in `Backend/` (auth tests) and
  log the difference between an authenticated and a guest request.
- **Done when:** you can explain what a 401 vs a guest session means in this app.

---

## Day 12 — Payments with Flutterwave (init, redirect, webhook)

**Files today:** `Backend/routers/orders.py`, `Backend/routers/webhooks.py`, `src/lib/checkoutPayment.ts`, `Backend/tests/test_orders.py`

- **0:00–0:10 Recap** — auth bullets (401 vs guest).
- **0:10–0:40 Learn**
  1. [Flutterwave docs](https://developer.flutterwave.com/docs) — Standard checkout,
     webhooks, signature verification (`verif-hash`)
  2. The two-truths rule: **the server computes the total** (`compute_order_total` +
     `disount_logic` in `routers/quantity.py`), never the client
- **0:40–1:20 In the repo** — trace one order end-to-end in code:
  cart → `POST /api/pay` (build `db_payload`, `tx_ref` from `utils/tokens.py`) →
  Flutterwave URL → redirect back with `tx_ref` → `fetchOrderStatus()` in
  `checkoutPayment.ts` polling `GET /api/status/{tx_ref}` → webhook marks it paid.
  While you're here: notice the status endpoint now returns a **whitelisted** response
  model — no PII — and why (guest flow has no token; capability = the unguessable
  `tx_ref`).
- **1:20–1:30 Verify** — `python -m pytest tests/ -q` in `Backend/` (all 10 green), then
  on Flutterwave **test mode** walk one real order in the UI and watch the Network tab.
- **Done when:** you can name, for each state of an order, which file set it.

---

## Day 13 — Testing, debugging, deploying the whole stack

**Files today:** `Backend/tests/`, `Frontend/package.json`, `Backend/main.py` (CORS), `DEPLOYMENT_NOTES.md`

- **0:00–0:10 Recap** — payment bullets.
- **0:10–0:40 Learn**
  1. [pytest](https://docs.pytest.org/) — fixtures, `monkeypatch` (see how
     `tests/test_quantity.py` patches Supabase so no DB is touched)
  2. Debugging: DevTools Network tab + backend logs — reproduce a 422 and a 401 on purpose
- **0:40–1:20 In the repo** — run the full gate and watch every exit code:
  - `Backend/`: `python -m pytest tests/ -q`
  - `Frontend/`: `npm run lint` then `npm run build`
  - Read the CORS `allow_origins` list in `main.py` and explain each origin
    (`localhost:3001`, `knotifycu.vercel.app`, `knotifycu.knotifycu.workers.dev`)
- **1:20–1:30 Verify** — everything green, then read **Part 1** of
  [DEPLOYMENT_NOTES.md](DEPLOYMENT_NOTES.md) and map each deploy step to a file in the
  repo. Write your final log entry: the 13-day summary in 10 bullets.
- **Done when:** the whole gate passes and you can explain what ships where.

---

## Books (use as Day-slot backups, not extra daily time)

- *The Road to React* — Robin Wieruch (Days 2–3)
- *FastAPI, From Zero to Hero* — Sebastián Ramírez (Days 8–9)
- *Clean Architecture* — Robert C. Martin (Day 13, chapters on boundaries only)
- *Learning SQL* + Supabase docs (Day 10)

---

## Progress tracker

| Day | Topic | Date done | 3-bullet log written? |
|---|---|---|---|
| 1 | Big picture & orientation | | |
| 2 | React fundamentals | | |
| 3 | Hooks in depth | | |
| 4 | TypeScript | | |
| 5 | Vite & env config | | |
| 6 | Tailwind v4 & responsive | | |
| 7 | Framer Motion | | |
| 8 | FastAPI fundamentals | | |
| 9 | Pydantic & validation | | |
| 10 | Supabase & SQL | | |
| 11 | Auth & JWT | | |
| 12 | Flutterwave payments | | |
| 13 | Testing & deploying | | |
