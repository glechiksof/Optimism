import uuid
from datetime import datetime, timedelta

import pytest

from exceptions import AppError
from models.team import Team
from models.membership import TeamMember
from models.user import User
from schemas.team import TeamCreate, ManualMemberItem, TeamUpdate
from services.teams import (
    create_team,
    delete_team,
    join_team,
    leave_team,
    remove_member,
    update_team,
    get_team_or_404,
)


def _user(db):
    u = User(email=f"u{uuid.uuid4().hex[:6]}@t.com", password_hash="x", username="u")
    db.add(u)
    db.flush()
    return u


def _create_data(**kwargs):
    defaults = dict(name="Team Alpha", capacity=5, join_method="team_page")
    defaults.update(kwargs)
    return TeamCreate(**defaults)


# ─── create ──────────────────────────────────────────────────────────────── #

def test_create_team_persists(db):
    creator = _user(db)
    team = create_team(_create_data(), creator.id, db)
    assert team.id is not None
    assert team.name == "Team Alpha"
    assert team.created_by == creator.id


def test_create_team_with_manual_members(db):
    creator = _user(db)
    data = _create_data(
        capacity=5,
        manual_members=[ManualMemberItem(name="Alice"), ManualMemberItem(name="Bob")],
    )
    team = create_team(data, creator.id, db)
    assert team.current_size == 2
    members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
    assert len(members) == 2


def test_create_team_too_many_manual_members_raises(db):
    creator = _user(db)
    data = _create_data(
        capacity=2,
        manual_members=[ManualMemberItem(name=f"p{i}") for i in range(3)],
    )
    with pytest.raises(AppError) as exc:
        create_team(data, creator.id, db)
    assert exc.value.status_code == 422


# ─── update ──────────────────────────────────────────────────────────────── #

def test_update_team_name(db):
    creator = _user(db)
    team = create_team(_create_data(), creator.id, db)
    updated = update_team(team.id, TeamUpdate(name="New Name"), creator.id, db)
    assert updated.name == "New Name"


def test_update_team_wrong_creator_raises(db):
    creator = _user(db)
    other = _user(db)
    team = create_team(_create_data(), creator.id, db)
    with pytest.raises(AppError) as exc:
        update_team(team.id, TeamUpdate(name="Hack"), other.id, db)
    assert exc.value.status_code == 403


def test_update_capacity_below_member_count_raises(db):
    creator = _user(db)
    data = _create_data(
        capacity=5,
        manual_members=[ManualMemberItem(name=f"p{i}") for i in range(3)],
    )
    team = create_team(data, creator.id, db)
    with pytest.raises(AppError) as exc:
        update_team(team.id, TeamUpdate(capacity=2), creator.id, db)
    assert exc.value.status_code == 422


# ─── join ────────────────────────────────────────────────────────────────── #

def test_join_team_team_page_method(db):
    creator = _user(db)
    joiner = _user(db)
    team = create_team(_create_data(join_method="team_page", capacity=5), creator.id, db)
    member = join_team(team.id, joiner.id, None, db)
    assert member.user_id == joiner.id


def test_join_team_manual_method_raises(db):
    creator = _user(db)
    joiner = _user(db)
    team = create_team(_create_data(join_method="manual"), creator.id, db)
    with pytest.raises(AppError) as exc:
        join_team(team.id, joiner.id, None, db)
    assert exc.value.status_code == 403


def test_join_team_full_raises(db):
    creator = _user(db)
    team = create_team(_create_data(join_method="team_page", capacity=2), creator.id, db)
    for _ in range(2):
        join_team(team.id, _user(db).id, None, db)
    with pytest.raises(AppError) as exc:
        join_team(team.id, _user(db).id, None, db)
    assert exc.value.status_code == 422


def test_join_team_duplicate_raises(db):
    creator = _user(db)
    joiner = _user(db)
    team = create_team(_create_data(join_method="team_page", capacity=5), creator.id, db)
    join_team(team.id, joiner.id, None, db)
    with pytest.raises(AppError) as exc:
        join_team(team.id, joiner.id, None, db)
    assert exc.value.status_code == 409


def test_join_team_link_method_no_token_raises(db):
    creator = _user(db)
    team = create_team(_create_data(join_method="link", capacity=5), creator.id, db)
    with pytest.raises(AppError) as exc:
        join_team(team.id, _user(db).id, None, db)
    assert exc.value.status_code == 400


# ─── leave ───────────────────────────────────────────────────────────────── #

def test_leave_team_removes_member(db):
    creator = _user(db)
    joiner = _user(db)
    team = create_team(_create_data(join_method="team_page", capacity=5), creator.id, db)
    join_team(team.id, joiner.id, None, db)
    leave_team(team.id, joiner.id, db)
    member = db.query(TeamMember).filter(
        TeamMember.team_id == team.id, TeamMember.user_id == joiner.id
    ).first()
    assert member is None


def test_creator_cannot_leave_own_team(db):
    creator = _user(db)
    team = create_team(_create_data(join_method="team_page", capacity=5), creator.id, db)
    with pytest.raises(AppError) as exc:
        leave_team(team.id, creator.id, db)
    assert exc.value.status_code == 422


def test_leave_nonmember_raises(db):
    creator = _user(db)
    stranger = _user(db)
    team = create_team(_create_data(join_method="team_page", capacity=5), creator.id, db)
    with pytest.raises(AppError) as exc:
        leave_team(team.id, stranger.id, db)
    assert exc.value.status_code == 404


# ─── remove_member ───────────────────────────────────────────────────────── #

def test_remove_member_by_creator(db):
    creator = _user(db)
    joiner = _user(db)
    team = create_team(_create_data(join_method="team_page", capacity=5), creator.id, db)
    member = join_team(team.id, joiner.id, None, db)
    remove_member(team.id, member.id, creator.id, db)
    assert db.query(TeamMember).filter(TeamMember.id == member.id).first() is None


def test_remove_member_wrong_creator_raises(db):
    creator = _user(db)
    other = _user(db)
    joiner = _user(db)
    team = create_team(_create_data(join_method="team_page", capacity=5), creator.id, db)
    member = join_team(team.id, joiner.id, None, db)
    with pytest.raises(AppError) as exc:
        remove_member(team.id, member.id, other.id, db)
    assert exc.value.status_code == 403


# ─── delete ──────────────────────────────────────────────────────────────── #

def test_delete_team(db):
    creator = _user(db)
    team = create_team(_create_data(), creator.id, db)
    delete_team(team.id, creator.id, db)
    assert db.query(Team).filter(Team.id == team.id).first() is None


def test_delete_team_wrong_creator_raises(db):
    creator = _user(db)
    other = _user(db)
    team = create_team(_create_data(), creator.id, db)
    with pytest.raises(AppError) as exc:
        delete_team(team.id, other.id, db)
    assert exc.value.status_code == 403
