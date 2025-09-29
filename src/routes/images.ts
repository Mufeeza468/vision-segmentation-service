import { Router } from 'express';
import { ImageController } from '../controllers/imageController';

const router = Router();
const imageController = new ImageController();

router.post('/', (req, res) => imageController.createImage(req, res));
router.get('/:id', (req, res) => imageController.getImageById(req, res));
router.put('/:id', (req, res) => imageController.updateImage(req, res));
router.delete('/:id', (req, res) => imageController.deleteImage(req, res));

router.get('/:id/stats', (req, res) => imageController.getImageStats(req, res));
router.get('/:imageId/annotations/rankings', (req, res) => imageController.getAreaRankings(req, res));

export default router;