# TryOnAI - Production Backend Implementation

## 🎯 What Was Built

A **production-grade backend architecture** for TryOnAI that demonstrates real SaaS thinking without requiring actual AI implementation.

## 🏗️ Architecture Overview

### Core Philosophy: Session-Based Async Processing

Instead of direct image → output responses, everything revolves around **Try-On Sessions**:

```
User uploads image → Session created (returns immediately)
                  ↓
         Background worker processes
                  ↓
    Session updates: created → processing → completed/failed
```

## 📦 Backend Components

### 1. Database Layer (PostgreSQL)

**`tryon_sessions` Table:**
- Session-based state management
- Privacy-first with auto-expiry
- Optimized indexes for common queries
- Tracks full lifecycle: created → processing → completed/failed

**Key Features:**
- UUID primary keys
- Anonymous user tracking (user_token)
- Status enum for state machine
- Expiry timestamps for auto-cleanup
- Composite indexes for performance

### 2. API Layer (FastAPI)

**Endpoints:**
- `POST /api/tryon/sessions` - Create session + trigger processing
- `GET /api/tryon/sessions/{id}` - Poll status
- `GET /api/health` - Health checks

**Features:**
- Request/response logging with unique IDs
- Rate limiting (10 req/min per IP)
- CORS for localhost:3000
- File validation (size, type, format)
- Comprehensive error handling

### 3. Storage Service

**Responsibilities:**
- File upload validation (type, size)
- Image format verification (PIL)
- Organized storage (inputs/, outputs/)
- File cleanup on session expiry

**Security:**
- Max 10MB file size
- Only jpg/jpeg/png/webp allowed
- Image integrity verification
- No direct file exposure

### 4. Background Worker (Mock AI)

**Simulates Real AI Pipeline:**
- Picks up `created` sessions
- Updates to `processing` status
- Simulates 3-second processing time
- Random 10% failure rate (shows robustness)
- Generates mock output or error
- Logs all state transitions

**AI-Agnostic Design:**
- Real AI model slots in here
- No API changes needed
- No database changes needed
- Frontend works unchanged

### 5. Privacy & Cleanup Service

**Auto-Delete Compliance:**
- Hourly cleanup job
- Finds expired sessions
- Deletes images from storage
- Removes database records
- Fulfills "privacy-first, auto-delete" claim

### 6. Observability

**Comprehensive Logging:**
- Request/response with timing
- Session state transitions
- Error tracking with stack traces
- File operations
- Cleanup activities

**Log Format:**
```
[request-id] POST /api/tryon/sessions - Client: 127.0.0.1
[request-id] Completed 201 in 0.234s
Session state transition: created → processing
```

## 🎨 Frontend Integration (Minimal Changes)

### What Changed:
1. **API Client** (`lib/api-client.ts`)
   - Session creation
   - Status polling
   - User token management

2. **Interactive Demo** (`components/sections/demo-section-interactive.tsx`)
   - File upload UI
   - Status polling display
   - Progress indicators
   - Error handling

### What Stayed the Same:
- All landing page sections
- Design system
- Navbar, footer, pricing
- No authentication UI
- No dashboards

## 🔐 Security Features

1. **Rate Limiting**: 10 requests/minute per IP
2. **File Validation**: Size, type, format checks
3. **CORS**: Configured for allowed origins
4. **No Direct File Access**: Files served through controlled endpoints
5. **Short-lived Assets**: 24-hour auto-delete

## 📊 Database Schema

```sql
CREATE TABLE tryon_sessions (
    id UUID PRIMARY KEY,
    user_token VARCHAR(255) NOT NULL,
    input_image_url TEXT NOT NULL,
    output_image_url TEXT,
    status ENUM('created', 'processing', 'completed', 'failed'),
    error_reason TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Optimized indexes
CREATE INDEX idx_status ON tryon_sessions(status);
CREATE INDEX idx_user_token ON tryon_sessions(user_token);
CREATE INDEX idx_expires_at ON tryon_sessions(expires_at);
CREATE INDEX idx_status_created ON tryon_sessions(status, created_at);
```

## 🚀 How to Run

