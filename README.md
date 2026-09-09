# NorthCRM

A production-grade, open-source CRM for digital marketing & web development agencies. Agents call businesses collected from public business listings, log calls, update lead statuses, schedule follow-ups, and track sales opportunities.

🔗 **GitHub Repository**: [https://github.com/mnishantlabs/NorthCRM](https://github.com/mnishantlabs/NorthCRM)  
📖 **GitHub Pages Docs**: [https://mnishantlabs.github.io/NorthCRM/](https://mnishantlabs.github.io/NorthCRM/)  
🚀 **Deployment Guide**: See [DEPLOYMENT.md](file:///a:/Devs/Saas%20Web/DEPLOYMENT.md) for step-by-step free tier hosting instructions.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS, React Router, TanStack Query, Zustand, Recharts, shadcn/ui |
| **Backend** | FastAPI, SQLAlchemy 2 (async), Alembic, Pydantic v2, JWT auth |
| **Database** | PostgreSQL (Supabase / Neon) |
| **Deployment** | Frontend → Vercel, Backend → Render / Koyeb, Database → Supabase (**100% Free**) |

## Features

- **Role-based access** — Admin and Agent roles with route + API protection
- **Business management** — Full CRUD, search, filters, pagination, sorting, agent assignment, status tracking
- **Call logging** — Append-only history; every call creates a permanent record and updates business status
- **Follow-ups** — Schedule callbacks, mark complete/missed/cancelled, today's callback board
- **Deals** — Pipeline with estimated value, closing probability, and status tracking
- **Import/Export** — CSV & Excel import with duplicate detection; filtered CSV/Excel export
- **Dashboard & Analytics** — Stat cards, calls per day, agent performance, sales chart, lead status distribution, conversion funnel, revenue by service
- **Dark / Light mode** — Full theme system via CSS variables
- **Auth** — JWT access + refresh tokens, bcrypt hashing, protected routes, global search (Cmd+K)

## Repository Structure

```
crm/
├── frontend/          # React SPA (Vite)
│   └── src/
│       ├── app/       # providers, router
│       ├── components/ui|layout|shared|businesses|...
│       ├── pages/     # route pages
│       ├── hooks/     # TanStack Query hooks
│       ├── services/  # API clients
│       ├── store/     # Zustand stores
│       ├── types/     # shared TypeScript types
│       └── utils/     # cn, format, constants
├── backend/           # FastAPI service
│   └── app/
│       ├── core/      # config, security, database, deps
│       ├── models/    # SQLAlchemy models
│       ├── schemas/   # Pydantic schemas
│       ├── routers/   # API routes
│       ├── services/  # business logic
│       └── middleware/#
├── docker-compose.yml # local dev orchestration
└── ...
```

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm (`npm i -g pnpm`)
- Python 3.11+
- PostgreSQL 16 (local, Docker, or Supabase)

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |  macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edit .env with your DATABASE_URL and JWT_SECRET_KEY

alembic upgrade head        # run migrations
python -m app.seed          # create admin user + default services

uvicorn app.main:app --reload --port 8000
```

Default seed admin: `admin@crm.local` / `Admin@1234`  (change immediately in production)

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
pnpm install
cp .env.example .env    # VITE_API_URL defaults to http://localhost:8000/api/v1
pnpm dev                # http://localhost:5173
```

### 3. Docker (optional, everything at once)

```bash
docker-compose up
# frontend http://localhost:5173 , backend http://localhost:8000 , postgres :5432
```

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://postgres:postgres@localhost:5432/crm_db` |
| `JWT_SECRET_KEY` | ≥32 char random secret | change in production |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |
| `FRONTEND_URL` | CORS origin | `http://localhost:5173` |
| `RATE_LIMIT_PER_MINUTE` | API rate limit | `100` |
| `ENVIRONMENT` | dev/prod | `development` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api/v1` |

## API Overview (all under `/api/v1`)

- **Auth** — `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- **Users** (admin) — CRUD `/users`, `PATCH /users/{id}/role`
- **Businesses** — `GET/POST /businesses`, `GET/PUT/DELETE /businesses/{id}`, `PATCH /businesses/{id}/status`, `PATCH /businesses/{id}/assign`, `POST /businesses/import`, `GET /businesses/export`
- **Call Logs** — `GET/POST /call-logs`, `GET /call-logs/{id}`, `GET /call-logs/business/{id}`, `GET /call-logs/agent/{id}`
- **Follow-ups** — CRUD `/follow-ups`, `GET /follow-ups/today`
- **Deals** — CRUD `/deals`, `PATCH /deals/{id}/status`
- **Services** — `GET /services`, admin CRUD
- **Dashboard** — `GET /dashboard/stats`, `/dashboard/charts/*`
- **Analytics** (admin) — overview, conversion funnel, revenue by service

Full interactive docs at `/docs`.

## Database Schema

8 tables + 4 enums: `users`, `businesses`, `services`, `call_logs`, `follow_ups`, `deals`, `business_services` (join), plus PostgreSQL enums `user_role`, `business_status`, `follow_up_status`, `deal_status`. UUID primary keys, timestamptz everywhere, foreign keys with cascade/set-null semantics, GIN-able search columns.

Migrations live in `backend/alembic/versions/`. Run `alembic revision --autogenerate -m "msg"` to create new ones.

## Deployment

### Frontend → Vercel
1. Push to GitHub, import the repo in Vercel
2. Root directory: `frontend`
3. Framework preset: Vite, Build: `pnpm build`, Output: `dist`
4. Add `VITE_API_URL` (Railway backend URL)

### Backend → Railway
1. New project → Deploy from GitHub → select `backend` root
2. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add env vars from the table above (`DATABASE_URL` → Supabase)
4. Run `alembic upgrade head` + `python -m app.seed` in a Railway shell (or CI step)

### Database → Supabase
1. Create a project, copy the connection string (Session pooler works from Railway)
2. Point `DATABASE_URL` at it (asyncpg driver is selected automatically)
3. Migrations run via Alembic

## Development Roadmap

- [x] Monorepo setup, backend core, auth, RBAC
- [x] Frontend shell, theme system, responsive layout
- [x] Businesses CRUD + list/detail + filters + search
- [x] Call logging, follow-ups, deals
- [ ] Dashboard & analytics UI
- [ ] Import/export polish, settings, user management
- [ ] Global search, animations, deploy config, CI/CD

## Future Improvements

- Real-time updates (WebSocket) for live call status / multi-agent sync
- Email thread logging per business
- Calendar view for follow-ups
- AI call summaries & next-best-action suggestions
- Lead scoring & automated reminder notifications (Slack/email)
- Kanban pipeline view for deals
- Audit trail (who changed what, when)
- SSO (Google Workspace) and mobile app

## License

Internal use. Proprietary.