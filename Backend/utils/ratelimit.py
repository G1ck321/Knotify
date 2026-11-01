"""Minimal in-process sliding-window rate limiter.

Why not a library: requirements.txt stays dependency-free and this backend
runs as a single process (gunicorn/uvicorn worker on Render), so process-local
state is enough to blunt the two abusable endpoints we have today:

  * POST /api/auth/login - credential stuffing / password brute force
  * POST /api/pay        - one INSERT + one 10-minute inventory hold per hit

Limits are deliberately generous for a campus checkout (a real student never
hits them) while still capping how much damage one source can do per minute.

If this backend is ever scaled to several workers, move the counter into
Supabase/Redis; the dependency factory below is the only call site to change.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from typing import Iterable

from fastapi import HTTPException, Request, status


_LOCK = threading.Lock()
_HITS: dict[str, deque[float]] = defaultdict(deque)


def caller_key(request: Request, forwarded_header: str = "X-Forwarded-For") -> str:
    """Best-effort caller identity.

    Behind Render/nginx the socket peer is the proxy, so prefer the first
    X-Forwarded-For entry. A client can spoof that header, but login is ALSO
    limited per target email, so spoofing does not unlock unlimited guesses
    against one account.
    """
    forwarded = request.headers.get(forwarded_header) or ""
    if forwarded:
        return forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")
    return request.client.host if request.client and request.client.host else "unknown"


def hit(key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    """Record one attempt. Returns (allowed, retry_after_seconds)."""
    now = time.monotonic()
    with _LOCK:
        bucket = _HITS[key]
        while bucket and now - bucket[0] >= window_seconds:
            bucket.popleft()

        if len(bucket) >= limit:
            retry_after = int(window_seconds - (now - bucket[0])) + 1
            return False, max(retry_after, 1)

        bucket.append(now)
        return True, 0


def reset(key: str) -> None:
    """Forget one key (used after a successful login so good users never feel it)."""
    with _LOCK:
        _HITS.pop(key, None)


def rate_limit(
    *,
    keys: Iterable[str],
    limit: int,
    window_seconds: int,
) -> None:
    """Raise 429 if any of the derived keys is over its window."""
    for key in keys:
        allowed, retry_after = hit(key, limit, window_seconds)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests. Try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )


def login_rate_limit(request: Request, email: str | None = None) -> None:
    """Cap login attempts per source IP and per target account."""
    ip = caller_key(request)
    keys = [f"login:ip:{ip}"]
    if email:
        keys.append(f"login:email:{email.strip().lower()}")
    rate_limit(keys=keys, limit=8, window_seconds=300)


def reset_login_rate_limit(email: str | None) -> None:
    """Clear the per-account counter once the password was correct."""
    if email:
        reset(f"login:email:{email.strip().lower()}")


def pay_rate_limit(request: Request) -> None:
    """Cap payment-session creation: each hit inserts an order + a hold."""
    rate_limit(keys=[f"pay:ip:{caller_key(request)}"], limit=15, window_seconds=300)
