"""Unit tests for Backend/utils/ratelimit.py.

No network, no database: the limiter is in-process state, so these tests
exercise it through a tiny FastAPI app that calls the same dependency
functions /api/auth/login and /api/pay use.

They lock in the two security fixes:

  * POST /api/auth/login is capped per source IP **and** per target account,
    and a successful login clears the account counter.
  * POST /api/pay is capped per source IP (each hit inserts an order row and
    takes a 10-minute inventory hold).
"""

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from utils import ratelimit


@pytest.fixture(autouse=True)
def clean_limiter_state():
    ratelimit._HITS.clear()
    yield
    ratelimit._HITS.clear()


def _build_app() -> TestClient:
    app = FastAPI()

    @app.post("/login")
    def login(request: Request, email: str = ""):
        ratelimit.login_rate_limit(request, email or None)
        return {"ok": True}

    @app.post("/pay")
    def pay(request: Request):
        ratelimit.pay_rate_limit(request)
        return {"ok": True}

    return TestClient(app)


def test_login_allows_eight_attempts_then_rate_limits():
    client = _build_app()

    for _ in range(8):
        assert client.post("/login", params={"email": "student@example.com"}).status_code == 200

    response = client.post("/login", params={"email": "student@example.com"})
    assert response.status_code == 429
    assert "Retry-After" in response.headers


def test_account_cap_survives_a_spoofed_client_ip():
    """Rewriting X-Forwarded-For must not buy extra guesses at one account."""
    client = _build_app()

    for attempt in range(8):
        response = client.post(
            "/login",
            params={"email": "target@example.com"},
            headers={"X-Forwarded-For": f"203.0.113.{attempt}"},
        )
        assert response.status_code == 200

    response = client.post(
        "/login",
        params={"email": "target@example.com"},
        headers={"X-Forwarded-For": "198.51.100.99"},
    )
    assert response.status_code == 429


def test_correct_password_clears_the_account_counter():
    client = _build_app()

    for _ in range(8):
        client.post("/login", params={"email": "owner@example.com"})

    assert client.post("/login", params={"email": "owner@example.com"}).status_code == 429

    # authenticate_user succeeded server-side, so login called reset().
    ratelimit.reset_login_rate_limit("owner@example.com")

    response = client.post(
        "/login",
        params={"email": "owner@example.com"},
        headers={"X-Forwarded-For": "192.0.2.10"},
    )
    assert response.status_code == 200


def test_pay_endpoint_is_capped():
    client = _build_app()

    for _ in range(15):
        assert client.post("/pay").status_code == 200

    response = client.post("/pay")
    assert response.status_code == 429
    assert int(response.headers["Retry-After"]) >= 1
