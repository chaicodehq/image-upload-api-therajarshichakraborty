import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, UPLOAD_DIR);
	},

	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);

		const uniqueName = `${Date.now()}-${crypto
			.randomBytes(4)
			.toString('hex')}${ext}`;

		cb(null, uniqueName);
	},
});

const fileFilter = (req, file, cb) => {
	const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

	if (!allowedTypes.includes(file.mimetype)) {
		req.fileValidationError =
			'Invalid file type. Only JPEG, PNG, and GIF are allowed.';

		return cb(null, false);
	}

	cb(null, true);
};

export const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024,
	},
});
