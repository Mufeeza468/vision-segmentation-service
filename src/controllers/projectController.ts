import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ProjectModel } from '../models/ProjectModel';
import { ImageModel } from '../models/ImageModel';
import { 
  CreateProjectRequest, 
  ApiResponse,
  ValidationError,
  NotFoundError,
  DatabaseError 
} from '../models/types';

const projectModel = new ProjectModel();
const imageModel = new ImageModel();

export class ProjectController {
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const projectData: CreateProjectRequest = req.body;
      
      // Validate required fields
      if (!projectData.name || !projectData.description || !projectData.created_by) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, description, created_by'
        } as ApiResponse<never>);
        return;
      }

      const project = await projectModel.create(projectData);
      
      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully'
      } as ApiResponse<typeof project>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAllProjects(req: Request, res: Response): Promise<void> {
    try {
      const projects = await projectModel.findAll();
      
      res.status(200).json({
        success: true,
        data: projects,
        message: `Retrieved ${projects.length} projects`
      } as ApiResponse<typeof projects>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project ID'
        } as ApiResponse<never>);
        return;
      }

      const project = await projectModel.findById(new ObjectId(id));
      
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found'
        } as ApiResponse<never>);
        return;
      }

      res.status(200).json({
        success: true,
        data: project
      } as ApiResponse<typeof project>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (!id || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project ID'
        } as ApiResponse<never>);
        return;
      }

      const updatedProject = await projectModel.update(new ObjectId(id), updates);
      
      res.status(200).json({
        success: true,
        data: updatedProject,
        message: 'Project updated successfully'
      } as ApiResponse<typeof updatedProject>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project ID'
        } as ApiResponse<never>);
        return;
      }

      await projectModel.delete(new ObjectId(id));
      
      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      } as ApiResponse<never>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getProjectProgress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project ID'
        } as ApiResponse<never>);
        return;
      }

      const progress = await projectModel.getProjectProgress(new ObjectId(id));
      
      res.status(200).json({
        success: true,
        data: progress
      } as ApiResponse<typeof progress>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getProjectImages(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project ID'
        } as ApiResponse<never>);
        return;
      }

      const images = await imageModel.findByProject(new ObjectId(id));
      
      res.status(200).json({
        success: true,
        data: images,
        message: `Found ${images.length} images in project`
      } as ApiResponse<typeof images>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async addAnnotator(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { annotator_id } = req.body;
      
      if (!id || !annotator_id || !ObjectId.isValid(id) || !ObjectId.isValid(annotator_id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project ID or annotator ID'
        } as ApiResponse<never>);
        return;
      }

      await projectModel.addAnnotator(new ObjectId(id), new ObjectId(annotator_id));
      
      res.status(200).json({
        success: true,
        message: 'Annotator added to project successfully'
      } as ApiResponse<never>);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    console.error('Project controller error:', error);
    
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