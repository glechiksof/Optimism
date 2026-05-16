import pytest
from config import Settings


def _make_settings(**kwargs):
    base = {
        "DATABASE_URL": "sqlite:///:memory:",
        "JWT_SECRET": "test-secret-key-minimum-32-characters-long",
        "ENVIRONMENT": "development",
    }
    base.update(kwargs)
    return Settings(**base)


def test_cors_origins_json_array():
    s = _make_settings(CORS_ORIGINS='["https://foo.com", "https://bar.com"]')
    assert s.cors_origins_list == ["https://foo.com", "https://bar.com"]


def test_cors_origins_comma_separated():
    s = _make_settings(CORS_ORIGINS="https://foo.com,https://bar.com")
    assert s.cors_origins_list == ["https://foo.com", "https://bar.com"]


def test_cors_origins_comma_separated_with_spaces():
    s = _make_settings(CORS_ORIGINS=" https://foo.com , https://bar.com ")
    assert s.cors_origins_list == ["https://foo.com", "https://bar.com"]


def test_cors_origins_single_value():
    s = _make_settings(CORS_ORIGINS="https://foo.com")
    assert s.cors_origins_list == ["https://foo.com"]


def test_cors_origins_empty_string_returns_default():
    s = _make_settings(CORS_ORIGINS="")
    assert s.cors_origins_list == ["http://localhost:5173"]


def test_jwt_secret_too_short_raises():
    with pytest.raises(Exception):
        _make_settings(JWT_SECRET="short")


def test_jwt_secret_placeholder_in_production_raises():
    with pytest.raises(Exception):
        _make_settings(
            JWT_SECRET="change-me-in-production-minimum-32-chars",
            ENVIRONMENT="production",
        )


def test_jwt_secret_placeholder_in_development_ok():
    s = _make_settings(
        JWT_SECRET="change-me-in-production-minimum-32-chars",
        ENVIRONMENT="development",
    )
    assert s.ENVIRONMENT == "development"
