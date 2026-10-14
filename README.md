# Vision Segmentation Service - Take-Home Assignment

> **Complete REST API implementation for managing segmentation masks in AI annotation tools**
> 
> **Tech Stack**: Node.js, TypeScript, Express, MongoDB  
> **Assignment Focus**: Architecture, backend system design, and REST API implementation

## Assignment Overview

This system implements the backend APIs for a hypothetical web interface that manages data annotation projects using segmentation masks, powered by Meta's Segment Anything tool. The system enables clients to:

- Create annotation projects and upload datasets
- Store and retrieve segmentation masks with multiple format support (RLE, Polygon, Bitmap)
- Calculate relative area rankings for annotations within images
- Track project progress and annotation team workflow

## Core Requirements Implementation

**1. Save annotations** - `POST /api/annotations`  
**2. Retrieve annotations by ID** - `GET /api/annotations/{id}`  
**2. Retrieve annotations by label** - `GET /api/annotations/by-label/{label}`  
**2. Retrieve annotations by annotator** - `GET /api/annotations/by-annotator/{annotatorId}`  
**3. Area ranking calculation** - `GET /api/images/{imageId}/annotations/rankings`

## Features

- ✅ **Save annotations** with segmentation masks
- ✅ **Retrieve annotations** by ID, label, or annotator
- ✅ **Calculate relative area rankings** for annotations within images
- ✅ **Project management** for organizing annotation work
- ✅ **Image management** with metadata tracking
- ✅ **Progress tracking** for projects and images
- ✅ **Multiple mask formats** (RLE, Polygon, Bitmap)

## Quick Start for Evaluation Engineers

### Prerequisites
- Node.js 20+
- MongoDB (local installation or MongoDB Atlas)
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd vision-segmentation-service
npm install
```

### 2. Database Setup Options

**Option A: Local MongoDB (Default)**
```bash
# Install MongoDB locally (macOS)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Option B: MongoDB Atlas (Recommended for Production)**
1. Create a free MongoDB Atlas cluster
2. Update `.env` file:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/perle_segmentation
```

### 3. Build and Run
```bash
npm run build
npm run dev  # Development mode with hot reload
```

### 4. Populate Test Data
```bash
npm run seed  # Creates sample projects, images, and annotations
```

### 5. API Testing
- **Postman Collection**: Import `Vision_Segmentation_Service_API.postman_collection.json`
- **Health Check**: `curl http://localhost:3000/health`
- **Core Feature**: `curl http://localhost:3000/api/images/{imageId}/annotations/rankings`

## API Endpoints

### Core Annotation Endpoints

#### Create Annotation
```http
POST /api/annotations
Content-Type: application/json

{
  "image_id": "64f123...",
  "project_id": "64f456...", 
  "annotator_id": "64f789...",
  "label": "person",
  "mask": {
    "format": "polygon",
    "data": {
      "exterior": [[100, 200], [150, 200], [150, 250], [100, 250]],
      "holes": []
    },
    "width": 800,
    "height": 600
  },
  "confidence": 0.95,
  "status": "completed"
}
```

#### Get Annotation by ID
```http
GET /api/annotations/{id}
```

#### Get Annotation with Area Rank
```http
GET /api/annotations/{id}/rank
```

#### Get Annotations by Label
```http
GET /api/annotations/by-label/{label}
```

#### Get Annotations by Annotator
```http
GET /api/annotations/by-annotator/{annotatorId}
```

#### Search Annotations
```http
GET /api/annotations/search?label=person&status=completed&project_id={projectId}
```

#### Get Area Rankings for Image
```http
GET /api/images/{imageId}/annotations/rankings
```

### Project Management

#### Create Project
```http
POST /api/projects
Content-Type: application/json

{
  "name": "Wildlife Detection Project",
  "description": "Annotate animals in wildlife photos",
  "created_by": "64f123...",
  "annotators": ["64f456...", "64f789..."]
}
```

#### Get All Projects
```http
GET /api/projects
```

#### Get Project Progress
```http
GET /api/projects/{id}/progress
```

#### Get Project Images
```http
GET /api/projects/{id}/images
```

### Image Management

#### Add Image to Project
```http
POST /api/images
Content-Type: application/json

{
  "project_id": "64f123...",
  "filename": "wildlife_001.jpg",
  "url": "https://example.com/images/wildlife_001.jpg",
  "width": 1920,
  "height": 1080,
  "format": "jpg",
  "file_size": 2456789
}
```

#### Get Image Stats
```http
GET /api/images/{id}/stats
```

## Data Model

The system uses the following main entities:

- **Projects**: Organize annotation work
- **Images**: Store image metadata and track annotation progress
- **Annotations**: Contain segmentation masks with calculated areas and rankings
- **Segmentation Masks**: Support RLE, Polygon, and Bitmap formats

