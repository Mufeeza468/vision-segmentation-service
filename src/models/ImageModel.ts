import { Collection, ObjectId } from 'mongodb';
import { database } from '../config/database';
import { 
  Image, 
  CreateImageRequest, 
  NotFoundError,
  DatabaseError 
} from './types';

export class ImageModel {
  private get collection(): Collection<Image> {
    return database.getDb().collection<Image>('images');
  }

  async create(request: CreateImageRequest): Promise<Image> {
    try {
      const image: Omit<Image, '_id'> = {
        project_id: new ObjectId(request.project_id),
        filename: request.filename,
        url: request.url,
        width: request.width,
        height: request.height,
        format: request.format,
        file_size: request.file_size,
        annotations: [],
        annotation_status: 'pending',
        uploaded_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await this.collection.insertOne(image as Image);
      
      if (!result.insertedId) {
        throw new DatabaseError('Failed to create image');
      }

      // Add image to project
      const projectCollection = database.getDb().collection('projects');
      await projectCollection.updateOne(
        { _id: image.project_id },
        { 
          $push: { images: result.insertedId } as any,
          $set: { updated_at: new Date() }
        }
      );

      return {
        ...image,
        _id: result.insertedId
      } as Image;
    } catch (error) {
      if (error instanceof Error) {
        throw new DatabaseError(`Failed to create image: ${error.message}`);
      }
      throw new DatabaseError('Failed to create image');
    }
  }

  async findById(id: ObjectId): Promise<Image | null> {
    try {
      return await this.collection.findOne({ _id: id });
    } catch (error) {
      throw new DatabaseError('Failed to find image by ID');
    }
  }

  async findByProject(projectId: ObjectId): Promise<Image[]> {
    try {
      return await this.collection.find({ project_id: projectId }).toArray();
    } catch (error) {
      throw new DatabaseError('Failed to find images by project');
    }
  }

  async update(id: ObjectId, updates: Partial<Image>): Promise<Image> {
    try {
      const updateDoc = {
        ...updates,
        updated_at: new Date()
      };

      const result = await this.collection.findOneAndUpdate(
        { _id: id },
        { $set: updateDoc },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new NotFoundError('Image not found');
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update image');
    }
  }

  async delete(id: ObjectId): Promise<void> {
    try {
      const image = await this.findById(id);
      if (!image) {
        throw new NotFoundError('Image not found');
      }

      const result = await this.collection.deleteOne({ _id: id });
      if (result.deletedCount === 0) {
        throw new NotFoundError('Image not found');
      }

      // Remove image from project
      const projectCollection = database.getDb().collection('projects');
      await projectCollection.updateOne(
        { _id: image.project_id },
        { 
          $pull: { images: id } as any,
          $set: { updated_at: new Date() }
        }
      );

      // Delete associated annotations
      const annotationCollection = database.getDb().collection('annotations');
      await annotationCollection.deleteMany({ image_id: id });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete image');
    }
  }

  async getImageStats(imageId: ObjectId): Promise<any> {
    try {
      const image = await this.findById(imageId);
      if (!image) {
        throw new NotFoundError('Image not found');
      }

      const annotationCollection = database.getDb().collection('annotations');
      
      const annotationStats = await annotationCollection.aggregate([
        { $match: { image_id: imageId } },
        { $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalArea: { $sum: '$area' }
        }}
      ]).toArray();

      const totalAnnotations = image.annotations.length;
      const imageArea = image.width * image.height;

      return {
        image_id: imageId,
        filename: image.filename,
        dimensions: { width: image.width, height: image.height },
        total_annotations: totalAnnotations,
        annotation_status: image.annotation_status,
        annotation_stats: annotationStats,
        image_area: imageArea
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to get image stats');
    }
  }
}