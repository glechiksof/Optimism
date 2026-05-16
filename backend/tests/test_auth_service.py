import time
import uuid
import pytest
from datetime import datetime, timedelta
from jose import jwt

from services.auth import hash_password, verify_password, create_access_token, decode_token
from config import settings


def test_hash_password_produces_valid_bcrypt_hash():
    h = hash_password("secret123")
    assert h.startswith("$2b$") or h.startswith("$2a$")
    assert h != "secret123"


def test_hash_password_different_salts():
    h1 = hash_password("secret")
    h2 = hash_password("secret")
    assert h1 != h2


def test_verify_password_correct():
    h = hash_password("mypassword")
    assert verify_password("mypassword", h) is True


def test_verify_password_wrong():
    h = hash_password("mypassword")
    assert verify_password("wrongpassword", h) is False


def test_create_access_token_is_valid_jwt():
    user_id = uuid.uuid4()
    token = create_access_token(user_id)
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    assert payload["sub"] == str(user_id)


def test_create_access_token_expiry_in_future():
    user_id = uuid.uuid4()
    token = create_access_token(user_id)
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    assert payload["exp"] > time.time()


def test_decode_token_returns_correct_uuid():
    user_id = uuid.uuid4()
    token = create_access_token(user_id)
    assert decode_token(token) == user_id


def test_decode_token_garbage_raises():
    with pytest.raises(ValueError, match="Invalid or expired"):
        decode_token("not.a.token")


def test_decode_token_wrong_secret_raises():
    user_id = uuid.uuid4()
    bad_token = jwt.encode(
        {"sub": str(user_id), "exp": datetime.utcnow() + timedelta(days=1)},
        "wrong-secret-that-is-definitely-not-right",
        algorithm="HS256",
    )
    with pytest.raises(ValueError):
        decode_token(bad_token)


def test_decode_token_expired_raises():
    user_id = uuid.uuid4()
    expired_token = jwt.encode(
        {"sub": str(user_id), "exp": datetime.utcnow() - timedelta(seconds=1)},
        settings.JWT_SECRET,
        algorithm="HS256",
    )
    with pytest.raises(ValueError):
        decode_token(expired_token)


def test_decode_token_no_sub_raises():
    bad_token = jwt.encode(
        {"exp": datetime.utcnow() + timedelta(days=1)},
        settings.JWT_SECRET,
        algorithm="HS256",
    )
    with pytest.raises(ValueError):
        decode_token(bad_token)
