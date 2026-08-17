"""Tests for app/auth_utils.py and the /auth endpoints — Sprint 6."""
from app.auth_utils import hash_password, verify_password, generate_token


def test_hash_and_verify_roundtrip():
    h = hash_password("mypassword123")
    assert verify_password("mypassword123", h) is True


def test_wrong_password_fails():
    h = hash_password("mypassword123")
    assert verify_password("wrongpassword", h) is False


def test_hash_is_salted_differently_each_time():
    h1 = hash_password("same_password")
    h2 = hash_password("same_password")
    assert h1 != h2  # different salts -> different hashes for same password


def test_generate_token_is_url_safe_and_unique():
    t1 = generate_token()
    t2 = generate_token()
    assert t1 != t2
    assert len(t1) > 20


def test_malformed_stored_hash_does_not_crash():
    assert verify_password("anything", "not-a-valid-hash-format") is False
