# TryOnAI Backend - Changelog

## [Unreleased] - 2026-02-01

### Added - Two-Image Upload Feature

#### Overview
Enhanced the demo to accept TWO images instead of one, making it more realistic for brands testing the product:
- **User Photo**: Customer photo (uploaded by end-user)
- **Garment Image**: Product catalog image (from brand's inventory)

This mirrors real production flow where user photos come from customers and garment images come from the brand's product catalog.

#### Backend Changes

**Database Model** (`app/models.py`)
- Added `user_image_url` column (customer photo)
- Added `garment_image_url` column (product catalog image)
- Removed `input_image_url` column (replaced by the two above)
- Added backward compatibility property for `input_image_url` (returns `user_image_url`)

**API Schemas** (`app/schemas.py`)
- Updated `TryOnSessionResponse` to include both `user_image_url` and `garment_image_url`
- Removed `input_image_url` from response schema

**API Endpoint** (`app/routers/tryon.py`)
- Changed `POST /api/tryon/sessions` to accept TWO file uploads:
  - `user_image`: User photo (customer)
  - `garment_image`: Garment image (product catalog)
- Updated endpoint logic to save both images separately
- Enhanced logging to show both image URLs

**CRUD Operations** (`app/crud.py`)
- Updated `create_session()` to accept both `user_image_url` and `garment_image_url` parameters

**Storage Service** (`app/services/storage.py`)
- Renamed `input_dir` → `user_dir` (uploads/users/)
- Added `garment_dir` (uploads/garments/)
- Renamed `save_input_image()` → `save_user_image()`
- Added `save_garment_image()` method
- Both methods follow same validation and storage patterns

**Background Worker** (`app/services/worker.py`)
- Updated to log both user and garment image URLs
- Still generates mock output using user image as base
- Enhanced logging: Shows both images in processing logs

#### Frontend Changes

**Demo Section** (`components/sections/demo-section-interactive.tsx`)
- Changed from 2-column layout (input → output) to 3-column layout:
  1. User Photo
  2. Garment Image
  3. Try-On Result
- Added separate upload fields for each image type
- Updated validation to require BOTH images before processing
- Enhanced UI labels: "Customer photo" and "Product catalog"
- Updated "Start Over" button to reset both images

**API Client** (`lib/api-client.ts`)
- Updated `createSession()` to accept both `userImage` and `garmentImage` parameters
- Changed FormData to send `user_image` and `garment_image` fields

#### Directory Structure

**Before:**
```
uploads/
├── inputs/          # Single input images
└── outputs/         # Generated outputs
```

**After:**
```
uploads/
├── users/           # User photos (customers)
├── garments/        # Garment images (product catalog)
└── outputs/         # Generated try-on results
```

#### Migration Notes

- **Database**: Old SQLite database automatically recreated with new schema
- **Backward Compatibility**: `input_image_url` property available on model for old code
- **File Naming**: 
  - User images: `{session_id}_user.{ext}`
  - Garment images: `{session_id}_garment.{ext}`
  - Output images: `{session_id}_output.jpg` (unchanged)

#### API Changes

**Request (Old):**
```
POST /api/tryon/sessions
FormData:
  - image: File
  - user_token: string
```

**Request (New):**
```
POST /api/tryon/sessions
FormData:
  - user_image: File      # Customer photo
  - garment_image: File   # Product catalog
  - user_token: string
```

**Response (Old):**
```json
{
  "id": "uuid",
  "status": "created",
  "input_image_url": "/uploads/inputs/...",
  "output_image_url": null
}
```

**Response (New):**
```json
{
  "id": "uuid",
  "status": "created",
  "user_image_url": "/uploads/users/...",
  "garment_image_url": "/uploads/garments/...",
  "output_image_url": null
}
```

#### Testing

1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Start frontend: `npm run dev`
3. Open http://localhost:3000
4. Upload BOTH images in the demo section
5. Click "Try On" and verify:
   - Both images saved to correct directories
   - Worker logs show both image URLs
   - Output image generated correctly
   - Result displayed in third column

#### Benefits

- **More Realistic**: Mirrors actual production flow for brands
- **Better Demo**: Shows real-world use case (customer + product catalog)
- **Clearer Intent**: Separates user input from brand assets
- **Scalable**: Prepared for future features like garment-specific processing
