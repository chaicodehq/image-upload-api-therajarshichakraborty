import { Router } from 'express';
import {
	uploadImage,
	listImages,
	getImage,
	downloadImage,
	downloadThumbnail,
	deleteImage,
} from '../controllers/image.controller.js';

import { upload } from '../middlewares/upload.middleware.js';

import { validateObjectId } from '../middlewares/validateObjectId.middleware.js';

const router = Router();

router.post('/', upload.single('image'), uploadImage);

router.get('/', listImages);

router.get('/:id', validateObjectId, getImage);

router.get('/:id/download', validateObjectId, downloadImage);

router.get('/:id/thumbnail', validateObjectId, downloadThumbnail);

router.delete('/:id', validateObjectId, deleteImage);

export default router;
