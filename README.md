# Tournament Organizer

A web platform for creating, finding, and managing sports tournaments and teams.

Organizers can create tournaments, set up brackets, and manage participants. Players can search for tournaments, join teams, and track match results.

**Live:** frontend on GitHub Pages · backend on Render

---

## Stack

| Layer    | Technology                  |
|----------|-----------------------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend  | FastAPI + SQLAlchemy 2      |
| Database | PostgreSQL                  |

---

## Features

- Register and log in
- Create tournaments (single elimination or round robin)
- Save drafts or publish immediately
- Search and browse public tournaments
- Create and join teams
- Track bracket progress and match results

---

## Running Locally

### Requirements

- Node.js ≥ 18
- Python ≥ 3.11
- PostgreSQL ≥ 15

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev        # http://localhost:5173
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python seed.py
uvicorn main:app --reload --port 8000 --ws none
```

### Environment variables

**`frontend/.env`**

```env
VITE_API_BASE_URL=http://localhost:8000
```

**`backend/.env`**

```env
DATABASE_URL=postgresql://user:pass@localhost/tournament_organizer
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7
CORS_ORIGINS=http://localhost:5173
```

---

## Testing

```bash
# E2E (from frontend/)
npx playwright install   # first time only
npm run test:e2e
```

---

## Known Limitations

- Single elimination and round robin only (no custom formats)
- No email verification
- Render free tier has ~50s cold start on first request
