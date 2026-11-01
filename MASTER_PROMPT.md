# Master Prompt — for Perplexity (or any research AI)

Copy everything inside the block below and paste it as a fresh prompt. It is
self-contained: the AI needs no other context about the project or the plan.

---

```text
You are a senior staff engineer acting as a curriculum researcher. Your job is to find
THE best learning resources for me — not a generic list, the actual best ones, ranked
and justified, with every link verified to exist.

## My situation (context you must design for)

I'm a computer science student who built a real production project, Knotify — a
neckwear marketplace for Covenant University students: React 19 + TypeScript 5.8 +
Vite 6 + Tailwind CSS v4 (@tailwindcss/vite) + Motion/Framer Motion on the frontend;
FastAPI + Pydantic + Supabase (Postgres) + Flutterwave payments + pytest on the
backend; deployed on Vercel (frontend) and Render/Cloudflare Workers (backend), with
row-level tables users / ties / orders / user_reviews and a JWT auth flow with both
authenticated users and guest checkout.

I can edit components today but cannot confidently explain or change every layer. I
have exactly 1 hour 30 minutes per day for 13 days, structured as:
- 10 min recall (from memory, no re-reading)
- 30 min LEARN SLOT — this is what you are sourcing resources for
- 40 min hands-on in my actual repo (reading alone does not count)
- 10 min verify + write 3 log bullets

## The 13 day-topics (one resource set per day)

1. How the web works: client-server, HTTP, request/response cycle
2. React fundamentals: components, props, state, thinking in React
3. React hooks in depth: useState, useEffect, useRef, dependency arrays, cleanup
4. TypeScript for React: interfaces, types, generics, reading type errors
5. Vite tooling: import.meta.env, env modes, npm scripts, dev vs build
6. Tailwind CSS v4 + responsive, mobile-first design (NOT v3 syntax)
7. Framer Motion / Motion: motion components, AnimatePresence, enter/exit variants
8. FastAPI fundamentals: routers, path ops, dependency injection, /docs
9. Pydantic v2 request validation and FastAPI 422 error handling
10. Supabase/Postgres: tables, migrations, Row Level Security, service role vs anon key
11. Auth: OAuth2 + JWT, password hashing, protected routes, Bearer tokens
12. Payments: Flutterwave standard checkout, webhooks, signature verification, idempotency
13. Testing + debugging + deploying: pytest, browser DevTools, Vercel + Render deploys

## What "best" means to me (apply strictly)

- Official docs beat tutorials, always. Docs first, then reputable free courses
  (freeCodeCamp, official YouTube channels, respected educators), then paid only if
  genuinely superior.
- EVERYTHING must be current: content updated or verified 2024–2026. React 19, Tailwind
  v4 (reject v3-era setup instructions unless clearly labeled), Vite 6, Pydantic v2,
  current FastAPI. Call out and reject outdated material explicitly.
- The core resource for each day must fit INSIDE my 30-minute learn slot: a read of
  ≤10 pages/minutes, or a video ≤20 min (or a named chapter/segment ≤20 min — tell me
  exactly which segment). Longer material goes in the "optional deep-dive" slot only.
- Free-first. Anything paywalled must be flagged [PAID] with price and a free
  alternative of equal quality.
- High signal, zero fluff: no "history of JavaScript", no listicles, no affiliate
  links, no SEO farm blogs, no unmaintained GitHub repos with stale READMEs.

## Output format (follow exactly)

For EACH of the 13 days, output a markdown table:

| Slot | Type | Resource (title + direct link) | Length | Why this is the best pick (1 sentence) |
|---|---|---|---|---|
| Core (30 min) | docs/video/article | ... | ... | ... |
| Backup | ... | ... | ... | ... — use if Core link is dead/unfit |
| Deep-dive | ... | ... | ... | ... — only after the day's hands-on |

Then, after Day 13:
- **Top 5 overall** — the five resources across the whole plan you'd bet on.
- **Skip these** — 3–5 commonly recommended resources for these topics that are
  outdated or bad NOW, with the reason (name names: e.g. v3 Tailwind courses, class
  React tutorials).
- **Gaps** — any of the 13 topics where no good free resource exists, and the least-bad
  option.
- **Sources** — list every URL you cited.

## Constraints on your answer

- Exactly 3 resources per day (Core + Backup + Deep-dive). Do not give me more; do not
  merge days.
- Every link must be one you have verified resolves to real content at the stated URL —
  no guessed paths, no homepages standing in for the actual page.
- Prefer a video + a written piece per day over two of the same kind.
- Assume I learn by doing: tell me in one line which skill each resource unlocks that I
  will use in the hands-on half of that day.
- Cite sources inline as markdown links for every claim about a resource being current
  or updated.
- Deliver it as one self-contained markdown response I can paste straight into a file.

Before you answer: here is the resource list I already collected — audit it rather than
repeating it. MDN client-server overview; freeCodeCamp HTTP request/response video;
react.dev Quick Start + Thinking in React; React hooks reference + Web Dev Simplified
hooks video; TypeScript Handbook + Total TypeScript "TS for React Developers"; Vite env
& modes docs + Fireship "Vite in 100 seconds"; Tailwind docs; Motion (framer) docs;
FastAPI official tutorial + TestDriven.io FastAPI course; Pydantic docs; Supabase docs +
Fireship "Supabase in 100 seconds"; FastAPI OAuth2 JWT tutorial; Flutterwave API docs;
pytest docs. For each: keep it (if it's genuinely the current best), replace it (with
the better option + why), or upgrade it (same source, better page/chapter). Mark every
one KEEP / REPLACE / UPGRADE.
```
