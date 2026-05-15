import math
import random
from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from exceptions import AppError
from models.match import Match
from models.membership import TournamentParticipant
from models.tournament import Tournament
from models.user import User
from schemas.match import MatchParticipantInfo, MatchResponse
from services.tournaments import get_tournament


# --------------------------------------------------------------------------- #
# Helpers shared across generators                                            #
# --------------------------------------------------------------------------- #
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


def _maybe_finish_tournament(tournament_id: UUID, db: Session) -> None:
    """Auto-transition tournament to 'finished' if every match is completed."""
    remaining = db.query(Match).filter(
        Match.tournament_id == tournament_id,
        Match.status != "completed",
    ).count()
    if remaining == 0:
        tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if tournament and tournament.status != "finished":
            tournament.status = "finished"
            tournament.updated_at = datetime.utcnow()


# --------------------------------------------------------------------------- #
# Single-elimination generation                                               #
# --------------------------------------------------------------------------- #
def generate_single_elimination(tournament_id: UUID, db: Session) -> list[Match]:
    """Build a single-elimination bracket with byes modeled as completed R1 matches.

    Each match's `feeds_into_match_id` + `feeds_into_slot` are persisted so
    `submit_result` can advance winners deterministically regardless of bye placement.
    """
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

    num_rounds = max(math.ceil(math.log2(n)), 1)
    bracket_size = 2 ** num_rounds
    byes = bracket_size - n

    # Round 1 ALWAYS has bracket_size / 2 matches. Bye matches are pre-completed
    # with a single participant and a NULL opponent.
    first_round_count = bracket_size // 2

    matches: list[Match] = []

    # Build seeding order: first `byes` matches get a bye (participant_a only,
    # participant_b = NULL, status="completed"). Remaining matches pair two players.
    bye_participants = participants[:byes]
    playing = participants[byes:]
    play_pairs_count = first_round_count - byes  # how many real matches in R1
    pair_idx = 0
    bye_idx = 0

    # Alternate bye placement so they're spread across the bracket, not all on top.
    # We interleave: every other match starts as a bye when byes > 0 until exhausted.
    for i in range(first_round_count):
        is_bye = bye_idx < byes and (
            # Distribute byes across slots: byes fill the "even" positions first.
            (i % 2 == 0 and bye_idx < byes) or (bye_idx + (first_round_count - i) <= byes)
        )
        if is_bye and bye_participants:
            bp = bye_participants[bye_idx]
            bye_idx += 1
            matches.append(Match(
                tournament_id=tournament_id,
                round_number=1,
                match_number=i + 1,
                participant_a_id=bp.id,
                participant_b_id=None,
                winner_id=bp.id,
                status="completed",
                completed_at=datetime.utcnow(),
            ))
        else:
            a = playing[pair_idx * 2]
            b = playing[pair_idx * 2 + 1]
            pair_idx += 1
            matches.append(Match(
                tournament_id=tournament_id,
                round_number=1,
                match_number=i + 1,
                participant_a_id=a.id,
                participant_b_id=b.id,
                status="pending",
            ))

    # Sanity: if interleave logic miscounted, fall back to sequential bye placement.
    if bye_idx != byes or pair_idx != play_pairs_count:
        matches = []
        for i in range(byes):
            bp = bye_participants[i]
            matches.append(Match(
                tournament_id=tournament_id,
                round_number=1,
                match_number=i + 1,
                participant_a_id=bp.id,
                participant_b_id=None,
                winner_id=bp.id,
                status="completed",
                completed_at=datetime.utcnow(),
            ))
        for j in range(play_pairs_count):
            a = playing[j * 2]
            b = playing[j * 2 + 1]
            matches.append(Match(
                tournament_id=tournament_id,
                round_number=1,
                match_number=byes + j + 1,
                participant_a_id=a.id,
                participant_b_id=b.id,
                status="pending",
            ))

    # Rounds 2..num_rounds: empty placeholders.
    round_counts = {1: first_round_count}
    for r in range(2, num_rounds + 1):
        prev = round_counts[r - 1]
        round_counts[r] = max(prev // 2, 1)
        for i in range(round_counts[r]):
            matches.append(Match(
                tournament_id=tournament_id,
                round_number=r,
                match_number=i + 1,
                participant_a_id=None,
                participant_b_id=None,
                status="pending",
            ))

    db.add_all(matches)
    db.flush()  # populate IDs

    # Wire feeder mapping: match at (r, m) feeds (r+1, (m+1)//2). Even m -> slot 'b', odd m -> slot 'a'.
    by_round: dict[int, list[Match]] = {}
    for m in matches:
        by_round.setdefault(m.round_number, []).append(m)
    for r in range(1, num_rounds):
        for m in by_round[r]:
            target_number = (m.match_number + 1) // 2
            target = next(t for t in by_round[r + 1] if t.match_number == target_number)
            m.feeds_into_match_id = target.id
            m.feeds_into_slot = "a" if m.match_number % 2 == 1 else "b"

    # Now propagate winners from completed bye matches into round 2 slots.
    for m in by_round.get(1, []):
        if m.status == "completed" and m.winner_id and m.feeds_into_match_id:
            target = next(t for t in matches if t.id == m.feeds_into_match_id)
            if m.feeds_into_slot == "a":
                target.participant_a_id = m.winner_id
            else:
                target.participant_b_id = m.winner_id

    # After byes seeded, check if any round-2 match now has both slots filled with a bye
    # (rare: two adjacent byes). In that case mark it completed too and recurse forward.
    _resolve_chained_byes(matches, db)

    # Tournament may already be finished if bracket_size == 1 edge (n=1 case rejected above).
    db.commit()
    for m in matches:
        db.refresh(m)
    return matches


def _resolve_chained_byes(matches: list[Match], db: Session) -> None:
    """If two byes feed into the same later match, propagate one as winner.
    Picks slot 'a' winner by default; loops until quiescent."""
    by_id = {m.id: m for m in matches}
    changed = True
    while changed:
        changed = False
        for m in matches:
            if m.status == "completed":
                continue
            a, b = m.participant_a_id, m.participant_b_id
            # If one slot is NULL because opponent is forfeit AND other slot was seeded from a bye,
            # treat as auto-advance only when this is round > 1 AND opponent's feeder is also a bye.
            # Simpler: if both slots filled and one of them came from a bye-chain, no action needed.
            # Only auto-complete when exactly one slot filled and the other's feeder match is a bye too.
            if a is not None and b is None and m.round_number > 1:
                feeders = [f for f in matches if f.feeds_into_match_id == m.id]
                # Check if all feeders for the OTHER slot are already completed but contributed nothing
                # (NULL winners). This means slot b has no incoming player at all.
                b_feeders = [f for f in feeders if f.feeds_into_slot == "b"]
                if b_feeders and all(f.status == "completed" and f.winner_id is None for f in b_feeders):
                    m.winner_id = a
                    m.status = "completed"
                    m.completed_at = datetime.utcnow()
                    if m.feeds_into_match_id:
                        target = by_id.get(m.feeds_into_match_id)
                        if target:
                            if m.feeds_into_slot == "a":
                                target.participant_a_id = a
                            else:
                                target.participant_b_id = a
                    changed = True


# --------------------------------------------------------------------------- #
# Round-robin generation                                                      #
# --------------------------------------------------------------------------- #
def generate_round_robin(tournament_id: UUID, db: Session) -> list[Match]:
    """Build a round-robin bracket using Berger tables (circle method).
    Each player meets each other once; total = n*(n-1)/2 matches.
    Matches are grouped into rounds so each player plays at most once per round."""
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
    # Berger requires even count; add a "bye" sentinel for odd n.
    bye_marker: TournamentParticipant | None = None
    if n % 2 == 1:
        # Sentinel with None id; matches against bye_marker are skipped.
        bye_marker = TournamentParticipant(tournament_id=tournament_id, user_id=None, team_id=None)
        participants.append(bye_marker)

    k = len(participants)
    rounds = k - 1
    half = k // 2

    matches: list[Match] = []
    # Fix participant 0, rotate the rest.
    order = list(range(k))
    for r in range(rounds):
        match_number = 1
        for i in range(half):
            a = participants[order[i]]
            b = participants[order[k - 1 - i]]
            if bye_marker is not None and (a is bye_marker or b is bye_marker):
                continue  # skip bye sentinel pair
            matches.append(Match(
                tournament_id=tournament_id,
                round_number=r + 1,
                match_number=match_number,
                participant_a_id=a.id,
                participant_b_id=b.id,
                status="pending",
            ))
            match_number += 1
        # rotate: keep index 0 fixed, shift everyone else by 1
        order = [order[0]] + [order[-1]] + order[1:-1]

    db.add_all(matches)
    db.commit()
    for m in matches:
        db.refresh(m)
    return matches


# --------------------------------------------------------------------------- #
# Dispatch                                                                    #
# --------------------------------------------------------------------------- #
def generate_matches(tournament_id: UUID, db: Session) -> list[Match]:
    tournament = get_tournament(tournament_id, db)
    if tournament.bracket_type == "single_elim":
        return generate_single_elimination(tournament_id, db)
    elif tournament.bracket_type == "round_robin":
        return generate_round_robin(tournament_id, db)
    raise AppError(422, f"Unknown bracket type: {tournament.bracket_type}")


# --------------------------------------------------------------------------- #
# Query                                                                       #
# --------------------------------------------------------------------------- #
def get_matches(tournament_id: UUID, db: Session) -> list[Match]:
    get_tournament(tournament_id, db)
    return (
        db.query(Match)
        .filter(Match.tournament_id == tournament_id)
        .order_by(Match.round_number.asc(), Match.match_number.asc())
        .all()
    )


def get_standings(tournament_id: UUID, db: Session) -> list[dict]:
    """Compute wins/losses per participant. Useful for round-robin tournaments."""
    tournament = get_tournament(tournament_id, db)
    matches = db.query(Match).filter(
        Match.tournament_id == tournament_id, Match.status == "completed"
    ).all()
    stats: dict[UUID, dict] = {}
    parts = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id
    ).all()
    for p in parts:
        stats[p.id] = {"participant_id": p.id, "wins": 0, "losses": 0, "played": 0}

    for m in matches:
        if m.winner_id is None:
            continue
        loser_id = (
            m.participant_b_id if m.winner_id == m.participant_a_id else m.participant_a_id
        )
        if m.winner_id in stats:
            stats[m.winner_id]["wins"] += 1
            stats[m.winner_id]["played"] += 1
        if loser_id and loser_id in stats:
            stats[loser_id]["losses"] += 1
            stats[loser_id]["played"] += 1

    # Decorate with display info.
    out = []
    for pid, row in stats.items():
        info = _load_participant_info(pid, db)
        out.append({
            **row,
            "username": info.username if info else None,
            "manual_name": info.manual_name if info else None,
        })
    out.sort(key=lambda x: (-x["wins"], x["losses"]))
    return out


# --------------------------------------------------------------------------- #
# Result submission with deterministic advancement                            #
# --------------------------------------------------------------------------- #
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

    # Deterministic advancement via stored feeder mapping (single-elim only).
    if match.feeds_into_match_id and match.feeds_into_slot:
        target = db.query(Match).filter(Match.id == match.feeds_into_match_id).first()
        if target:
            if match.feeds_into_slot == "a":
                target.participant_a_id = winner_participant_id
            else:
                target.participant_b_id = winner_participant_id

    _maybe_finish_tournament(tournament_id, db)
    db.commit()
    db.refresh(match)
    return match
