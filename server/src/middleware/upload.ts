import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { AppError } from '../utils/errors';

const ALLOWED_MIMES: Record<string, string[]> = {
  csv: ['text/csv', 'application/csv'],
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

const uploadDir = config.resume.uploadDir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const memoryStorage = multer.memoryStorage();

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = Object.values(ALLOWED_MIMES).flat();
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} is not allowed. Allowed types: CSV, PDF, DOCX, JPEG, PNG, GIF, WebP`, 400));
  }
}

export const uploadDisk = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.resume.maxSizeMB * 1024 * 1024 },
});

export const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: config.resume.maxSizeMB * 1024 * 1024 },
});
