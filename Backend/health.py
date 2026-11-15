"""Readiness report behind ``GET /health``.

The single most common reason the storefront shows no live ties is that the API
cannot resolve or reach Supabase, or that its env vars are unset. This reports
the failure CLASS - never a key, a connection string or a driver message - so it
is safe to leave public and check from a browser.

Kept in its own module (rather than inside main.py) so it can be unit tested
without booting the whole app, which refuses to start without AUTH_SECRET_KEY.
"""

from __future__ import annotations

import socket
from typing import Any
from urllib.parse import urlparse

# The host is checked on the HTTPS port; Supabase has no plain-HTTP endpoint.
_HTTPS_PORT = 443


def build_health_report(settings_obj: Any = None, client: Any = None) -> dict[str, Any]:
    """Return ``{supabase_url_configured, supabase_host, supabase_dns, database}``.

    ``settings_obj`` and ``client`` exist for tests; in production both are
    imported lazily so importing this module never opens a connection.
    """
    if settings_obj is None:
        from config import settings as settings_obj  # noqa: PLC0415

    if client is None:
        from database import supabase as client  # noqa: PLC0415

    raw_url = (getattr(settings_obj, "SUPABASE_URL", "") or "").strip()
    host = urlparse(raw_url).hostname or ""

    report: dict[str, Any] = {
        "supabase_url_configured": bool(raw_url),
        "supabase_host": host,
        "supabase_dns": None,
        "database": None,
    }

    if host:
        try:
            socket.getaddrinfo(host, _HTTPS_PORT)
            report["supabase_dns"] = True
        except OSError as error:
            # errno 11001 on Windows, EAI_AGAIN elsewhere: nothing will work
            # until DNS does, so name it instead of surfacing a generic 500.
            report["supabase_dns"] = False
            report["dns_error"] = str(error)

    try:
        client.table("ties").select("tie_id").limit(1).execute()
        report["database"] = True
    except Exception as error:  # pragma: no cover - depends on the environment
        report["database"] = False
        # Class name only: the message can carry table names and connection details.
        report["db_error"] = type(error).__name__

    return report
