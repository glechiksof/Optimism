import secrets
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from passlib.context import CryptContext

from database import SessionLocal
from models import User, Tournament, Team, JoinToken

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def seed():
    db = SessionLocal()
    try:
        organizer = db.query(User).filter(User.email == "organizer@test.com").first()
        if not organizer:
            organizer = User(
                email="organizer@test.com",
                password_hash=hash_password("Test1234!"),
                username="organizer",
            )
            db.add(organizer)
            db.flush()

        player = db.query(User).filter(User.email == "player@test.com").first()
        if not player:
            player = User(
                email="player@test.com",
                password_hash=hash_password("Test1234!"),
                username="player",
            )
            db.add(player)
            db.flush()

        tournament = db.query(Tournament).filter(Tournament.name == "Spring Cup").first()
        if not tournament:
            tournament = Tournament(
                organizer_id=organizer.id,
                name="Spring Cup",
                sport_type="Football",
                bracket_type="single_elim",
                max_participants=8,
                start_date=datetime.utcnow() + timedelta(days=7),
                end_date=datetime.utcnow() + timedelta(days=14),
                status="open",
                is_visible=True,
            )
            db.add(tournament)
            db.flush()

        team = db.query(Team).filter(Team.name == "Eagles").first()
        if not team:
            team = Team(
                tournament_id=tournament.id,
                name="Eagles",
                capacity=4,
                join_method="team_page",
                is_visible=True,
                created_by=organizer.id,
            )
            db.add(team)
            db.flush()

        token_exists = db.query(JoinToken).filter(JoinToken.team_id == team.id).first()
        if not token_exists:
            join_token = JoinToken(
                team_id=team.id,
                token=secrets.token_urlsafe(32),
                expires_at=datetime.utcnow() + timedelta(days=7),
                is_active=True,
            )
            db.add(join_token)

        db.commit()
        print("Seed completed.")
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
