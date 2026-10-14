# Testing the Vision Segmentation Service

## Running the Tests

To test the system, you'll need to have MongoDB running. If you don't have MongoDB installed, you can use Docker:

```bash
# Run MongoDB in Docker
docker run -d --name mongodb -p 27017:27017 mongo:6.0

# Or install MongoDB locally (macOS)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

Then start the API server:

```bash
npm run dev
```

## Test Scenarios

### 1. Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "Vision Segmentation Service API",
  "version": "1.0.0"
}
```

### 2. Create a Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wildlife Detection Project",
    "description": "Annotate animals in wildlife photos",
    "created_by": "64f123456789abcdef123456"
  }'
```

Save the `project_id` from the response for the next steps.

### 3. Add Image to Project
```bash
curl -X POST http://localhost:3000/api/images \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "filename": "wildlife_001.jpg",
    "url": "https://example.com/images/wildlife_001.jpg",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "file_size": 2456789
  }'
```

Save the `image_id` from the response.

### 4. Create Annotations with Different Areas

#### Large annotation (90000 pixels = 300x300)
```bash
curl -X POST http://localhost:3000/api/annotations \
  -H "Content-Type: application/json" \
  -d '{
    "image_id": "YOUR_IMAGE_ID",
    "project_id": "YOUR_PROJECT_ID",
    "annotator_id": "64f123456789abcdef123456",
    "label": "large_animal",
    "mask": {
      "format": "polygon",
      "data": {
        "exterior": [[0, 0], [300, 0], [300, 300], [0, 300]]
      },
      "width": 1920,
      "height": 1080
    },
    "confidence": 0.95,
    "status": "completed"
  }'
```

#### Medium annotation (20000 pixels = 200x100)
```bash
curl -X POST http://localhost:3000/api/annotations \
  -H "Content-Type: application/json" \
  -d '{
    "image_id": "YOUR_IMAGE_ID",
    "project_id": "YOUR_PROJECT_ID",
    "annotator_id": "64f123456789abcdef123456",
    "label": "medium_animal",
    "mask": {
      "format": "polygon",
      "data": {
        "exterior": [[400, 400], [600, 400], [600, 500], [400, 500]]
      },
      "width": 1920,
      "height": 1080
    },
    "confidence": 0.88,
    "status": "completed"
  }'
```

#### Small annotation (2500 pixels = 50x50)
```bash
curl -X POST http://localhost:3000/api/annotations \
  -H "Content-Type: application/json" \
  -d '{
    "image_id": "YOUR_IMAGE_ID",
    "project_id": "YOUR_PROJECT_ID",
    "annotator_id": "64f123456789abcdef123456",
    "label": "small_animal",
    "mask": {
      "format": "polygon",
      "data": {
        "exterior": [[800, 800], [850, 800], [850, 850], [800, 850]]
      },
      "width": 1920,
      "height": 1080
    },
    "confidence": 0.75,
    "status": "completed"
  }'
```

### 5. Test Core Requirements

#### Retrieve annotation by ID
```bash
curl http://localhost:3000/api/annotations/YOUR_ANNOTATION_ID
```

#### Retrieve annotations by label
```bash
curl http://localhost:3000/api/annotations/by-label/large_animal
```

#### Retrieve annotations by annotator
```bash
curl http://localhost:3000/api/annotations/by-annotator/64f123456789abcdef123456
```

#### Get area rankings (This is the key requirement!)
```bash
curl http://localhost:3000/api/images/YOUR_IMAGE_ID/annotations/rankings
```

Expected response showing relative ranks:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "label": "large_animal",
      "area": 90000,
      "area_rank": 1,
      "total_annotations": 3,
      "area_percentage": 4.34
    },
    {
      "_id": "...",
      "label": "medium_animal", 
      "area": 20000,
      "area_rank": 2,
      "total_annotations": 3,
      "area_percentage": 0.96
    },
    {
      "_id": "...",
      "label": "small_animal",
      "area": 2500,
      "area_rank": 3,
      "total_annotations": 3,
      "area_percentage": 0.12
    }
  ]
}
```

#### Get specific annotation with rank
```bash
curl http://localhost:3000/api/annotations/YOUR_ANNOTATION_ID/rank
```

### 6. Test Different Mask Formats

#### RLE Format
```bash
curl -X POST http://localhost:3000/api/annotations \
  -H "Content-Type: application/json" \
  -d '{
    "image_id": "YOUR_IMAGE_ID",
    "project_id": "YOUR_PROJECT_ID",
    "annotator_id": "64f123456789abcdef123456",
    "label": "rle_mask",
    "mask": {
      "format": "rle",
      "data": {
        "size": [1080, 1920],
        "counts": "100,200,100,200,100"
      },
      "width": 1920,
      "height": 1080
    }
  }'
```

#### Bitmap Format  
```bash
curl -X POST http://localhost:3000/api/annotations \
  -H "Content-Type: application/json" \
  -d '{
    "image_id": "YOUR_IMAGE_ID",
    "project_id": "YOUR_PROJECT_ID",
    "annotator_id": "64f123456789abcdef123456",
    "label": "bitmap_mask",
    "mask": {
      "format": "bitmap",
      "data": {
        "mask": [[1,1,0],[0,1,1],[1,0,1]]
      },
      "width": 3,
      "height": 3
    }
  }'
```

### 7. Project Management Tests

#### Get project progress
```bash
curl http://localhost:3000/api/projects/YOUR_PROJECT_ID/progress
```

#### Get all images in project
```bash
curl http://localhost:3000/api/projects/YOUR_PROJECT_ID/images
```

#### Get image statistics
```bash
curl http://localhost:3000/api/images/YOUR_IMAGE_ID/stats
```

### 8. Search and Query Tests

#### Search annotations with multiple criteria
```bash
curl "http://localhost:3000/api/annotations/search?label=large_animal&status=completed&project_id=YOUR_PROJECT_ID"
```

#### Get all projects
```bash
curl http://localhost:3000/api/projects
```

## Expected Results

After running these tests, you should see:

1. **Area rankings work correctly** - larger annotations get rank 1, smaller get higher numbers
2. **Multiple mask formats supported** - RLE, polygon, and bitmap all calculate areas
3. **All CRUD operations work** - create, read, update, delete for all entities
4. **Search functionality** - can find annotations by ID, label, annotator
5. **Progress tracking** - project and image status updates automatically
6. **Proper error handling** - invalid IDs, missing fields return appropriate errors

## Performance Notes

The system includes database indexes for:
- Annotations by area (for ranking queries)
- Annotations by annotator and label (for search queries)
- Images by project (for project management)

This ensures fast query performance even with large datasets.

## Troubleshooting

- **Connection errors**: Make sure MongoDB is running on localhost:27017
- **Invalid ObjectId errors**: Ensure you're using the actual IDs returned from API calls
- **Type errors**: Check that mask format matches the expected structure for each type