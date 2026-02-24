# TryOnAI — Architecture & Codebase Guide

> **Purpose:** Give any engineer (or your future self) a complete mental model of
> how TryOnAI works — from the first click on the landing page to the final
> try-on result stored on disk.

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Repository Layout](#2-repository-layout)
3. [Frontend — Next.js 15](#3-frontend--nextjs-15)
4. [Backend — FastAPI](#4-backend--fastapi)
5. [Data Flow — End to End](#5-data-flow--end-to-end)
6. [Database Schema](#6-database-schema)
7. [API Contract](#7-api-contract)
8. [Background Services](#8-background-services)
9. [File Storage](#9-file-storage)
10. [Configuration & Environment](#10-configuration--environment)
11. [Deployment Guide](#11-deployment-guide)
12. [Future AI Integration](#12-future-ai-integration)

---

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                           │
│  Lands on marketing site → uploads 2 images → sees try-on      │
└──────────────┬──────────────────────────────────┬───────────────┘
               │  Next.js SSR / CSR               │ REST API calls
               ▼                                  ▼
┌──────────────────────┐        ┌──────────────────────────────────┐
│   FRONTEND (Next.js) │        │       BACKEND (FastAPI)          │
│                      │  HTTP  │                                  │
│  • Marketing pages   │◄──────►│  POST /api/tryon/sessions        │
│  • Interactive demo  │        │  GET  /api/tryon/sessions/:id    │
│  • Theme toggle      │        │  GET  /api/health                │
│  • API client        │        │                                  │
└──────────────────────┘        │  ┌────────────┐ ┌─────────────┐ │
                                │  │  Worker     │ │  Cleanup    │ │
                                │  │  (mock AI)  │ │  (hourly)   │ │
                                │  └──────┬─────┘ └──────┬──────┘ │
                                │         │              │        │
                                │    ┌────▼──────────────▼────┐   │
                                │    │  PostgreSQL / SQLite   │   │
                                │    └────────────────────────┘   │
                                │    ┌────────────────────────┐   │
                                │    │  Local file storage    │   │
                                │    │  uploads/{users,       │   │
                                │    │    garments, outputs}  │   │
                                │    └────────────────────────┘   │
                                └──────────────────────────────────┘
```

**Core idea:** The backend never blocks on AI. It creates a *session* instantly,
returns its ID, and a background worker processes the images asynchronously.
The frontend polls until the session reaches `completed` or `failed`.

---

## 2. Repository Layout

```
tryonai/
│
├── README.md                ← Quick-start & project overview
├── ARCHITECTURE.md          ← This document
├── .gitignore
│
├── frontend/                ← Next.js 15 (App Router) + Tailwind + shadcn/ui
│   ├── app/
│   │   ├── layout.tsx       ← Root layout: font, ThemeProvider
│   │   ├── page.tsx         ← Landing page — composes all sections
│   │   └── globals.css      ← CSS variables (light/dark) + Tailwind base
│   │
│   ├── components/
│   │   ├── navbar.tsx       ← Sticky nav with scroll effect
│   │   ├── footer.tsx       ← Footer with contact email
│   │   ├── theme-provider.tsx  ← next-themes wrapper
│   │   ├── theme-toggle.tsx    ← Light / dark switch
│   │   ├── ui/              ← shadcn/ui primitives (Button, Card)
│   │   └── sections/        ← One file per landing-page section
│   │       ├── hero-section.tsx
│   │       ├── who-this-is-for-section.tsx
│   │       ├── what-this-is-section.tsx
│   │       ├── how-it-works-section.tsx
│   │       ├── features-section.tsx
│   │       ├── demo-section-interactive.tsx   ← ★ connects to backend
│   │       ├── how-brands-integrate-section.tsx
│   │       ├── pricing-section.tsx
│   │       ├── disclaimer-section.tsx
│   │       └── cta-section.tsx
│   │
│   ├── lib/
│   │   ├── api-client.ts   ← TryOnAPIClient: session create, poll, token
│   │   └── utils.ts        ← cn() helper (clsx + tailwind-merge)
│   │
│   ├── package.json
│   ├── tsconfig.json        ← Path alias: @/* → ./*
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── next.config.ts
│   └── .eslintrc.json
│
└── backend/                 ← FastAPI + SQLAlchemy + Pillow
    ├── run.py               ← uvicorn entry point
    ├── requirements.txt
    ├── setup.sh             ← One-time: venv + deps + DB init
    ├── start.sh             ← Quick start (venv + deps + run)
    ├── .env.example         ← All env vars with docs
    ├── .gitignore
    │
    ├── app/
    │   ├── __init__.py
    │   ├── main.py          ← FastAPI app, middleware, lifecycle
    │   ├── config.py        ← Pydantic Settings from .env
    │   ├── database.py      ← Engine, SessionLocal, PG→SQLite fallback
    │   ├── models.py        ← TryOnSession ORM model
    │   ├── schemas.py       ← Pydantic request/response schemas
    │   ├── crud.py          ← DB read/write helpers
    │   │
    │   ├── routers/
    │   │   ├── __init__.py
    │   │   └── tryon.py     ← POST /sessions, GET /sessions/:id
    │   │
    │   ├── services/
    │   │   ├── __init__.py
    │   │   ├── storage.py   ← Save / validate / delete images
    │   │   ├── worker.py    ← Mock AI background processor
    │   │   └── cleanup.py   ← Hourly expired-session reaper
    │   │
    │   └── middleware/
    │       ├── __init__.py
    │       └── logging.py   ← Request-ID + timing middleware
    │
    └── scripts/
        ├── __init__.py
        └── init_db.py       ← Standalone table creation
```

---

## 3. Frontend — Next.js 15

### Tech Stack

| Layer       | Tool                       |
|-------------|----------------------------|
| Framework   | Next.js 15 (App Router)    |
| Language    | TypeScript                 |
| Styling     | Tailwind CSS 3             |
| Components  | shadcn/ui (Button, Card)   |
| Theming     | next-themes                |
| Icons       | Lucide React               |
| Font        | Inter (Google Fonts)       |

### Page Composition

```
page.tsx
  ├── <Navbar />
  ├── <HeroSection />
  ├── <WhoThisIsForSection />
  ├── <WhatThisIsSection />
  ├── <HowItWorksSection />
  ├── <FeaturesSection />
  ├── <DemoSection />               ← interactive demo (connects to API)
  ├── <HowBrandsIntegrateSection />
  ├── <PricingSection />            ← INR pricing: ₹2,999 / ₹5,999 / ₹9,999
  ├── <DisclaimerSection />
  ├── <CTASection />
  └── <Footer />
```

### Interactive Demo Flow (demo-section-interactive.tsx)

```
┌─────────────────────────────────────────────────────────────────┐
│                     "Product Preview"                           │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  User Photo  │  │   Garment   │  │   Result    │            │
│  │             │  │             │  │             │            │
│  │ [Upload]    │  │ [Upload]    │  │ [Try On]    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  Status bar:  "AI is processing your try-on…"                  │
└─────────────────────────────────────────────────────────────────┘
```

1. User picks a **user photo** (left) and a **garment image** (center).
2. Clicks **Try On** → `TryOnAPIClient.createSession(userImg, garmentImg, token)`.
3. Frontend polls `GET /api/tryon/sessions/:id` every 2 s.
4. On `completed` → output image URL is shown in the right panel.
5. On `failed` → error message displayed.

### API Client (lib/api-client.ts)

```
TryOnAPIClient
  ├── .createSession(userImage, garmentImage, userToken) → { session_id }
  ├── .getSessionStatus(sessionId) → { status, output_image_url, … }
  ├── .pollSessionStatus(sessionId, onProgress, maxAttempts, interval)
  ├── .generateUserToken()     ← persisted in localStorage
  └── .getImageURL(relative)   ← prepends NEXT_PUBLIC_API_URL base
```

---

## 4. Backend — FastAPI

### Tech Stack

| Layer       | Tool                          |
|-------------|-------------------------------|
| Framework   | FastAPI 0.115                 |
| ORM         | SQLAlchemy 2.0               |
| Validation  | Pydantic v2                   |
| DB          | PostgreSQL 14+ / SQLite (dev) |
| Images      | Pillow                        |
| Rate Limit  | SlowAPI                       |
| Server      | Uvicorn                       |

### Startup Sequence

```
run.py
  └── uvicorn → app.main:app
        │
        ├── create_database_engine()      # try PG, fallback SQLite
        ├── mkdir uploads/
        ├── mount middleware (CORS, logging)
        ├── mount /uploads static files
        ├── include /api/tryon router
        │
        └── @app.on_event("startup")
              ├── initialize_database()   # CREATE TABLE IF NOT EXISTS
              └── asyncio.create_task(cleanup_expired_sessions)
```

### Module Dependency Graph

```
config.py          ← reads .env
    │
    ▼
database.py        ← creates engine + SessionLocal
    │
    ▼
models.py          ← TryOnSession ORM (uses Base from database.py)
    │
    ▼
schemas.py         ← Pydantic models (references SessionStatus from models.py)
    │
    ▼
crud.py            ← pure DB queries (uses models + Session)
    │
    ▼
services/
  ├── storage.py   ← file I/O (uses config for upload_dir)
  ├── worker.py    ← uses crud + storage
  └── cleanup.py   ← uses crud + storage
    │
    ▼
routers/tryon.py   ← HTTP layer (uses crud, storage, worker, schemas)
    │
    ▼
main.py            ← wires everything together
```

---

## 5. Data Flow — End to End

```
                         FRONTEND                           BACKEND
                        ──────────                        ──────────

 1. User picks 2 images
       │
 2. Click "Try On"
       │
 3. POST /api/tryon/sessions ────────────────────►  create row (status=CREATED)
    { user_image, garment_image, user_token }       save files to uploads/
       │                                            return { session_id }
       │                                                  │
 4. Receive session_id ◄─────────────────────────────────┘
       │                                            BackgroundTask ──►  worker
       │                                                                  │
 5. Poll every 2s                                        5a. set PROCESSING
    GET /sessions/:id ──────────────►  return current     5b. sleep 3s (mock)
       │                               status             5c. save output image
       │                                                  5d. set COMPLETED
       │◄────────────── { status: "processing" }              or FAILED
       │
       │◄────────────── { status: "completed",
       │                   output_image_url: "…" }
       │
 6. Display output image
```

### State Machine

```
             ┌──────────┐
             │ CREATED  │
             └────┬─────┘
                  │  worker picks up
                  ▼
             ┌──────────┐
             │PROCESSING│
             └────┬─────┘
                  │
          ┌───────┴────────┐
          ▼                ▼
    ┌──────────┐    ┌──────────┐
    │COMPLETED │    │  FAILED  │
    └──────────┘    └──────────┘
```

---

## 6. Database Schema

### Table: `tryon_sessions`

| Column             | Type          | Notes                              |
|--------------------|---------------|------------------------------------|
| `id`               | UUID (PK)     | Default: uuid4                     |
| `user_token`       | VARCHAR(255)  | Anonymous identifier from browser  |
| `user_image_url`   | TEXT          | `/uploads/users/<id>_user.jpg`     |
| `garment_image_url`| TEXT          | `/uploads/garments/<id>_garment.jpg` |
| `output_image_url` | TEXT (null)   | `/uploads/outputs/<id>_output.jpg` |
| `status`           | ENUM          | created / processing / completed / failed |
| `error_reason`     | TEXT (null)   | Populated on failure               |
| `expires_at`       | DATETIME      | `created_at + 24 h`               |
| `created_at`       | DATETIME      | Auto-set                           |
| `updated_at`       | DATETIME      | Auto-updated                       |

### Indexes

| Name                  | Columns                  | Purpose                          |
|-----------------------|--------------------------|----------------------------------|
| PK                    | `id`                     | Lookup by session ID             |
| idx_user_token        | `user_token`             | List sessions per anonymous user |
| idx_status            | `status`                 | Worker: find CREATED sessions    |
| idx_status_created    | `status, created_at`     | Worker: oldest first             |
| idx_expires_status    | `expires_at, status`     | Cleanup: find expired rows       |

### PostgreSQL → SQLite Fallback

On startup the backend tries PostgreSQL. If it fails (wrong password, PG not
running, etc.) it falls back to a local `dev.db` SQLite file with a clear
warning in the logs. The SQLite path also auto-detects schema mismatches and
rebuilds tables — this is safe because it only runs for `sqlite` in dev.

---

## 7. API Contract

### `POST /api/tryon/sessions`

Create a session and start background processing.

| Field          | In       | Type   | Required |
|----------------|----------|--------|----------|
| `user_image`   | FormData | File   | ✅       |
| `garment_image`| FormData | File   | ✅       |
| `user_token`   | FormData | string | ✅       |

**Response 201:**
```json
{
  "session_id": "550e8400-…",
  "status": "created",
  "message": "Session created. Processing started."
}
```

### `GET /api/tryon/sessions/{session_id}`

Poll session status.

**Response 200:**
```json
{
  "id": "550e8400-…",
  "status": "completed",
  "output_image_url": "https://backend.example.com/uploads/outputs/550e8400_output.jpg",
  "error_reason": null,
  "progress_message": "Try-on completed successfully!"
}
```

### `GET /api/tryon/sessions/{session_id}/details`

Full session info (admin / debugging).

### `GET /api/health`

```json
{
  "status": "healthy",
  "database": { "type": "postgresql", "connected": true, "warning": null },
  "version": "1.0.0"
}
```

### File Validation

- Max size: **10 MB**
- Allowed types: `jpg`, `jpeg`, `png`, `webp`
- Verified with Pillow (`img.verify()`)

### Rate Limiting

`10 requests / minute` per IP (via SlowAPI).

---

## 8. Background Services

### Worker (`services/worker.py`)

```
BackgroundTask → worker.process_session(session_id)
  1. Open a fresh DB session
  2. Set status = PROCESSING
  3. Sleep 3 s (mock AI)
  4. 10 % chance → FAILED with random error message
  5. 90 % chance → copy user photo as output → COMPLETED
  6. Close DB session
```

**To plug in real AI:** replace step 3–5 with your model call.
Everything else (API, DB, frontend) stays the same.

### Cleanup (`services/cleanup.py`)

```
Infinite loop (runs every CLEANUP_INTERVAL_HOURS):
  1. Query sessions where expires_at < now()
  2. For each: delete user, garment, output files from disk
  3. Delete DB row
```

This fulfils the "photos auto-delete after 24 h" privacy claim.

---

## 9. File Storage

```
backend/uploads/
├── users/          ← {session_id}_user.{ext}
├── garments/       ← {session_id}_garment.{ext}
└── outputs/        ← {session_id}_output.jpg
```

- Files are served at `/uploads/…` via FastAPI `StaticFiles`.
- The router converts relative paths to absolute URLs using the request's
  `base_url`, so it works both on localhost and behind a reverse proxy.
- For production, swap this with S3 / Cloudinary.

---

## 10. Configuration & Environment

All config lives in `backend/.env` (loaded by Pydantic Settings).

| Variable                     | Default                                | Notes                        |
|------------------------------|----------------------------------------|------------------------------|
| `DATABASE_URL`               | `postgresql://postgres:postgres@localhost:5432/tryonai` | Falls back to SQLite if PG fails |
| `UPLOAD_DIR`                 | `./uploads`                            |                              |
| `MAX_FILE_SIZE_MB`           | `10`                                   |                              |
| `SESSION_EXPIRY_HOURS`       | `24`                                   | When files auto-delete       |
| `CLEANUP_INTERVAL_HOURS`     | `1`                                    |                              |
| `MOCK_AI_PROCESSING_SECONDS` | `3`                                    | Simulate AI latency          |
| `MOCK_AI_FAILURE_RATE`       | `0.1`                                  | 10 % random failures         |
| `RATE_LIMIT_PER_MINUTE`      | `10`                                   |                              |
| `HOST`                       | `0.0.0.0`                              |                              |
| `PORT`                       | `8000`                                 |                              |
| `DEBUG`                      | `True`                                 | Enables uvicorn `--reload`   |

Frontend uses one env var:

| Variable              | Default                        |
|-----------------------|--------------------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api`    |

---

## 11. Deployment Guide

### Frontend → Vercel

```bash
cd frontend
vercel --prod
# Set env: NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

### Backend → Render / Railway

1. Set `DATABASE_URL` to a managed PostgreSQL instance.
2. Set `DEBUG=False`.
3. Update CORS origins in `main.py`.
4. Start command: `cd backend && python run.py`.
5. Add persistent disk or switch `UPLOAD_DIR` to S3.

---

## 12. Future AI Integration

The architecture is **AI-agnostic by design**. The only file that needs
changing is `backend/app/services/worker.py`:

```python
# Current (mock)
time.sleep(3)
output_url = storage_service.save_output_image(session_id, source_path=session.user_image_url)

# Future (real)
result = your_model.try_on(
    user_image=storage_service.get_path(session.user_image_url),
    garment_image=storage_service.get_path(session.garment_image_url),
)
output_url = storage_service.save_output_image(session_id, source_path=result.path)
```

**Nothing else changes** — the API contract, database schema, frontend polling,
and cleanup logic all remain identical.

---

## Summary

| Concern              | Where it lives                              |
|----------------------|---------------------------------------------|
| Marketing site       | `frontend/components/sections/`             |
| Interactive demo     | `frontend/components/sections/demo-section-interactive.tsx` |
| API client           | `frontend/lib/api-client.ts`                |
| HTTP endpoints       | `backend/app/routers/tryon.py`              |
| Business logic       | `backend/app/services/worker.py`            |
| Database layer       | `backend/app/database.py` + `models.py` + `crud.py` |
| File handling        | `backend/app/services/storage.py`           |
| Privacy / cleanup    | `backend/app/services/cleanup.py`           |
| Config               | `backend/app/config.py` + `.env`            |
| Logging / observability | `backend/app/middleware/logging.py`       |
