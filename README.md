# Tournament Organizer

A full-stack web platform for creating, finding, joining, and managing tournaments and teams.

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React + Vite (Node)               |
| Backend  | FastAPI (Python)                  |
| Database | PostgreSQL                        |
| Frontend hosting | GitHub Pages              |
| Backend hosting  | Render                    |

---

## Repository Workflow

| Branch          | Purpose                                    |
|-----------------|--------------------------------------------|
| `main`          | Stable, deployed state                     |
| `development`   | Integration branch — all PRs target this  |
| `feature/*`     | One branch per task (e.g. `feature/auth-api`) |

- All changes go through a **pull request** into `development`.
- `main` is only updated via PR from `development` after QA sign-off.
- Commit format: [Conventional Commits](https://www.conventionalcommits.org/) — `type(scope): summary`
  - Common types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`

---

## Local Setup

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.11
- PostgreSQL ≥ 15 (local install or Docker)
- `pnpm` or `npm`

---

### 1. Clone and branch

```bash
git clone https://github.com/<org>/tournament-organizer.git
cd tournament-organizer
git checkout development
```

---

### 2. Frontend

```bash
cd frontend
npm install          # or: pnpm install
cp .env.example .env # set VITE_API_URL to your backend URL
npm run dev          # starts on http://localhost:5173
```

Build for production:

```bash
npm run build
npm run preview
```

Lint:

```bash
npm run lint
```

---

### 3. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # fill in DATABASE_URL, SECRET_KEY, etc.
uvicorn app.main:app --reload --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

---

### 4. Database

```bash
# Create the database
createdb tournament_organizer

# Run migrations (from backend/)
alembic upgrade head

# Seed with sample data
python -m app.seed
```

Reset from scratch:

```bash
alembic downgrade base && alembic upgrade head && python -m app.seed
```

---

### 5. Tests

**Backend (pytest):**

```bash
cd backend
pytest                       # all tests
pytest -v tests/             # verbose
pytest --cov=app tests/      # with coverage
```

**Frontend (Vitest):**

```bash
cd frontend
npm run test                 # unit tests
npm run test:coverage
```

**E2E (Playwright):**

```bash
cd frontend
npx playwright install       # first time only
npm run test:e2e             # headless
npm run test:e2e -- --headed # headed (watch mode)
```

---

## Environment Variables

### Frontend (`frontend/.env`)

| Variable        | Example                        | Description              |
|-----------------|--------------------------------|--------------------------|
| `VITE_API_URL`  | `http://localhost:8000`        | Backend base URL         |

### Backend (`backend/.env`)

| Variable        | Example                                            | Description              |
|-----------------|----------------------------------------------------|--------------------------|
| `DATABASE_URL`  | `postgresql://user:pass@localhost/tournament_organizer` | PostgreSQL connection |
| `SECRET_KEY`    | `change-me-in-prod`                                | JWT signing key          |
| `CORS_ORIGINS`  | `http://localhost:5173`                            | Allowed frontend origins |
| `ENV`           | `development`                                      | Runtime environment      |

---

## Deployment

| Target   | Service       | Trigger                        |
|----------|---------------|--------------------------------|
| Frontend | GitHub Pages  | Push to `main` (GH Actions)   |
| Backend  | Render        | Push to `main` (auto-deploy)  |
| Database | Render PostgreSQL | Provisioned on Render     |

See [`docs/05_DEPLOYMENT_AND_ENV.md`](docs/05_DEPLOYMENT_AND_ENV.md) for full deployment instructions.

---

## Project Structure

```
tournament-organizer/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── api/       # API client
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── main.jsx
│   └── e2e/           # Playwright tests
├── backend/           # FastAPI app
│   ├── app/
│   │   ├── api/       # Route handlers
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic
│   │   └── main.py
│   ├── alembic/       # Migrations
│   └── tests/
└── .github/
    ├── pull_request_template.md
    └── rulesets/
```
