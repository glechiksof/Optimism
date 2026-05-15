"""
Seed the database with realistic fake data for manual testing.

Usage:
    python seed.py            # idempotent insert (skips existing rows by name/email)
    python seed.py --reset    # WIPES tournaments/teams/participants/matches/join_tokens
                              # then reseeds. Users are preserved.
    python seed.py --wipe     # WIPES users too (cascades everything). Then reseeds.

Login creds for every seeded user:
    email:    <username>@test.com
    password: Test1234!

Notable demo accounts:
    organizer@test.com  — organizes most tournaments
    player@test.com     — registered for several tournaments
    spectator@test.com  — no registrations
"""
import math
import random
import secrets
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

import bcrypt

from database import SessionLocal
from models import User, Tournament, Team, JoinToken
from models.membership import TeamMember, TournamentParticipant
from models.match import Match


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


# --------------------------------------------------------------------------- #
# Static data pools                                                           #
# --------------------------------------------------------------------------- #
PASSWORD = "Test1234!"

DEMO_USERS = [
    ("organizer", "organizer@test.com"),
    ("player", "player@test.com"),
    ("spectator", "spectator@test.com"),
]

PLAYER_USERNAMES = [
    "alice", "bob", "carol", "dave", "eve", "frank", "grace", "heidi",
    "ivan", "judy", "kate", "leo", "mallory", "niaj", "olivia", "peggy",
    "quentin", "rupert", "sybil", "trent", "ursula", "victor", "wendy", "xena",
]

SPORTS = ["Football", "Basketball", "Tennis", "Chess", "Volleyball", "E-sports"]

TOURNAMENT_TEMPLATES = [
    ("Spring Cup",          "Football",   "single_elim", 8,  "open",      -3,  +7,  +14, True),
    ("Winter Classic",      "Basketball", "single_elim", 16, "open",      -1,  +5,  +12, True),
    ("City Chess Open",     "Chess",      "round_robin", 8,  "open",      0,   +2,  +9,  True),
    ("Tennis Masters",      "Tennis",     "single_elim", 4,  "open",      -2,  +4,  +6,  True),
    ("Volleyball League",   "Volleyball", "round_robin", 6,  "closed",    -5,  +1,  +20, True),
    ("LAN Showdown",        "E-sports",   "single_elim", 8,  "started",   -10, -2,  +5,  True),
    ("Autumn Invitational", "Football",   "single_elim", 8,  "finished",  -30, -20, -10, True),
    ("Hidden Draft",        "Football",   "single_elim", 4,  "draft",     0,   +30, +35, False),
    ("Private Friends Cup", "Tennis",     "single_elim", 4,  "open",      -1,  +3,  +5,  False),
]

TEAM_TEMPLATES = [
    ("Eagles",    "team_page", 4, True),
    ("Falcons",   "team_page", 4, True),
    ("Sharks",    "link",      4, True),
    ("Wolves",    "manual",    4, True),
    ("Dragons",   "mixed",     4, True),
    ("Lions",     "team_page", 6, True),
    ("Tigers",    "team_page", 6, True),
    ("Hidden FC", "team_page", 4, False),
]


# --------------------------------------------------------------------------- #
# Helpers                                                                     #
# --------------------------------------------------------------------------- #
def _now():
    return datetime.utcnow()


def _ensure_user(db, username: str, email: str) -> User:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return existing
    user = User(email=email, username=username, password_hash=hash_password(PASSWORD))
    db.add(user)
    db.flush()
    return user


def _wipe_demo_data(db, *, include_users: bool):
    print("Wiping demo data...")
    db.query(Match).delete()
    db.query(TournamentParticipant).delete()
    db.query(JoinToken).delete()
    db.query(TeamMember).delete()
    db.query(Team).delete()
    db.query(Tournament).delete()
    if include_users:
        db.query(User).delete()
    db.commit()


# --------------------------------------------------------------------------- #
# Seed phases                                                                 #
# --------------------------------------------------------------------------- #
def seed_users(db) -> dict[str, User]:
    users: dict[str, User] = {}
    for username, email in DEMO_USERS:
        users[username] = _ensure_user(db, username, email)
    for username in PLAYER_USERNAMES:
        users[username] = _ensure_user(db, username, f"{username}@test.com")
    db.commit()
    print(f"  users: {len(users)}")
    return users


def seed_tournaments(db, users: dict[str, User]) -> list[Tournament]:
    organizer = users["organizer"]
    now = _now()
    tournaments: list[Tournament] = []
    for (name, sport, bracket, max_p, status, created_days, start_days, end_days, visible) in TOURNAMENT_TEMPLATES:
        existing = db.query(Tournament).filter(Tournament.name == name).first()
        if existing:
            tournaments.append(existing)
            continue
        t = Tournament(
            organizer_id=organizer.id,
            name=name,
            sport_type=sport,
            bracket_type=bracket,
            description=f"Demo {sport} tournament — status: {status}",
            max_participants=max_p,
            start_date=now + timedelta(days=start_days),
            end_date=now + timedelta(days=end_days),
            status=status,
            is_visible=visible,
        )
        db.add(t)
        db.flush()
        tournaments.append(t)
    db.commit()
    print(f"  tournaments: {len(tournaments)}")
    return tournaments


