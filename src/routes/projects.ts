import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';

const router = Router();
const projectController = new ProjectController();

router.post('/', (req, res) => projectController.createProject(req, res));
router.get('/', (req, res) => projectController.getAllProjects(req, res));
router.get('/:id', (req, res) => projectController.getProjectById(req, res));
router.put('/:id', (req, res) => projectController.updateProject(req, res));
router.delete('/:id', (req, res) => projectController.deleteProject(req, res));

router.get('/:id/progress', (req, res) => projectController.getProjectProgress(req, res));
router.get('/:id/images', (req, res) => projectController.getProjectImages(req, res));
router.post('/:id/annotators', (req, res) => projectController.addAnnotator(req, res));

export default router;