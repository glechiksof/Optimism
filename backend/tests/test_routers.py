"""Integration tests for auth + user routers using TestClient."""
import uuid

import pytest


# ─── /auth/register ──────────────────────────────────────────────────────── #

def test_register_returns_201_with_token(client):
    res = client.post("/auth/register", json={
        "email": "alice@example.com",
        "password": "secure1234",
        "username": "alice",
    })
    assert res.status_code == 201
    body = res.json()
    assert "access_token" in body
    assert body["user"]["email"] == "alice@example.com"


def test_register_duplicate_email_returns_409(client):
    payload = {"email": "bob@example.com", "password": "secure1234", "username": "bob"}
    client.post("/auth/register", json=payload)
    res = client.post("/auth/register", json=payload)
    assert res.status_code == 409


def test_register_short_password_returns_422(client):
    res = client.post("/auth/register", json={
        "email": "x@example.com",
        "password": "short",
        "username": "x",
    })
    assert res.status_code == 422


def test_register_invalid_email_returns_422(client):
    res = client.post("/auth/register", json={
        "email": "not-an-email",
        "password": "secure1234",
        "username": "x",
    })
    assert res.status_code == 422


def test_register_short_username_returns_422(client):
    res = client.post("/auth/register", json={
        "email": "y@example.com",
        "password": "secure1234",
        "username": "x",  # min_length=2, this is 1 char
    })
    assert res.status_code == 422


# ─── /auth/login ─────────────────────────────────────────────────────────── #

def test_login_valid_returns_token(client):
    client.post("/auth/register", json={
        "email": "carol@example.com",
        "password": "secure1234",
        "username": "carol",
    })
    res = client.post("/auth/login", json={
        "email": "carol@example.com",
        "password": "secure1234",
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password_returns_401(client):
    client.post("/auth/register", json={
        "email": "dave@example.com",
        "password": "correct1234",
        "username": "dave",
    })
    res = client.post("/auth/login", json={
        "email": "dave@example.com",
        "password": "wrongpassword",
    })
    assert res.status_code == 401


def test_login_nonexistent_user_returns_401(client):
    res = client.post("/auth/login", json={
        "email": "nobody@example.com",
        "password": "doesnotmatter",
    })
    assert res.status_code == 401


# ─── /users/me ───────────────────────────────────────────────────────────── #

def test_get_me_returns_current_user(client):
    reg = client.post("/auth/register", json={
        "email": "eve@example.com",
        "password": "secure1234",
        "username": "eve",
    })
    token = reg.json()["access_token"]
    res = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["username"] == "eve"


def test_get_me_without_token_returns_401(client):
    res = client.get("/users/me")
    assert res.status_code == 401


def test_get_me_invalid_token_returns_401(client):
    res = client.get("/users/me", headers={"Authorization": "Bearer garbage"})
    assert res.status_code == 401