def seed_teams(db, tournaments: list[Tournament], users: dict[str, User]) -> list[Team]:
    # Attach teams to first open tournament (Spring Cup) + a couple unaffiliated.
    spring = next(t for t in tournaments if t.name == "Spring Cup")
    winter = next(t for t in tournaments if t.name == "Winter Classic")
    organizer = users["organizer"]

    teams: list[Team] = []
    player_pool = [users[u] for u in PLAYER_USERNAMES]

    for i, (name, join_method, capacity, visible) in enumerate(TEAM_TEMPLATES):
        existing = db.query(Team).filter(Team.name == name).first()
        if existing:
            teams.append(existing)
            continue
        tournament_id = spring.id if i < 4 else (winter.id if i < 7 else None)
        team = Team(
            tournament_id=tournament_id,
            name=name,
            capacity=capacity,
            join_method=join_method,
            is_visible=visible,
            created_by=organizer.id,
            current_size=0,
        )
        db.add(team)
        db.flush()

        # Fill team with 2-3 members (mix of registered + manual).
        n_real = min(2, capacity - 1)
        for player in random.sample(player_pool, n_real):
            db.add(TeamMember(team_id=team.id, user_id=player.id))
        db.add(TeamMember(team_id=team.id, manual_name=f"Guest {i+1}"))
        team.current_size = n_real + 1

        # Add a join token for teams that use links.
        if join_method in ("link", "mixed"):
            db.add(JoinToken(
                team_id=team.id,
                token=secrets.token_urlsafe(32),
                expires_at=_now() + timedelta(days=14),
                is_active=True,
            ))

        teams.append(team)
    db.commit()
    print(f"  teams: {len(teams)} (with members + tokens)")
    return teams


def seed_participants(db, tournaments: list[Tournament], users: dict[str, User]) -> list[TournamentParticipant]:
    """Register varied users for tournaments. Fills Spring Cup and Winter Classic fully,
    leaves City Chess Open half-empty, fills Volleyball League (closed) fully so it
    can have matches generated, and fills the started/finished tournaments completely."""
    player_pool = [users[u] for u in PLAYER_USERNAMES] + [users["player"]]
    all_participants: list[TournamentParticipant] = []

    for t in tournaments:
        if t.status == "draft":
            continue  # draft tournaments stay empty
        # decide how many to register
        if t.name == "City Chess Open":
            n = t.max_participants // 2
        elif t.name == "Private Friends Cup":
            n = 2
        elif t.name == "Tennis Masters":
            n = 3
        else:
            n = t.max_participants

        # skip if already registered (idempotent)
        existing_count = db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == t.id
        ).count()
        if existing_count >= n:
            continue

        # always include `player@test.com` in open/closed tournaments for demo
        sample = random.sample(player_pool, n)
        if t.status in ("open", "closed", "started") and users["player"] not in sample:
            sample[-1] = users["player"]

        for u in sample:
            p = TournamentParticipant(tournament_id=t.id, user_id=u.id)
            db.add(p)
            all_participants.append(p)
        t.current_participants = n

    db.commit()
    print(f"  participants: {len(all_participants)} new")
    return all_participants


def _gen_bracket(db, tournament: Tournament) -> int:
    """Delegate to services/matches.py to keep seed in sync with production logic."""
    from services.matches import generate_matches as _generate
    existing = db.query(Match).filter(Match.tournament_id == tournament.id).first()
    if existing:
        return 0
    try:
        matches = _generate(tournament.id, db)
        return len(matches)
    except Exception as e:
        print(f"  skip {tournament.name}: {e}")
        return 0


def seed_matches(db, tournaments: list[Tournament]) -> int:
    """Generate brackets for closed/started/finished tournaments. Also complete
    round 1 of the 'started' tournament + all matches of 'finished'."""
    total = 0
    for t in tournaments:
        if t.status not in ("closed", "started", "finished"):
            continue
        created = _gen_bracket(db, t)
        total += created

        if t.status == "finished":
            # Mark every match as completed; pick participant_a as winner where possible.
            matches = db.query(Match).filter(Match.tournament_id == t.id).order_by(
                Match.round_number, Match.match_number
            ).all()
            for m in matches:
                if m.participant_a_id and m.participant_b_id:
                    m.winner_id = m.participant_a_id
                    m.status = "completed"
                    m.completed_at = _now()
            db.commit()
        elif t.status == "started":
            # Complete only round 1.
            r1 = db.query(Match).filter(
                Match.tournament_id == t.id, Match.round_number == 1
            ).all()
            for m in r1:
                if m.participant_a_id and m.participant_b_id:
                    m.winner_id = m.participant_a_id
                    m.status = "completed"
                    m.completed_at = _now()
                    # advance winner to round 2 slot
                    next_match_number = (m.match_number + 1) // 2
                    target = db.query(Match).filter(
                        Match.tournament_id == t.id,
                        Match.round_number == 2,
                        Match.match_number == next_match_number,
                    ).first()
                    if target:
                        if target.participant_a_id is None:
                            target.participant_a_id = m.winner_id
                        elif target.participant_b_id is None:
                            target.participant_b_id = m.winner_id
            db.commit()
    print(f"  matches: {total} created")
    return total


# --------------------------------------------------------------------------- #
# Entry point                                                                 #
# --------------------------------------------------------------------------- #
def seed(reset: bool = False, wipe_users: bool = False):
    random.seed(42)  # deterministic
    db = SessionLocal()
    try:
        if reset or wipe_users:
            _wipe_demo_data(db, include_users=wipe_users)

        print("Seeding...")
        users = seed_users(db)
        tournaments = seed_tournaments(db, users)
        seed_teams(db, tournaments, users)
        seed_participants(db, tournaments, users)
        seed_matches(db, tournaments)

        print("\nDone. Credentials for any seeded user:")
        print(f"  password: {PASSWORD}")
        print(f"  emails:   organizer@test.com, player@test.com, spectator@test.com,")
        print(f"            {', '.join(u + '@test.com' for u in PLAYER_USERNAMES[:6])}, ...")
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    reset = "--reset" in sys.argv
    wipe = "--wipe" in sys.argv
    seed(reset=reset, wipe_users=wipe)
