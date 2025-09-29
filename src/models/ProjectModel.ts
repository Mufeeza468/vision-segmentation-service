import { Collection, ObjectId } from 'mongodb';
import { database } from '../config/database';
import { 
  Project, 
  CreateProjectRequest, 
  NotFoundError,
  DatabaseError 
} from './types';

export class ProjectModel {
  private get collection(): Collection<Project> {
    return database.getDb().collection<Project>('projects');
  }

  async create(request: CreateProjectRequest): Promise<Project> {
    try {
      const project: Omit<Project, '_id'> = {
        name: request.name,
        description: request.description,
        created_by: new ObjectId(request.created_by),
        status: 'active',
        images: [],
        annotators: request.annotators ? request.annotators.map(id => new ObjectId(id)) : [],
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await this.collection.insertOne(project as Project);
      
      if (!result.insertedId) {
        throw new DatabaseError('Failed to create project');
      }

      return {
        ...project,
        _id: result.insertedId
      } as Project;
    } catch (error) {
      if (error instanceof Error) {
        throw new DatabaseError(`Failed to create project: ${error.message}`);
      }
      throw new DatabaseError('Failed to create project');
    }
  }

  async findById(id: ObjectId): Promise<Project | null> {
    try {
      return await this.collection.findOne({ _id: id });
    } catch (error) {
      throw new DatabaseError('Failed to find project by ID');
    }
  }

  async findAll(): Promise<Project[]> {
    try {
      return await this.collection.find({}).toArray();
    } catch (error) {
      throw new DatabaseError('Failed to find projects');
    }
  }

  async update(id: ObjectId, updates: Partial<Project>): Promise<Project> {
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
        throw new NotFoundError('Project not found');
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update project');
    }
  }

  async addImage(projectId: ObjectId, imageId: ObjectId): Promise<void> {
    try {
      await this.collection.updateOne(
        { _id: projectId },
        { 
          $push: { images: imageId },
          $set: { updated_at: new Date() }
        }
      );
    } catch (error) {
      throw new DatabaseError('Failed to add image to project');
    }
  }

  async addAnnotator(projectId: ObjectId, annotatorId: ObjectId): Promise<void> {
    try {
      await this.collection.updateOne(
        { _id: projectId },
        { 
          $addToSet: { annotators: annotatorId },
          $set: { updated_at: new Date() }
        }
      );
    } catch (error) {
      throw new DatabaseError('Failed to add annotator to project');
    }
  }

  async getProjectProgress(projectId: ObjectId): Promise<any> {
    try {
      const project = await this.findById(projectId);
      if (!project) {
        throw new NotFoundError('Project not found');
      }

      const imageCollection = database.getDb().collection('images');
      const annotationCollection = database.getDb().collection('annotations');

      const totalImages = project.images.length;
      
      const imageStats = await imageCollection.aggregate([
        { $match: { project_id: projectId } },
        { $group: {
          _id: '$annotation_status',
          count: { $sum: 1 }
        }}
      ]).toArray();

      const annotationStats = await annotationCollection.aggregate([
        { $match: { project_id: projectId } },
        { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }}
      ]).toArray();

      return {
        project_id: projectId,
        project_name: project.name,
        total_images: totalImages,
        image_progress: imageStats,
        annotation_progress: annotationStats,
        status: project.status
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to get project progress');
    }
  }

  async delete(id: ObjectId): Promise<void> {
    try {
      const result = await this.collection.deleteOne({ _id: id });
      if (result.deletedCount === 0) {
        throw new NotFoundError('Project not found');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete project');
    }
  }
}