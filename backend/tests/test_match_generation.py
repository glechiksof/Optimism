import math
import random
import uuid
from datetime import datetime, timedelta

import pytest

from exceptions import AppError
from models.membership import TournamentParticipant
from models.tournament import Tournament
from models.user import User
from services.matches import (
    generate_round_robin,
    generate_single_elimination,
    get_standings,
    submit_result,
)


# ─── Helpers ──────────────────────────────────────────────────────────────── #

def _user(db, suffix=""):
    u = User(email=f"u{suffix}@test.com", password_hash="x", username=f"u{suffix}")
    db.add(u)
    db.flush()
    return u


def _tournament(db, organizer_id, bracket_type="single_elim"):
    t = Tournament(
        organizer_id=organizer_id,
        name="T",
        sport_type="chess",
        bracket_type=bracket_type,
        max_participants=16,
        start_date=datetime.utcnow() + timedelta(days=1),
        end_date=datetime.utcnow() + timedelta(days=2),
        status="open",
        is_visible=True,
        is_team_based=False,
    )
    db.add(t)
    db.flush()
    return t


def _participants(db, tournament_id, n):
    parts = []
    for i in range(n):
        u = _user(db, suffix=f"{i}_{uuid.uuid4().hex[:6]}")
        p = TournamentParticipant(tournament_id=tournament_id, user_id=u.id)
        db.add(p)
        parts.append(p)
    db.flush()
    return parts


# ─── Round-robin ──────────────────────────────────────────────────────────── #

def test_round_robin_n2_produces_1_match(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "round_robin")
    _participants(db, t.id, 2)
    random.seed(0)
    matches = generate_round_robin(t.id, db)
    assert len(matches) == 1  # 2*(2-1)/2


def test_round_robin_n4_produces_6_matches(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "round_robin")
    _participants(db, t.id, 4)
    random.seed(0)
    matches = generate_round_robin(t.id, db)
    assert len(matches) == 6  # 4*3/2


def test_round_robin_n3_produces_3_matches_no_byes_in_output(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "round_robin")
    _participants(db, t.id, 3)
    random.seed(0)
    matches = generate_round_robin(t.id, db)
    # n=3 → pad to 4, 3 rounds of 1 real match each → 3 matches
    assert len(matches) == 3
    # All matches have two real participants
    for m in matches:
        assert m.participant_a_id is not None
        assert m.participant_b_id is not None


def test_round_robin_all_pairs_unique(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "round_robin")
    parts = _participants(db, t.id, 5)
    random.seed(0)
    matches = generate_round_robin(t.id, db)
    pairs = {
        frozenset([m.participant_a_id, m.participant_b_id]) for m in matches
    }
    assert len(pairs) == len(matches), "duplicate match pair found"


def test_round_robin_rejects_single_participant(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "round_robin")
    _participants(db, t.id, 1)
    with pytest.raises(AppError) as exc:
        generate_round_robin(t.id, db)
    assert exc.value.status_code == 422


def test_round_robin_rejects_duplicate_generation(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "round_robin")
    _participants(db, t.id, 4)
    random.seed(0)
    generate_round_robin(t.id, db)
    with pytest.raises(AppError) as exc:
        generate_round_robin(t.id, db)
    assert exc.value.status_code == 409


# ─── Single elimination ───────────────────────────────────────────────────── #

def test_single_elim_n4_exact_bracket(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "single_elim")
    _participants(db, t.id, 4)
    random.seed(0)
    matches = generate_single_elimination(t.id, db)
    # 4 players → 2 rounds, 3 total matches
    assert len(matches) == 3
    rounds = {m.round_number for m in matches}
    assert rounds == {1, 2}


def test_single_elim_n3_has_one_bye(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "single_elim")
    _participants(db, t.id, 3)
    random.seed(0)
    matches = generate_single_elimination(t.id, db)
    # n=3 → bracket_size=4 → 1 bye, 3 total matches
    assert len(matches) == 3
    bye_matches = [m for m in matches if m.status == "completed" and m.round_number == 1]
    assert len(bye_matches) == 1


def test_single_elim_n8_total_matches(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "single_elim")
    _participants(db, t.id, 8)
    random.seed(0)
    matches = generate_single_elimination(t.id, db)
    # 8 players → 7 matches (n-1 always for single elim)
    assert len(matches) == 7


def test_single_elim_feeder_wired(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "single_elim")
    _participants(db, t.id, 4)
    random.seed(0)
    matches = generate_single_elimination(t.id, db)
    r1 = [m for m in matches if m.round_number == 1]
    for m in r1:
        assert m.feeds_into_match_id is not None
        assert m.feeds_into_slot in ("a", "b")


def test_single_elim_rejects_single_participant(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "single_elim")
    _participants(db, t.id, 1)
    with pytest.raises(AppError) as exc:
        generate_single_elimination(t.id, db)
    assert exc.value.status_code == 422


def test_single_elim_rejects_duplicate(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "single_elim")
    _participants(db, t.id, 4)
    random.seed(0)
    generate_single_elimination(t.id, db)
    with pytest.raises(AppError) as exc:
        generate_single_elimination(t.id, db)
    assert exc.value.status_code == 409


# ─── submit_result ────────────────────────────────────────────────────────── #

def test_submit_result_marks_match_completed(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "round_robin")
    parts = _participants(db, t.id, 2)
    random.seed(0)
    matches = generate_round_robin(t.id, db)
    m = matches[0]
    winner_id = m.participant_a_id
    updated = submit_result(t.id, m.id, winner_id, db)
    assert updated.status == "completed"
    assert updated.winner_id == winner_id


def test_submit_result_rejects_non_participant_winner(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "round_robin")
    _participants(db, t.id, 2)
    random.seed(0)
    matches = generate_round_robin(t.id, db)
    m = matches[0]
    with pytest.raises(AppError) as exc:
        submit_result(t.id, m.id, uuid.uuid4(), db)
    assert exc.value.status_code == 422


def test_submit_result_rejects_already_completed(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "round_robin")
    _participants(db, t.id, 2)
    random.seed(0)
    matches = generate_round_robin(t.id, db)
    m = matches[0]
    submit_result(t.id, m.id, m.participant_a_id, db)
    with pytest.raises(AppError) as exc:
        submit_result(t.id, m.id, m.participant_a_id, db)
    assert exc.value.status_code == 409


def test_submit_result_advances_winner_in_single_elim(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "single_elim")
    _participants(db, t.id, 4)
    random.seed(42)
    matches = generate_single_elimination(t.id, db)
    r1 = sorted([m for m in matches if m.round_number == 1], key=lambda m: m.match_number)
    r2 = [m for m in matches if m.round_number == 2][0]

    winner_a = r1[0].participant_a_id
    submit_result(t.id, r1[0].id, winner_a, db)
    db.refresh(r2)
    assert r2.participant_a_id == winner_a or r2.participant_b_id == winner_a


# ─── get_standings ────────────────────────────────────────────────────────── #

def test_get_standings_counts_wins_and_losses(db):
    organizer = _user(db, "org")
    t = _tournament(db, organizer.id, "round_robin")
    _participants(db, t.id, 3)
    random.seed(0)
    matches = generate_round_robin(t.id, db)

    for m in matches:
        submit_result(t.id, m.id, m.participant_a_id, db)

    standings = get_standings(t.id, db)
    total_wins = sum(s["wins"] for s in standings)
    total_losses = sum(s["losses"] for s in standings)
    assert total_wins == len(matches)
    assert total_losses == len(matches)
