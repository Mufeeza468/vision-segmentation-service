import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { AnnotationModel } from '../models/AnnotationModel';
import { 
  CreateAnnotationRequest, 
  ApiResponse, 
  AnnotationWithRank,
  ValidationError,
  NotFoundError,
  DatabaseError 
} from '../models/types';

const annotationModel = new AnnotationModel();

export class AnnotationController {
  async getAllAnnotations(req: Request, res: Response): Promise<void> {
    try {
      const annotations = await annotationModel.findByQuery({});
      
      res.status(200).json({
        success: true,
        data: annotations,
        message: `Retrieved ${annotations.length} annotations`
      } as ApiResponse<typeof annotations>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async createAnnotation(req: Request, res: Response): Promise<void> {
    try {
      const annotationData: CreateAnnotationRequest = req.body;
      
      // Validate required fields
      if (!annotationData.image_id || !annotationData.project_id || 
          !annotationData.annotator_id || !annotationData.label || !annotationData.mask) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: image_id, project_id, annotator_id, label, mask'
        } as ApiResponse<never>);
        return;
      }

      const annotation = await annotationModel.create(annotationData);
      
      res.status(201).json({
        success: true,
        data: annotation,
        message: 'Annotation created successfully'
      } as ApiResponse<typeof annotation>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAnnotationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid annotation ID'
        } as ApiResponse<never>);
        return;
      }

      const annotation = await annotationModel.findById(new ObjectId(id));
      
      if (!annotation) {
        res.status(404).json({
          success: false,
          error: 'Annotation not found'
        } as ApiResponse<never>);
        return;
      }

      res.status(200).json({
        success: true,
        data: annotation
      } as ApiResponse<typeof annotation>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAnnotationWithRank(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid annotation ID'
        } as ApiResponse<never>);
        return;
      }

      const annotationWithRank = await annotationModel.getAnnotationWithRank(new ObjectId(id));
      
      if (!annotationWithRank) {
        res.status(404).json({
          success: false,
          error: 'Annotation not found'
        } as ApiResponse<never>);
        return;
      }

      res.status(200).json({
        success: true,
        data: annotationWithRank
      } as ApiResponse<AnnotationWithRank>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAnnotationsByLabel(req: Request, res: Response): Promise<void> {
    try {
      const { label } = req.params;
      
      if (!label || label.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Label cannot be empty'
        } as ApiResponse<never>);
        return;
      }

      const annotations = await annotationModel.findByLabel(label);
      
      res.status(200).json({
        success: true,
        data: annotations,
        message: `Found ${annotations.length} annotations with label "${label}"`
      } as ApiResponse<typeof annotations>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAnnotationsByAnnotator(req: Request, res: Response): Promise<void> {
    try {
      const { annotatorId } = req.params;
      
      if (!annotatorId || !ObjectId.isValid(annotatorId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid annotator ID'
        } as ApiResponse<never>);
        return;
      }

      const annotations = await annotationModel.findByAnnotator(new ObjectId(annotatorId));
      
      res.status(200).json({
        success: true,
        data: annotations,
        message: `Found ${annotations.length} annotations by annotator`
      } as ApiResponse<typeof annotations>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAreaRankings(req: Request, res: Response): Promise<void> {
    try {
      const { imageId } = req.params;
      
      if (!imageId || !ObjectId.isValid(imageId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid image ID'
        } as ApiResponse<never>);
        return;
      }

      const rankings = await annotationModel.getAreaRankings(new ObjectId(imageId));
      
      res.status(200).json({
        success: true,
        data: rankings,
        message: `Retrieved area rankings for ${rankings.length} annotations`
      } as ApiResponse<AnnotationWithRank[]>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async updateAnnotation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (!id || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid annotation ID'
        } as ApiResponse<never>);
        return;
      }

      const updatedAnnotation = await annotationModel.update(new ObjectId(id), updates);
      
      res.status(200).json({
        success: true,
        data: updatedAnnotation,
        message: 'Annotation updated successfully'
      } as ApiResponse<typeof updatedAnnotation>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async deleteAnnotation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid annotation ID'
        } as ApiResponse<never>);
        return;
      }

      await annotationModel.delete(new ObjectId(id));
      
      res.status(200).json({
        success: true,
        message: 'Annotation deleted successfully'
      } as ApiResponse<never>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async searchAnnotations(req: Request, res: Response): Promise<void> {
    try {
      const { label, annotator_id, image_id, project_id, status } = req.query;
      
      const query: any = {};
      
      if (label) query.label = label as string;
      if (annotator_id && ObjectId.isValid(annotator_id as string)) {
        query.annotator_id = new ObjectId(annotator_id as string);
      }
      if (image_id && ObjectId.isValid(image_id as string)) {
        query.image_id = new ObjectId(image_id as string);
      }
      if (project_id && ObjectId.isValid(project_id as string)) {
        query.project_id = new ObjectId(project_id as string);
      }
      if (status) query.status = status as string;

      const annotations = await annotationModel.findByQuery(query);
      
      res.status(200).json({
        success: true,
        data: annotations,
        message: `Found ${annotations.length} annotations matching criteria`
      } as ApiResponse<typeof annotations>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    console.error('Controller error:', error);
    
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message
      } as ApiResponse<never>);
    } else if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      } as ApiResponse<never>);
    } else if (error instanceof DatabaseError) {
      res.status(500).json({
        success: false,
        error: 'Database error occurred'
      } as ApiResponse<never>);
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<never>);
    }
  }
}