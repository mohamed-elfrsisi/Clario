"""
Auth utilities — deliberately stdlib-only (hashlib + secrets), no external
password-hashing library. passlib's bcrypt backend has a known, unresolved
compatibility issue with recent bcrypt releases (passlib is unmaintained),
and this project has already hit enough dependency-conflict pain — see
requirements.txt history. PBKDF2-HMAC-SHA256 with 200k iterations is a
NIST-recommended algorithm and ships in Python's standard library.
"""
import hashlib
import secrets

_PBKDF2_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _PBKDF2_ITERATIONS)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, hex_digest = stored_hash.split("$", 1)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _PBKDF2_ITERATIONS)
    return secrets.compare_digest(digest.hex(), hex_digest)


def generate_token() -> str:
    return secrets.token_urlsafe(32)
