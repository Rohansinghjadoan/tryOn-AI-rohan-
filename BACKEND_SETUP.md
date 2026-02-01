# TryOnAI Backend Setup Guide

## Architecture Overview

Production-grade FastAPI backend with PostgreSQL for AI Virtual Try-On sessions.

### Key Features
- ✅ Session-based async architecture
- ✅ Background job processing (mock AI)
- ✅ Auto-cleanup for privacy compliance
- ✅ Request logging & observability
- ✅ Rate limiting & security
- ✅ AI-agnostic design (plug-in ready)

## Prerequisites

- Python 3.10+
- PostgreSQL 14+
- Node.js 18+ (for frontend)

## Backend Setup

### 1. Install PostgreSQL

**Windows:**
```bash
# Download from https://www.postgresql.org/download/windows/
# Or use chocolatey:
choco install postgresql
```

### 2. Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE tryonai;

# Exit
\q
```

### 3. Set Up Python Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/tryonai
```

### 5. Run Backend

```bash
# From backend directory
cd app
python main.py

# Or with uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at: `http://localhost:8000`
API docs at: `http://localhost:8000/api/docs`

## Frontend Setup

### 1. Add API URL to Environment

Create `.env.local` in the root directory:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 2. Run Frontend

```bash
# From project root
npm run dev
```

Frontend will run at: `http://localhost:3000`

## Testing the Integration

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend/app
   python main.py
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   npm run dev
   ```

3. **Open Browser**:
   - Navigate to `http://localhost:3000`
   - Scroll to "Product Preview" section
   - Upload an image
   - Click "Try On"
   - Watch the session flow: created → processing → completed

## Database Schema

### `tryon_sessions` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_token | VARCHAR(255) | Anonymous user ID |
| input_image_url | TEXT | Path to uploaded image |
| output_image_url | TEXT | Path to output image (nullable) |
| status | ENUM | created, processing, completed, failed |
| error_reason | TEXT | Error message if failed (nullable) |
| expires_at | TIMESTAMP | Auto-delete timestamp |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Indexes:**
- `id` (primary, UUID)
- `user_token`
- `status`
- `created_at`
- `expires_at`
- Composite: `(status, created_at)`
- Composite: `(expires_at, status)`

## API Endpoints

### POST `/api/tryon/sessions`
Create a new try-on session

**Request:**
- `image`: File (multipart/form-data)
- `user_token`: String (form field)

**Response:**
```json
{
  "session_id": "uuid",
  "status": "created",
  "message": "Session created successfully"
}
```

### GET `/api/tryon/sessions/{session_id}`
Get session status

**Response:**
```json
{
  "id": "uuid",
  "status": "processing",
  "output_image_url": null,
  "error_reason": null,
  "progress_message": "AI is processing your try-on..."
}
```

### GET `/api/health`
Health check endpoint

## Background Services

### 1. Session Processor (Worker)
- Picks up sessions with status `created`
- Simulates AI processing (3 seconds)
- Updates status to `completed` or `failed`
- Generates mock output image

### 2. Cleanup Service
- Runs every hour (configurable)
- Finds sessions past `expires_at`
- Deletes files from storage
- Removes database records
- **Privacy Compliance**: "Auto-delete photos" claim

## Observability

### Logging
All logs written to:
- `tryon_api.log` (file)
- Console output

**Log Categories:**
- Request/Response (with request ID)
- Session state transitions
- Errors with stack traces
- File operations
- Cleanup activities

### Monitoring Request Flow
Each request gets a unique ID:
```
[abc-123] POST /api/tryon/sessions - Client: 127.0.0.1
[abc-123] Completed 201 in 0.234s
```

## Security Features

### 1. Rate Limiting
- 10 requests per minute per IP (configurable)
- Uses `slowapi` library

### 2. File Validation
- Max size: 10MB
- Allowed types: jpg, jpeg, png, webp
- Image verification with PIL

### 3. CORS
- Configured for localhost:3000
- Production: Update in `main.py`

### 4. Short-lived URLs
- Files auto-delete after 24 hours
- No permanent storage

## Future AI Integration

To plug in real AI:

1. **Modify `app/services/worker.py`**:
   ```python
   async def process_session(self, session_id: uuid.UUID):
       # Replace mock processing with:
       result = await your_ai_model.process(input_image)
   ```

2. **No API changes needed**
3. **No database changes needed**
4. **Frontend works as-is**

The architecture is **AI-agnostic** by design.

## Troubleshooting

### Database Connection Error
```
Check DATABASE_URL in .env
Ensure PostgreSQL is running
Verify credentials
```

### Upload Directory Error
```
Ensure uploads/ directory exists
Check write permissions
```

### Port Already in Use
```
# Change port in .env
PORT=8001
```

## Production Deployment

### Backend (Render/Railway/Heroku)
1. Set environment variables
2. Use production PostgreSQL (e.g., Supabase, Railway)
3. Set `DEBUG=False`
4. Use production CORS origins
5. Set up file storage (S3, Cloudinary)

### Frontend (Vercel)
1. Set `NEXT_PUBLIC_API_URL` to production backend
2. Deploy normally with `vercel`

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Settings
│   ├── database.py          # DB connection
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── crud.py              # Database operations
│   ├── routers/
│   │   └── tryon.py         # API endpoints
│   ├── services/
│   │   ├── storage.py       # File handling
│   │   ├── worker.py        # Background processor
│   │   └── cleanup.py       # Privacy cleanup
│   └── middleware/
│       └── logging.py       # Request logging
├── uploads/                 # Storage (gitignored)
├── requirements.txt
└── .env
```

## Status

✅ **Production-Ready Backend**
- Session-based architecture
- Async processing
- Privacy compliance
- Full observability
- AI plug-in ready

Ready for real AI model integration!
