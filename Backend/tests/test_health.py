"""Tests for GET /health (Backend/health.py).

No network and no database: DNS is faked through socket.getaddrinfo and the
Supabase client is a stub, so both failure modes are exercised deterministically.
"""

import socket

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import health


class _Settings:
    def __init__(self, url):
        self.SUPABASE_URL = url


class _Result:
    def __init__(self, data):
        self.data = data


class _Query:
    def __init__(self, error):
        self._error = error

    def select(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def execute(self):
        if self._error:
            raise self._error
        return _Result([{"tie_id": "tie-a"}])


class _Client:
    """Stub Supabase client: raises `error` from execute() when given one."""

    def __init__(self, error=None):
        self._error = error

    def table(self, _name):
        return _Query(self._error)


def _ok_dns(*args, **kwargs):
    # getaddrinfo only has to not raise.
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 443))]


def test_health_reports_dns_and_database_as_ok(monkeypatch):
    monkeypatch.setattr(health.socket, "getaddrinfo", _ok_dns)

    report = health.build_health_report(_Settings("https://abc.supabase.co"), _Client())

    assert report["supabase_url_configured"] is True
    assert report["supabase_host"] == "abc.supabase.co"
    assert report["supabase_dns"] is True
    assert report["database"] is True
    assert "dns_error" not in report
    assert "db_error" not in report


def test_health_reports_a_dns_failure_without_hiding_the_database(monkeypatch):
    def fail(*args, **kwargs):
        # The Windows shape of a resolution failure.
        raise socket.gaierror(11001, "getaddrinfo failed")

    monkeypatch.setattr(health.socket, "getaddrinfo", fail)

    report = health.build_health_report(_Settings("https://abc.supabase.co"), _Client())

    assert report["supabase_url_configured"] is True
    assert report["supabase_dns"] is False
    assert "11001" in report["dns_error"]
    # The DB probe still runs: a cached/queued connection can succeed even when
    # a fresh lookup fails, and the two answers are reported separately.
    assert report["database"] is True


def test_health_reports_a_database_failure(monkeypatch):
    monkeypatch.setattr(health.socket, "getaddrinfo", _ok_dns)

    report = health.build_health_report(
        _Settings("https://abc.supabase.co"), _Client(error=RuntimeError("secret dsn"))
    )

    assert report["supabase_dns"] is True
    assert report["database"] is False
    assert report["db_error"] == "RuntimeError"
    # Only the class name is exposed; never the driver message.
    assert "secret dsn" not in str(report)


def test_health_reports_dns_and_database_failing_together(monkeypatch):
    def fail(*args, **kwargs):
        raise socket.gaierror(11001, "getaddrinfo failed")

    monkeypatch.setattr(health.socket, "getaddrinfo", fail)

    report = health.build_health_report(
        _Settings("https://abc.supabase.co"), _Client(error=OSError("unreachable"))
    )

    assert report["supabase_dns"] is False
    assert report["database"] is False
    assert report["db_error"] == "OSError"


def test_an_unconfigured_url_skips_the_dns_lookup(monkeypatch):
    def explode(*args, **kwargs):  # pragma: no cover - must never run
        raise AssertionError("DNS must not be attempted without a host")

    monkeypatch.setattr(health.socket, "getaddrinfo", explode)

    report = health.build_health_report(_Settings(""), _Client())

    assert report["supabase_url_configured"] is False
    assert report["supabase_host"] == ""
    assert report["supabase_dns"] is None  # not "false": it was never attempted
    assert report["database"] is True


def test_get_health_route_returns_the_report(monkeypatch):
    """The route itself, wired through the real app."""
    try:
        import config
        import database
        import main
    except Exception as error:  # AUTH_SECRET_KEY missing outside the dev .env
        pytest.skip(f"the app cannot be imported in this environment: {error}")

    monkeypatch.setattr(health.socket, "getaddrinfo", _ok_dns)
    monkeypatch.setattr(config, "settings", _Settings("https://abc.supabase.co"))
    monkeypatch.setattr(database, "supabase", _Client())

    response = TestClient(main.app).get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "supabase_url_configured": True,
        "supabase_host": "abc.supabase.co",
        "supabase_dns": True,
        "database": True,
    }
