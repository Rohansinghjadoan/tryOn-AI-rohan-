# Quick Start Guide - Testing TryOnAI Backend

## Prerequisites
- PostgreSQL installed and running
- Python 3.10+ installed
- Node.js 18+ installed

## 🚀 Quick Setup (5 minutes)

### Step 1: Database Setup
```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE tryonai;
\q
```

### Step 2: Backend Setup (Terminal 1)
```bash
# Navigate to backend
cd backend

# Windows: Run setup script
setup.bat

# After setup, activate environment and run
venv\Scripts\activate
cd app
python main.py
```

You should see:
```
INFO: Starting TryOnAI API...
INFO: Background cleanup task started
INFO: Uvicorn running on http://0.0.0.0:8000
```

### Step 3: Frontend Setup (Terminal 2)
```bash
# In project root, create env file
echo NEXT_PUBLIC_API_URL=http://localhost:8000/api > .env.local

# Run frontend
npm run dev
```

You should see:
```
✓ Ready in 2s
- Local: http://localhost:3000
```

## ✅ Testing the Integration

### 1. Open Browser
Navigate to: `http://localhost:3000`

### 2. Scroll to "Product Preview" Section
This is the interactive demo that connects to the backend.

### 3. Upload an Image
- Click "Select Image"
- Choose any photo (jpg, png, webp)
- Max 10MB

### 4. Click "Try On"
Watch the session flow:

**Step 1 (Instant):**
```
Status: "Session created, waiting for processing..."
```

**Step 2 (0-1 second):**
```
Status: "AI is processing your try-on..."
```

**Step 3 (After ~3 seconds):**
```
Status: "Try-on completed successfully!"
Output image appears
```

**Or (10% chance):**
```
Status: "Processing failed. Please try again."
Error: "Unable to detect person in image" (or similar)
```

### 5. Check Backend Logs
In your backend terminal, you'll see:
```
[abc-123] POST /api/tryon/sessions - Client: 127.0.0.1
Created session <uuid> for user user_<token>
Processing session <uuid>
Session state transition: created → processing
Session <uuid> completed successfully
[abc-123] Completed 201 in 0.234s
```

## 🧪 API Testing (Optional)

### Using API Docs (Interactive)

1. Open: `http://localhost:8000/api/docs`
2. Try the endpoints interactively
3. Upload images, check status

### Using curl

**Create Session:**
```bash
curl -X POST "http://localhost:8000/api/tryon/sessions" \
  -F "image=@photo.jpg" \
  -F "user_token=test_user_123"
```

Response:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "created",
  "message": "Session created successfully. Processing started."
}
```

**Check Status:**
```bash
curl "http://localhost:8000/api/tryon/sessions/550e8400-e29b-41d4-a716-446655440000"
```

Response (processing):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "output_image_url": null,
  "error_reason": null,
  "progress_message": "AI is processing your try-on..."
}
```

Response (completed):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "output_image_url": "/uploads/outputs/550e8400_output.jpg",
  "error_reason": null,
  "progress_message": "Try-on completed successfully!"
}
```

## 🔍 What to Observe

### 1. **Async Processing**
- API returns immediately (not blocking)
- Frontend polls for updates
- Background worker processes independently

### 2. **State Management**
- Session goes through states: created → processing → completed/failed
- Each transition is logged
- Status is queryable at any time

### 3. **Error Handling**
- ~10% of requests fail (mock simulation)
- Errors are graceful with clear messages
- Failed sessions don't crash the system

### 4. **File Management**
- Input images saved to `backend/uploads/inputs/`
- Output images saved to `backend/uploads/outputs/`
- Files accessible via `/uploads/` endpoint

### 5. **Privacy Compliance**
- Sessions expire after 24 hours
- Cleanup job runs every hour
- Files auto-delete with sessions

## 🗄️ Database Inspection

**View Sessions:**
```bash
psql -U postgres -d tryonai
SELECT id, user_token, status, created_at FROM tryon_sessions ORDER BY created_at DESC LIMIT 5;
```

**Check Expired Sessions:**
```sql
SELECT COUNT(*) FROM tryon_sessions WHERE expires_at < NOW();
```

## 📊 Monitoring

### Logs Location
- Backend: `backend/tryon_api.log`
- Console: Both terminals

### Key Log Events
```
✅ Session creation
✅ State transitions
✅ Processing completion/failure
✅ File operations
✅ Cleanup activities
✅ Error traces
```

## 🎯 Success Criteria

You should be able to:

- [x] Upload an image via frontend
- [x] See "Processing..." status
- [x] Get completed result or error
- [x] View session in database
- [x] See comprehensive logs
- [x] Access uploaded files
- [x] Observe state transitions

## 🐛 Troubleshooting

**Backend won't start:**
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Check if port 8000 is available
# Windows: netstat -ano | findstr :8000
# Mac/Linux: lsof -i :8000
```

**Frontend can't connect:**
```bash
# Verify .env.local exists
cat .env.local

# Should contain:
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**Database errors:**
```bash
# Verify database exists
psql -U postgres -l | grep tryonai

# Check DATABASE_URL in backend/.env
cat backend/.env
```

**File upload fails:**
```bash
# Check upload directory exists
ls backend/uploads/

# Create if missing
mkdir -p backend/uploads/inputs
mkdir -p backend/uploads/outputs
```

## 📚 Next Steps

1. **Explore API Docs**: `http://localhost:8000/api/docs`
2. **Check Database**: View sessions in PostgreSQL
3. **Read Logs**: Understand request flow
4. **Test Failures**: Upload invalid files
5. **Monitor Cleanup**: Wait an hour, check expired sessions

## 🎓 Understanding the Flow

```
User Action (Frontend)
    ↓
API Request (POST /api/tryon/sessions)
    ↓
Database: Create session (status=created)
    ↓
File Storage: Save input image
    ↓
Response: session_id (immediate)
    ↓
Background Worker: Pick up session
    ↓
Update: status=processing
    ↓
Mock AI: Sleep 3 seconds
    ↓
Generate: Output image or error
    ↓
Update: status=completed/failed
    ↓
Frontend Polling: GET /api/tryon/sessions/{id}
    ↓
Display: Result to user
```

**This is a real, production-grade async processing pipeline!**

---

**Happy Testing! 🚀**

If you see sessions flowing through states, you have a working production backend architecture.
