import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3Client, S3_BUCKET } from '../config/s3';

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // accept
  } else {
    cb(new Error('Only JPG, PNG, and PDF files are allowed'));
  }
};

const createS3Storage = (folder: string) =>
  multerS3({
    s3: s3Client,
    bucket: S3_BUCKET,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const timestamp = Date.now();
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `drivers/${folder}/${timestamp}-${safeName}`);
    },
  });

export const uploadSingle = multer({
  storage: createS3Storage('profile'),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

export const uploadFields = multer({
  storage: createS3Storage('documents'),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});