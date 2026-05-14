import math
import random
from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from exceptions import AppError
from models.match import Match
from models.membership import TournamentParticipant
from models.user import User
from schemas.match import MatchParticipantInfo, MatchResponse
from services.tournaments import get_tournament


def _load_participant_info(participant_id: UUID | None, db: Session) -> MatchParticipantInfo | None:
    if participant_id is None:
        return None
    p = db.query(TournamentParticipant).filter(TournamentParticipant.id == participant_id).first()
    if not p:
        return None
    username = None
    if p.user_id:
        user = db.query(User).filter(User.id == p.user_id).first()
        if user:
            username = user.username
    return MatchParticipantInfo(
        id=p.id,
        user_id=p.user_id,
        team_id=p.team_id,
        manual_name=p.manual_name,
        username=username,
    )


def match_to_response(match: Match, db: Session) -> MatchResponse:
    return MatchResponse(
        id=match.id,
        tournament_id=match.tournament_id,
        round_number=match.round_number,
        match_number=match.match_number,
        participant_a=_load_participant_info(match.participant_a_id, db),
        participant_b=_load_participant_info(match.participant_b_id, db),
        winner_id=match.winner_id,
        status=match.status,
        scheduled_at=match.scheduled_at,
    )


def generate_single_elimination(tournament_id: UUID, db: Session) -> list[Match]:
    """Create matches for single-elim bracket. Round 1 seeded from shuffled participants;
    rounds 2+ created as placeholders with NULL slots, filled in on result submission."""
    get_tournament(tournament_id, db)

    existing = db.query(Match).filter(Match.tournament_id == tournament_id).first()
    if existing:
        raise AppError(409, "Matches already generated")

    participants = (
        db.query(TournamentParticipant)
        .filter(TournamentParticipant.tournament_id == tournament_id)
        .all()
    )
    n = len(participants)
    if n < 2:
        raise AppError(422, "Need at least 2 participants to generate matches")

    random.shuffle(participants)

    num_rounds = math.ceil(math.log2(n))
    bracket_size = 2 ** num_rounds
    byes = bracket_size - n

    matches: list[Match] = []

    # Round 1: pair the participants who don't get a bye.
    # Participants with byes (first `byes` after shuffle) advance straight to round 2.
    bye_participants = participants[:byes]
    playing = participants[byes:]
    first_round_matches = len(playing) // 2

    for i in range(first_round_matches):
        m = Match(
            tournament_id=tournament_id,
            round_number=1,
            match_number=i + 1,
            participant_a_id=playing[i * 2].id,
            participant_b_id=playing[i * 2 + 1].id,
            status="pending",
        )
        matches.append(m)

    # Rounds 2+: placeholder slots. Bye participants pre-seeded into round-2 slots.
    prev_round_count = first_round_matches + byes  # winners feeding round 2
    round_num = 2
    while round_num <= num_rounds:
        this_round_count = max(prev_round_count // 2, 1)
        for i in range(this_round_count):
            m = Match(
                tournament_id=tournament_id,
                round_number=round_num,
                match_number=i + 1,
                participant_a_id=None,
                participant_b_id=None,
                status="pending",
            )
            matches.append(m)
        prev_round_count = this_round_count
        round_num += 1

    db.add_all(matches)
    db.flush()

    # Seed bye participants into round 2 in order, filling participant_a then b.
    if byes:
        round2 = [m for m in matches if m.round_number == 2]
        slot_index = 0
        for bp in bye_participants:
            if slot_index >= len(round2) * 2:
                break
            match = round2[slot_index // 2]
            if slot_index % 2 == 0:
                match.participant_a_id = bp.id
            else:
                match.participant_b_id = bp.id
            slot_index += 1

    db.commit()
    for m in matches:
        db.refresh(m)
    return matches


def get_matches(tournament_id: UUID, db: Session) -> list[Match]:
    get_tournament(tournament_id, db)
    return (
        db.query(Match)
        .filter(Match.tournament_id == tournament_id)
        .order_by(Match.round_number.asc(), Match.match_number.asc())
        .all()
    )


def submit_result(
    tournament_id: UUID, match_id: UUID, winner_participant_id: UUID, db: Session
) -> Match:
    match = (
        db.query(Match)
        .filter(Match.id == match_id, Match.tournament_id == tournament_id)
        .first()
    )
    if not match:
        raise AppError(404, "Match not found")
    if match.status == "completed":
        raise AppError(409, "Match already completed")
    if winner_participant_id not in {match.participant_a_id, match.participant_b_id}:
        raise AppError(422, "Winner must be a participant of this match")

    match.winner_id = winner_participant_id
    match.status = "completed"
    match.completed_at = datetime.utcnow()

    # Advance winner to next-round match (lowest match_number with an empty slot).
    next_round_matches = (
        db.query(Match)
        .filter(
            Match.tournament_id == tournament_id,
            Match.round_number == match.round_number + 1,
        )
        .order_by(Match.match_number.asc())
        .all()
    )
    # Deterministic feed: round-N match i feeds round-(N+1) match (i+1)//2 (1-indexed).
    target_number = (match.match_number + 1) // 2
    target = next((m for m in next_round_matches if m.match_number == target_number), None)
    if target is not None:
        if target.participant_a_id is None:
            target.participant_a_id = winner_participant_id
        elif target.participant_b_id is None:
            target.participant_b_id = winner_participant_id

    db.commit()
    db.refresh(match)
    return match
