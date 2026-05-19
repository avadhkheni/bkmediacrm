import multer from 'multer';

// Use memory storage for serverless deployment compatibility (Vercel)
const storage = multer.memoryStorage();

export const uploadAadhar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    // Check extension
    const extMatch = allowedTypes.test(file.originalname.split('.').pop()?.toLowerCase() || '');
    // Check mime
    const mimeMatch = allowedTypes.test(file.mimetype);
    if (extMatch && mimeMatch) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed') as any);
    }
  },
});

export const uploadSignedCopy = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const extMatch = allowedTypes.test(file.originalname.split('.').pop()?.toLowerCase() || '');
    const mimeMatch = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';
    if (extMatch && mimeMatch) {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed') as any);
    }
  },
});
