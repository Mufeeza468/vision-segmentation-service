import { Router } from 'express';
import { AnnotationController } from '../controllers/annotationController';

const router = Router();
const annotationController = new AnnotationController();

router.get('/', (req, res) => annotationController.getAllAnnotations(req, res));
router.post('/', (req, res) => annotationController.createAnnotation(req, res));
router.get('/search', (req, res) => annotationController.searchAnnotations(req, res));
router.get('/by-label/:label', (req, res) => annotationController.getAnnotationsByLabel(req, res));
router.get('/by-annotator/:annotatorId', (req, res) => annotationController.getAnnotationsByAnnotator(req, res));
router.get('/:id/rank', (req, res) => annotationController.getAnnotationWithRank(req, res));
router.get('/:id', (req, res) => annotationController.getAnnotationById(req, res));
router.put('/:id', (req, res) => annotationController.updateAnnotation(req, res));
router.delete('/:id', (req, res) => annotationController.deleteAnnotation(req, res));

export default router;