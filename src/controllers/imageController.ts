import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ImageModel } from '../models/ImageModel';
import { AnnotationController } from './annotationController';
import { 
  CreateImageRequest, 
  ApiResponse,
  ValidationError,
  NotFoundError,
  DatabaseError 
} from '../models/types';

const imageModel = new ImageModel();
const annotationController = new AnnotationController();

export class ImageController {
  async createImage(req: Request, res: Response): Promise<void> {
    try {
      const imageData: CreateImageRequest = req.body;
      
      // Validate required fields
      if (!imageData.project_id || !imageData.filename || !imageData.url ||
          !imageData.width || !imageData.height || !imageData.format) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: project_id, filename, url, width, height, format'
        } as ApiResponse<never>);
        return;
      }

      const image = await imageModel.create(imageData);
      
      res.status(201).json({
        success: true,
        data: image,
        message: 'Image created successfully'
      } as ApiResponse<typeof image>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getImageById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid image ID'
        } as ApiResponse<never>);
        return;
      }

      const image = await imageModel.findById(new ObjectId(id));
      
      if (!image) {
        res.status(404).json({
          success: false,
          error: 'Image not found'
        } as ApiResponse<never>);
        return;
      }

      res.status(200).json({
        success: true,
        data: image
      } as ApiResponse<typeof image>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async updateImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (!id || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid image ID'
        } as ApiResponse<never>);
        return;
      }

      const updatedImage = await imageModel.update(new ObjectId(id), updates);
      
      res.status(200).json({
        success: true,
        data: updatedImage,
        message: 'Image updated successfully'
      } as ApiResponse<typeof updatedImage>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid image ID'
        } as ApiResponse<never>);
        return;
      }

      await imageModel.delete(new ObjectId(id));
      
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      } as ApiResponse<never>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getImageStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid image ID'
        } as ApiResponse<never>);
        return;
      }

      const stats = await imageModel.getImageStats(new ObjectId(id));
      
      res.status(200).json({
        success: true,
        data: stats
      } as ApiResponse<typeof stats>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAreaRankings(req: Request, res: Response): Promise<void> {
    // Delegate to annotation controller
    return annotationController.getAreaRankings(req, res);
  }

  private handleError(error: unknown, res: Response): void {
    console.error('Image controller error:', error);
    
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