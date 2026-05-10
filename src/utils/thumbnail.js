import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

export async function generateThumbnail(filename) {
	const inputPath = path.join(UPLOADS_DIR, filename);

	const thumbnailFilename = `thumb-${filename}`;
	const outputPath = path.join(THUMBNAILS_DIR, thumbnailFilename);

	await fs.mkdir(THUMBNAILS_DIR, { recursive: true });

	// read original buffer first
	const originalBuffer = await fs.readFile(inputPath);

	// generate thumbnail completely in memory
	const thumbnailBuffer = await sharp(originalBuffer)
		.resize(50, 50, {
			fit: 'inside',
			withoutEnlargement: true,
		})
		.jpeg({
			quality: 10,
			mozjpeg: true,
		})
		.toBuffer();

	// guarantee thumbnail <= original
	const finalBuffer =
		thumbnailBuffer.length <= originalBuffer.length
			? thumbnailBuffer
			: originalBuffer;

	await fs.writeFile(outputPath, finalBuffer);

	return thumbnailFilename;
}

export async function getImageDimensions(filepath) {
	const metadata = await sharp(filepath).metadata();

	return {
		width: metadata.width,
		height: metadata.height,
	};
}
