import uuid
from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException

from exceptions import AppError
from models.tournament import Tournament
from models.user import User
from schemas.tournament import TournamentCreate, TournamentUpdate
from services.tournaments import (
    create_tournament,
    delete_tournament,
    get_hosted_tournaments,
    list_tournaments,
    update_tournament,
)


def _user(db):
    u = User(email=f"u{uuid.uuid4().hex[:6]}@t.com", password_hash="x", username="u")
    db.add(u)
    db.flush()
    return u


def _create_data(**kwargs):
    defaults = dict(
        name="Test Tournament",
        sport_type="chess",
        bracket_type="single_elim",
        max_participants=8,
        start_date=datetime.utcnow() + timedelta(days=1),
        end_date=datetime.utcnow() + timedelta(days=2),
    )
    defaults.update(kwargs)
    return TournamentCreate(**defaults)


# ─── create ──────────────────────────────────────────────────────────────── #

def test_create_tournament_persists(db):
    organizer = _user(db)
    data = _create_data()
    t = create_tournament(data, organizer.id, db)
    assert t.id is not None
    assert t.name == "Test Tournament"
    assert t.status == "draft"
    assert t.organizer_id == organizer.id


def test_create_tournament_default_status_is_draft(db):
    organizer = _user(db)
    t = create_tournament(_create_data(), organizer.id, db)
    assert t.status == "draft"


# ─── update ──────────────────────────────────────────────────────────────── #

def test_update_tournament_name(db):
    organizer = _user(db)
    t = create_tournament(_create_data(), organizer.id, db)
    updated = update_tournament(t.id, TournamentUpdate(name="New Name"), organizer.id, db)
    assert updated.name == "New Name"


def test_update_tournament_wrong_organizer_raises_403(db):
    organizer = _user(db)
    other = _user(db)
    t = create_tournament(_create_data(), organizer.id, db)
    with pytest.raises(HTTPException) as exc:
        update_tournament(t.id, TournamentUpdate(name="Hack"), other.id, db)
    assert exc.value.status_code == 403


def test_update_locked_field_after_start_raises_422(db):
    organizer = _user(db)
    t = create_tournament(_create_data(), organizer.id, db)
    t.status = "started"
    db.commit()
    with pytest.raises(HTTPException) as exc:
        update_tournament(t.id, TournamentUpdate(bracket_type="round_robin"), organizer.id, db)
    assert exc.value.status_code == 422


def test_update_description_after_start_is_allowed(db):
    organizer = _user(db)
    t = create_tournament(_create_data(), organizer.id, db)
    t.status = "started"
    db.commit()
    updated = update_tournament(t.id, TournamentUpdate(description="new desc"), organizer.id, db)
    assert updated.description == "new desc"


# ─── delete ──────────────────────────────────────────────────────────────── #

def test_delete_tournament_removes_it(db):
    organizer = _user(db)
    t = create_tournament(_create_data(), organizer.id, db)
    delete_tournament(t.id, organizer.id, db)
    assert db.query(Tournament).filter(Tournament.id == t.id).first() is None


def test_delete_tournament_wrong_organizer_raises_403(db):
    organizer = _user(db)
    other = _user(db)
    t = create_tournament(_create_data(), organizer.id, db)
    with pytest.raises(HTTPException) as exc:
        delete_tournament(t.id, other.id, db)
    assert exc.value.status_code == 403


def test_delete_started_tournament_raises_422(db):
    organizer = _user(db)
    t = create_tournament(_create_data(), organizer.id, db)
    t.status = "started"
    db.commit()
    with pytest.raises(HTTPException) as exc:
        delete_tournament(t.id, organizer.id, db)
    assert exc.value.status_code == 422


# ─── list ────────────────────────────────────────────────────────────────── #

def test_list_excludes_drafts(db):
    organizer = _user(db)
    t = create_tournament(_create_data(), organizer.id, db)
    t.status = "draft"
    db.commit()
    items, total = list_tournaments(db)
    assert all(x.id != t.id for x in items)
    assert total == 0


def test_list_includes_open_tournaments(db):
    organizer = _user(db)
    t = create_tournament(_create_data(), organizer.id, db)
    t.status = "open"
    db.commit()
    items, total = list_tournaments(db)
    assert any(x.id == t.id for x in items)
    assert total == 1


def test_list_search_filters_by_name(db):
    organizer = _user(db)
    t1 = create_tournament(_create_data(name="Chess Masters"), organizer.id, db)
    t2 = create_tournament(_create_data(name="Football Cup"), organizer.id, db)
    t1.status = "open"
    t2.status = "open"
    db.commit()
    items, total = list_tournaments(db, search="chess")
    assert total == 1
    assert items[0].name == "Chess Masters"


def test_get_hosted_tournaments(db):
    organizer = _user(db)
    other = _user(db)
    create_tournament(_create_data(name="Mine"), organizer.id, db)
    create_tournament(_create_data(name="Theirs"), other.id, db)
    hosted = get_hosted_tournaments(organizer.id, db)
    assert len(hosted) == 1
    assert hosted[0].name == "Mine"
