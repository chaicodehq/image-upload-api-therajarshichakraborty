import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Image } from '../models/image.model.js';
import { generateThumbnail, getImageDimensions } from '../utils/thumbnail.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function uploadImage(req, res, next) {
	try {
		if (req.fileValidationError) {
			return res.status(400).json({
				error: {
					message: req.fileValidationError,
				},
			});
		}

		if (!req.file) {
			return res.status(400).json({
				error: {
					message: 'No file uploaded',
				},
			});
		}

		const { filename, originalname, mimetype, size } = req.file;

		const filepath = path.join(__dirname, '../../uploads', filename);

		const { width, height } = await getImageDimensions(filepath);

		const thumbnailFilename = await generateThumbnail(filename);

		const { description = '', tags = '' } = req.body;

		const parsedTags = tags
			? tags
					.split(',')
					.map((tag) => tag.trim())
					.filter(Boolean)
			: [];

		const image = await Image.create({
			originalName: originalname,
			filename,
			mimetype,
			size,
			width,
			height,
			thumbnailFilename,
			description,
			tags: parsedTags,
		});

		return res.status(201).json(image);
	} catch (error) {
		next(error);
	}
}

export async function listImages(req, res, next) {
	try {
		let {
			page = 1,
			limit = 10,
			search,
			mimetype,
			sortBy = 'uploadDate',
			sortOrder = 'desc',
		} = req.query;

		page = Number(page);

		limit = Math.min(Number(limit), 50);

		const query = {};

		if (search) {
			query.$text = { $search: search };
		}

		if (mimetype) {
			query.mimetype = mimetype;
		}

		const skip = (page - 1) * limit;

		const total = await Image.countDocuments(query);

		const pages = Math.ceil(total / limit);

		const images = await Image.find(query)
			.sort({
				[sortBy]: sortOrder === 'asc' ? 1 : -1,
			})
			.skip(skip)
			.limit(limit);

		const totalSize = images.reduce((acc, img) => acc + img.size, 0);

		return res.status(200).json({
			data: images,
			meta: {
				total,
				page,
				limit,
				pages,
				totalSize,
			},
		});
	} catch (error) {
		next(error);
	}
}

export async function getImage(req, res, next) {
	try {
		const image = await Image.findById(req.params.id);

		if (!image) {
			return res.status(404).json({
				error: {
					message: 'Image not found',
				},
			});
		}

		return res.status(200).json(image);
	} catch (error) {
		next(error);
	}
}

export async function downloadImage(req, res, next) {
	try {
		const image = await Image.findById(req.params.id);

		if (!image) {
			return res.status(404).json({
				error: {
					message: 'Image not found',
				},
			});
		}

		const filepath = path.join(__dirname, '../../uploads', image.filename);

		if (!fs.existsSync(filepath)) {
			return res.status(404).json({
				error: {
					message: 'File not found',
				},
			});
		}

		res.setHeader('Content-Type', image.mimetype);

		res.setHeader(
			'Content-Disposition',
			`attachment; filename="${image.originalName}"`,
		);

		return res.sendFile(filepath);
	} catch (error) {
		next(error);
	}
}

export async function downloadThumbnail(req, res, next) {
	try {
		const image = await Image.findById(req.params.id);

		if (!image) {
			return res.status(404).json({
				error: {
					message: 'Image not found',
				},
			});
		}

		const thumbnailPath = path.join(
			__dirname,
			'../../uploads/thumbnails',
			image.thumbnailFilename,
		);

		if (!fs.existsSync(thumbnailPath)) {
			return res.status(404).json({
				error: {
					message: 'File not found',
				},
			});
		}

		res.setHeader('Content-Type', image.mimetype);

		return res.sendFile(thumbnailPath);
	} catch (error) {
		next(error);
	}
}

export async function deleteImage(req, res, next) {
	try {
		const image = await Image.findById(req.params.id);

		if (!image) {
			return res.status(404).json({
				error: {
					message: 'Image not found',
				},
			});
		}

		const filepath = path.join(__dirname, '../../uploads', image.filename);

		const thumbnailPath = path.join(
			__dirname,
			'../../uploads/thumbnails',
			image.thumbnailFilename,
		);

		try {
			fs.unlinkSync(filepath);
		} catch (error) {
			if (error.code !== 'ENOENT') {
				throw error;
			}
		}

		try {
			fs.unlinkSync(thumbnailPath);
		} catch (error) {
			if (error.code !== 'ENOENT') {
				throw error;
			}
		}

		await image.deleteOne();

		return res.status(204).send();
	} catch (error) {
		next(error);
	}
}