## Segmentation Mask Formats

### RLE (Run-Length Encoding) - Recommended for SAM
```json
{
  "format": "rle",
  "data": {
    "size": [600, 800],
    "counts": "123,45,67,89..."
  },
  "width": 800,
  "height": 600
}
```

### Polygon Format
```json
{
  "format": "polygon",
  "data": {
    "exterior": [[x1, y1], [x2, y2], ...],
    "holes": [[[x1, y1], [x2, y2], ...]]
  },
  "width": 800,
  "height": 600
}
```

### Bitmap Format
```json
{
  "format": "bitmap",
  "data": {
    "mask": [[0, 1, 1], [1, 1, 0], ...]
  },
  "width": 3,
  "height": 2
}
```

## Area Ranking System

When you query an annotation's rank, the system:

1. Gets all annotations for the same image
2. Sorts them by area (largest first) 
3. Assigns ranks (1 = largest area)
4. Calculates percentage of image area covered

Response includes:
- `area_rank`: Relative rank (1, 2, 3...)
- `total_annotations`: Total annotations in image
- `area_percentage`: Percentage of image area covered

## Architecture

- **Express.js** - Web framework
- **MongoDB** - Document database with indexes for performance
- **TypeScript** - Type safety and better development experience
- **Modular structure** - Separate models, controllers, and routes
- **Error handling** - Consistent error responses
- **Validation** - Input validation with proper error messages

## Performance Considerations

- Database indexes on frequently queried fields
- Efficient area calculation algorithms
- Support for multiple mask formats
- Proper error handling and validation
- Large request size limit for mask data

## Development

Run in development mode with hot reload:
```bash
npm run dev
```

The API will be available at `http://localhost:3000` with the following key endpoints:
- `GET /` - API information and available endpoints
- `GET /health` - Health check
- `/api/annotations` - Annotation management
- `/api/projects` - Project management  
- `/api/images` - Image management

## Architecture & Design Decisions

### Database Design
- **MongoDB**: Chosen for flexibility with complex segmentation mask data structures
- **Collections**: Projects, Images, Annotations with proper indexing for performance
- **Relationships**: ObjectId references with cascading updates

### Segmentation Mask Support
- **RLE (Run-Length Encoding)**: Primary format for SAM compatibility, space-efficient
- **Polygon**: Human-readable format for simple shapes, uses Shoelace formula for area calculation
- **Bitmap**: Fallback format for complex masks, direct pixel counting

### Area Ranking Algorithm
1. Calculate pixel area for each mask using format-specific algorithms
2. Sort annotations by area (descending) within each image
3. Assign relative ranks (1 = largest area)
4. Calculate percentage coverage of total image area

### API Design Principles
- **RESTful**: Standard HTTP methods and status codes
- **Consistent Response Format**: All endpoints return `{success, data, message}` structure
- **Error Handling**: Proper validation with descriptive error messages
- **Type Safety**: Full TypeScript implementation with strict typing

### Performance Optimizations
- **Database Indexes**: Strategic indexes on query fields (area, annotator_id, label)
- **Aggregation Pipelines**: Efficient ranking calculations using MongoDB aggregation
- **Lazy Loading**: References instead of embedded documents for scalability

### Major Tradeoffs
1. **Accuracy vs Performance**: Simplified RLE decoding for demo vs full RLE library
2. **Flexibility vs Simplicity**: Multiple mask formats vs single format
3. **Real-time vs Batch**: Immediate area calculation vs background processing
4. **Storage vs Computation**: Pre-calculated areas vs on-the-fly calculation

## Project Structure

```
src/
├── config/         # Database configuration and connection
├── controllers/    # Request handlers with validation
├── models/         # Data models and business logic
├── routes/         # API route definitions
├── utils/          # Utility functions (mask calculations)
└── seed.ts         # Database seeding script
```

### Manual Testing
1. Import Postman collection
2. Run seed script: `npm run seed`
3. Test core endpoints with provided sample IDs
4. Verify area rankings match expected order

## Sample Data

The seed script creates:
- **2 Projects**: Wildlife Detection, Medical Image Analysis
- **3 Images**: Forest scene (1920x1080), Savanna scene (2560x1440), Medical scan (512x512)
- **8 Annotations**: Different sizes to demonstrate ranking (120k, 90k, 40k, 30k, 2.5k, 2k, 1.5k, 8 pixels)

### Expected Area Rankings
**Forest Scene**:
1. Tree: 120,000 pixels (5.79% coverage)
2. Deer: 30,000 pixels (1.45% coverage)
3. Bird: 2,000 pixels (0.10% coverage)
4. Insect: 8 pixels (0.0004% coverage)
