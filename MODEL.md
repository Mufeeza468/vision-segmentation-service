# Data Model - Vision Segmentation Service

This document describes the data structures used in the segmentation annotation system.

## User Object

| Field | Data Type | Description |
|-------|-----------|-------------|
| _id | ObjectId | MongoDB unique identifier |
| email | String | User's email address (unique) |
| name | String | User's full name |
| role | String | User role: "annotator", "admin", "viewer" |
| created_at | Date | Timestamp when the user was created |
| updated_at | Date | Timestamp when the user was last updated |

## Project Object

| Field | Data Type | Description |
|-------|-----------|-------------|
| _id | ObjectId | MongoDB unique identifier |
| name | String | Project name |
| description | String | Project description |
| created_by | ObjectId | Reference to User who created the project |
| status | String | Project status: "active", "completed", "paused" |
| images | ObjectId[] | Array of references to Image objects |
| annotators | ObjectId[] | Array of references to User objects assigned to annotate |
| created_at | Date | Timestamp when the project was created |
| updated_at | Date | Timestamp when the project was last updated |

## Image Object

| Field | Data Type | Description |
|-------|-----------|-------------|
| _id | ObjectId | MongoDB unique identifier |
| project_id | ObjectId | Reference to the parent Project |
| filename | String | Original filename of the image |
| url | String | URL or path to the stored image |
| width | Number | Image width in pixels |
| height | Number | Image height in pixels |
| format | String | Image format (e.g., "jpg", "png") |
| file_size | Number | File size in bytes |
| annotations | ObjectId[] | Array of references to Annotation objects |
| annotation_status | String | Status: "pending", "in_progress", "completed", "reviewed" |
| uploaded_at | Date | Timestamp when the image was uploaded |

## Annotation Object

| Field | Data Type | Description |
|-------|-----------|-------------|
| _id | ObjectId | MongoDB unique identifier |
| image_id | ObjectId | Reference to the parent Image |
| project_id | ObjectId | Reference to the parent Project |
| annotator_id | ObjectId | Reference to User who created the annotation |
| label | String | Annotation label/category |
| mask | SegmentationMask | The segmentation mask data |
| confidence | Number | Confidence score (0-1) if applicable |
| area | Number | Calculated area of the mask in pixels |
| bbox | BoundingBox | Bounding box of the segmentation |
| status | String | Status: "draft", "completed", "reviewed" |
| created_at | Date | Timestamp when the annotation was created |
| updated_at | Date | Timestamp when the annotation was last updated |

## SegmentationMask Object

| Field | Data Type | Description |
|-------|-----------|-------------|
| format | String | Mask format: "rle" (Run-Length Encoding), "polygon", "bitmap" |
| data | Mixed | The actual mask data (format depends on 'format' field) |
| width | Number | Mask width in pixels |
| height | Number | Mask height in pixels |

### Mask Data Formats:

#### RLE (Run-Length Encoding) - Recommended for SAM
```typescript
{
  format: "rle",
  data: {
    size: [height, width],
    counts: string // RLE encoded mask as string
  }
}
```

#### Polygon Format
```typescript
{
  format: "polygon", 
  data: {
    exterior: [[x1, y1], [x2, y2], ...], // Outer boundary points
    holes: [[[x1, y1], [x2, y2], ...], ...] // Optional inner holes
  }
}
```

#### Bitmap Format (less efficient, for simple cases)
```typescript
{
  format: "bitmap",
  data: {
    mask: number[][] // 2D array of 0s and 1s
  }
}
```

## BoundingBox Object

| Field | Data Type | Description |
|-------|-----------|-------------|
| x | Number | Top-left x coordinate |
| y | Number | Top-left y coordinate |
| width | Number | Bounding box width |
| height | Number | Bounding box height |

## AnnotationStats Object (derived/computed)

| Field | Data Type | Description |
|-------|-----------|-------------|
| annotation_id | ObjectId | Reference to Annotation |
| area_rank | Number | Relative rank by area within the image (1 = largest) |
| total_annotations | Number | Total annotations in the same image |
| area_percentage | Number | Percentage of image area covered by this annotation |

## Database Indexes

### Recommended indexes for performance:

- **annotations**: `{ image_id: 1, area: -1 }` - For area ranking queries
- **annotations**: `{ annotator_id: 1, created_at: -1 }` - For retrieving by annotator
- **annotations**: `{ label: 1 }` - For retrieving by label
- **annotations**: `{ project_id: 1, status: 1 }` - For project progress tracking
- **images**: `{ project_id: 1, annotation_status: 1 }` - For project management
- **users**: `{ email: 1 }` - Unique constraint and lookup

## Notes

1. **Segmentation Mask Storage**: The system supports multiple mask formats. RLE is recommended for SAM (Segment Anything Model) compatibility as it's efficient for complex masks.

2. **Area Calculation**: The area field in Annotation is calculated when the annotation is saved and is used for relative ranking within each image.

3. **Bounding Box**: Automatically calculated from the segmentation mask for quick spatial queries.

4. **Status Tracking**: Multiple levels of status tracking allow for workflow management at both image and annotation levels.

5. **Scalability**: ObjectId references allow for efficient queries and maintain data integrity while supporting large datasets.