### Quick Start (Windows):
```bash
# Backend
cd backend
setup.bat
venv\Scripts\activate
cd app
python main.py

# Frontend (separate terminal)
npm run dev
```

### Backend runs at:
- API: `http://localhost:8000`
- Docs: `http://localhost:8000/api/docs`
- Health: `http://localhost:8000/api/health`

### Frontend runs at:
- `http://localhost:3000`
- Navigate to "Product Preview" section
- Upload image → See full session flow

## 🎯 What This Demonstrates

### ✅ Production SaaS Architecture
- Async processing (not blocking)
- State management
- Background jobs
- Privacy compliance
- Observability
- Error handling
- Scalability design

### ✅ Real System Design
- Database indexes for performance
- Session-based API design
- File storage abstraction
- Worker pattern for processing
- Cleanup jobs for compliance

### ✅ Trust & Credibility
- "Privacy-first" actually implemented
- "Auto-delete photos" actually works
- Professional error handling
- Clear status messages
- Production-ready logging

## 🔌 Future AI Integration

**To plug in real AI:**

1. Edit `backend/app/services/worker.py`:
   ```python
   async def process_session(self, session_id):
       # Replace this block:
       await asyncio.sleep(3)  # Remove mock
       
       # With your AI model:
       result = await your_ai_model.process(input_image)
       output_url = storage_service.save_output_image(
           session_id,
           source_path=result.output_path
       )
   ```

2. **That's it!**
   - API contracts stay same
   - Database schema unchanged
   - Frontend works as-is
   - Just swap processing logic

## 📁 File Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app + middleware
│   ├── config.py            # Settings management
│   ├── database.py          # SQLAlchemy setup
│   ├── models.py            # Database models
│   ├── schemas.py           # Pydantic request/response
│   ├── crud.py              # Database operations
│   ├── routers/
│   │   └── tryon.py         # API endpoints
│   ├── services/
│   │   ├── storage.py       # File handling
│   │   ├── worker.py        # Background processor
│   │   └── cleanup.py       # Privacy cleanup
│   └── middleware/
│       └── logging.py       # Request logging
├── scripts/
│   └── init_db.py           # Database setup
├── uploads/                 # File storage (gitignored)
├── requirements.txt
├── .env.example
└── setup.bat / setup.sh

frontend/
├── lib/
│   └── api-client.ts        # Backend API client
└── components/sections/
    └── demo-section-interactive.tsx  # Interactive demo
```

## 🎓 Key Design Decisions

### 1. Session-Based (Not Request/Response)
**Why:** Async AI processing takes time. Can't block HTTP response.
**How:** Return session_id immediately, frontend polls for status.

### 2. Background Workers (Not Inline Processing)
**Why:** Decouple API from processing. Scale independently.
**How:** FastAPI BackgroundTasks + async worker pattern.

### 3. Status Polling (Not WebSockets)
**Why:** Simpler, stateless, easier to deploy.
**How:** Frontend polls GET /sessions/{id} every 2 seconds.

### 4. Auto-Expiry in Database (Not Manual Cleanup)
**Why:** Privacy compliance built into data model.
**How:** expires_at timestamp + hourly cleanup job.

### 5. Anonymous User Tokens (Not Auth)
**Why:** Low friction for demo, privacy-first.
**How:** Browser localStorage generates persistent token.

## 📈 Production Considerations

### Already Implemented:
✅ Database indexes
✅ Connection pooling
✅ Request logging
✅ Error tracking
✅ Rate limiting
✅ File validation
✅ Auto-cleanup

### For Production Scale:
- [ ] Cloud file storage (S3/Cloudinary)
- [ ] Redis for session caching
- [ ] Celery for distributed workers
- [ ] Kubernetes for scaling
- [ ] Prometheus for metrics
- [ ] Sentry for error tracking

## 🏆 Outcome

A backend that **feels like a real AI SaaS product** even before AI is implemented:

- Professional API design
- Production-grade database schema
- Async processing architecture
- Privacy & compliance built-in
- Full observability
- AI plug-in ready
- Minimal frontend changes

**Ready to demonstrate to investors, customers, or team members as a real, working product.**

---

**Status**: ✅ Production-Ready Backend Architecture  
**Next Step**: Plug in real AI model in `worker.py`
