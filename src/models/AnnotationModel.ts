import { Collection, ObjectId } from 'mongodb';
import { database } from '../config/database';
import { 
  Annotation, 
  AnnotationWithRank, 
  CreateAnnotationRequest, 
  AnnotationQuery,
  NotFoundError,
  DatabaseError 
} from './types';
import { calculateMaskArea, calculateBoundingBox } from '../utils/maskUtils';

export class AnnotationModel {
  private get collection(): Collection<Annotation> {
    return database.getDb().collection<Annotation>('annotations');
  }

  async create(request: CreateAnnotationRequest): Promise<Annotation> {
    try {
      // Calculate area and bounding box from mask
      const area = calculateMaskArea(request.mask);
      const bbox = calculateBoundingBox(request.mask);
      
      const annotation: Omit<Annotation, '_id'> = {
        image_id: new ObjectId(request.image_id),
        project_id: new ObjectId(request.project_id),
        annotator_id: new ObjectId(request.annotator_id),
        label: request.label,
        mask: request.mask,
        ...(request.confidence !== undefined && { confidence: request.confidence }),
        area,
        bbox,
        status: request.status || 'draft',
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await this.collection.insertOne(annotation as Annotation);
      
      if (!result.insertedId) {
        throw new DatabaseError('Failed to create annotation');
      }

      // Update image's annotations array and status
      await this.updateImageAnnotations(annotation.image_id);

      return {
        ...annotation,
        _id: result.insertedId
      } as Annotation;
    } catch (error) {
      if (error instanceof Error) {
        throw new DatabaseError(`Failed to create annotation: ${error.message}`);
      }
      throw new DatabaseError('Failed to create annotation');
    }
  }

  async findById(id: ObjectId): Promise<Annotation | null> {
    try {
      return await this.collection.findOne({ _id: id });
    } catch (error) {
      throw new DatabaseError('Failed to find annotation by ID');
    }
  }

  async findByQuery(query: AnnotationQuery): Promise<Annotation[]> {
    try {
      const mongoQuery: any = {};
      
      if (query.id) {
        mongoQuery._id = query.id;
      }
      if (query.label) {
        mongoQuery.label = query.label;
      }
      if (query.annotator_id) {
        mongoQuery.annotator_id = query.annotator_id;
      }
      if (query.image_id) {
        mongoQuery.image_id = query.image_id;
      }
      if (query.project_id) {
        mongoQuery.project_id = query.project_id;
      }
      if (query.status) {
        mongoQuery.status = query.status;
      }

      return await this.collection.find(mongoQuery).toArray();
    } catch (error) {
      throw new DatabaseError('Failed to find annotations');
    }
  }

  async findByLabel(label: string): Promise<Annotation[]> {
    return this.findByQuery({ label });
  }

  async findByAnnotator(annotatorId: ObjectId): Promise<Annotation[]> {
    return this.findByQuery({ annotator_id: annotatorId });
  }

  async getAnnotationWithRank(annotationId: ObjectId): Promise<AnnotationWithRank | null> {
    try {
      const annotation = await this.findById(annotationId);
      if (!annotation) {
        return null;
      }

      // Get all annotations for the same image, sorted by area descending
      const imageAnnotations = await this.collection
        .find({ image_id: annotation.image_id })
        .sort({ area: -1 })
        .toArray();

      // Calculate rank and total
      const total_annotations = imageAnnotations.length;
      let area_rank = 1;
      
      for (let i = 0; i < imageAnnotations.length; i++) {
        if (imageAnnotations[i]!._id!.equals(annotationId)) {
          area_rank = i + 1;
          break;
        }
      }

      // Get image dimensions for percentage calculation
      const imageCollection = database.getDb().collection('images');
      const image = await imageCollection.findOne({ _id: annotation.image_id });
      const imageArea = image ? image.width * image.height : 1;
      const area_percentage = (annotation.area / imageArea) * 100;

      return {
        ...annotation,
        area_rank,
        total_annotations,
        area_percentage
      };
    } catch (error) {
      throw new DatabaseError('Failed to get annotation with rank');
    }
  }

  async update(id: ObjectId, updates: Partial<Annotation>): Promise<Annotation> {
    try {
      const updateDoc: any = {
        ...updates,
        updated_at: new Date()
      };

      // Recalculate area and bbox if mask is updated
      if (updates.mask) {
        updateDoc.area = calculateMaskArea(updates.mask);
        updateDoc.bbox = calculateBoundingBox(updates.mask);
      }

      const result = await this.collection.findOneAndUpdate(
        { _id: id },
        { $set: updateDoc },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new NotFoundError('Annotation not found');
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update annotation');
    }
  }

  async delete(id: ObjectId): Promise<void> {
    try {
      const annotation = await this.findById(id);
      if (!annotation) {
        throw new NotFoundError('Annotation not found');
      }

      const result = await this.collection.deleteOne({ _id: id });
      if (result.deletedCount === 0) {
        throw new NotFoundError('Annotation not found');
      }

      // Update image's annotations array
      await this.updateImageAnnotations(annotation.image_id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete annotation');
    }
  }

  private async updateImageAnnotations(imageId: ObjectId): Promise<void> {
    try {
      const annotations = await this.collection.find({ image_id: imageId }).toArray();
      const annotationIds = annotations.map(a => a._id!);
      
      // Determine image annotation status
      let status: string = 'pending';
      if (annotations.length > 0) {
        const allCompleted = annotations.every(a => a.status === 'completed' || a.status === 'reviewed');
        const hasInProgress = annotations.some(a => a.status === 'draft');
        
        if (allCompleted) {
          status = 'completed';
        } else if (hasInProgress) {
          status = 'in_progress';
        } else {
          status = 'in_progress';
        }
      }

      const imageCollection = database.getDb().collection('images');
      await imageCollection.updateOne(
        { _id: imageId },
        { 
          $set: { 
            annotations: annotationIds,
            annotation_status: status,
            updated_at: new Date()
          }
        }
      );
    } catch (error) {
      // Log error but don't throw as this is a side effect
      console.error('Failed to update image annotations:', error);
    }
  }

  async getAreaRankings(imageId: ObjectId): Promise<AnnotationWithRank[]> {
    try {
      const annotations = await this.collection
        .find({ image_id: imageId })
        .sort({ area: -1 })
        .toArray();

      // Get image dimensions for percentage calculation
      const imageCollection = database.getDb().collection('images');
      const image = await imageCollection.findOne({ _id: imageId });
      const imageArea = image ? image.width * image.height : 1;

      const total_annotations = annotations.length;

      return annotations.map((annotation, index) => ({
        ...annotation,
        area_rank: index + 1,
        total_annotations,
        area_percentage: (annotation.area / imageArea) * 100
      }));
    } catch (error) {
      throw new DatabaseError('Failed to get area rankings');
    }
  }
}