# TryOnAI

AI-powered virtual try-on for Indian fashion e-commerce brands.  
Customers upload one photo and see every product on themselves.

## Quick Start

### Backend (Terminal 1)

```bash
cd backend
./start.sh          # auto-installs deps, falls back to SQLite if no Postgres
```

API: http://localhost:8000 · Docs: http://localhost:8000/api/docs

### Frontend (Terminal 2)

```bash
cd frontend
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000/api' > .env.local
npm run dev
```

App: http://localhost:3000

## Project Structure

```
tryonai/
├── frontend/          ← Next.js 15 marketing site + interactive demo
│   ├── app/           ← Pages & layouts (App Router)
│   ├── components/    ← UI components & landing-page sections
│   └── lib/           ← API client & utilities
│
├── backend/           ← FastAPI async session-processing API
│   ├── app/
│   │   ├── routers/   ← HTTP endpoints
│   │   ├── services/  ← Storage, worker, cleanup
│   │   ├── middleware/ ← Request logging
│   │   ├── models.py  ← SQLAlchemy ORM
│   │   ├── schemas.py ← Pydantic validation
│   │   ├── crud.py    ← DB helpers
│   │   ├── database.py← Engine + session factory
│   │   └── config.py  ← Settings from .env
│   └── scripts/       ← DB bootstrap
│
└── ARCHITECTURE.md    ← Full system docs with diagrams
```

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for a deep dive into every layer.
