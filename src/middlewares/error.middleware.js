export function errorHandler(err, req, res, next) {
	if (err.code === 'LIMIT_FILE_SIZE') {
		return res.status(400).json({
			error: {
				message: 'File size exceeds 5MB limit',
			},
		});
	}

	if (err.message?.includes('Invalid file type')) {
		return res.status(400).json({
			error: {
				message: err.message,
			},
		});
	}

	if (err.name === 'ValidationError') {
		const messages = Object.values(err.errors)
			.map((e) => e.message)
			.join(', ');

		return res.status(400).json({
			error: {
				message: messages,
			},
		});
	}

	if (err.code === 11000) {
		return res.status(409).json({
			error: {
				message: 'Resource already exists',
			},
		});
	}

	return res.status(err.status || 500).json({
		error: {
			message: err.message || 'Internal server error',
		},
	});
}
