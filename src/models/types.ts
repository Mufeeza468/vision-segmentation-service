import { ObjectId } from 'mongodb';

// Base interface for MongoDB documents
export interface BaseDocument {
  _id?: ObjectId;
  created_at: Date;
  updated_at: Date;
}

// User types
export type UserRole = 'annotator' | 'admin' | 'viewer';

export interface User extends BaseDocument {
  email: string;
  name: string;
  role: UserRole;
}

// Project types
export type ProjectStatus = 'active' | 'completed' | 'paused';

export interface Project extends BaseDocument {
  name: string;
  description: string;
  created_by: ObjectId;
  status: ProjectStatus;
  images: ObjectId[];
  annotators: ObjectId[];
}

// Image types
export type ImageAnnotationStatus = 'pending' | 'in_progress' | 'completed' | 'reviewed';

export interface Image extends BaseDocument {
  project_id: ObjectId;
  filename: string;
  url: string;
  width: number;
  height: number;
  format: string;
  file_size: number;
  annotations: ObjectId[];
  annotation_status: ImageAnnotationStatus;
  uploaded_at: Date;
}

// Segmentation mask types
export type MaskFormat = 'rle' | 'polygon' | 'bitmap';

export interface SegmentationMask {
  format: MaskFormat;
  data: RLEMaskData | PolygonMaskData | BitmapMaskData;
  width: number;
  height: number;
}

export interface RLEMaskData {
  size: [number, number]; // [height, width]
  counts: string; // RLE encoded string
}

export interface PolygonMaskData {
  exterior: number[][]; // Array of [x, y] points
  holes?: number[][][]; // Optional array of holes, each hole is an array of [x, y] points
}

export interface BitmapMaskData {
  mask: number[][]; // 2D array of 0s and 1s
}

// Bounding box type
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Annotation types
export type AnnotationStatus = 'draft' | 'completed' | 'reviewed';

export interface Annotation extends BaseDocument {
  image_id: ObjectId;
  project_id: ObjectId;
  annotator_id: ObjectId;
  label: string;
  mask: SegmentationMask;
  confidence?: number;
  area: number;
  bbox: BoundingBox;
  status: AnnotationStatus;
}

// Query types for retrieving annotations
export interface AnnotationQuery {
  id?: ObjectId;
  label?: string;
  annotator_id?: ObjectId;
  image_id?: ObjectId;
  project_id?: ObjectId;
  status?: AnnotationStatus;
}

// Response types for area ranking
export interface AnnotationWithRank extends Annotation {
  area_rank: number;
  total_annotations: number;
  area_percentage: number;
}

// Request/Response types for API
export interface CreateAnnotationRequest {
  image_id: string;
  project_id: string;
  annotator_id: string;
  label: string;
  mask: SegmentationMask;
  confidence?: number;
  status?: AnnotationStatus;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  created_by: string;
  annotators?: string[];
}

export interface CreateImageRequest {
  project_id: string;
  filename: string;
  url: string;
  width: number;
  height: number;
  format: string;
  file_size: number;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: UserRole;
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Error types
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}