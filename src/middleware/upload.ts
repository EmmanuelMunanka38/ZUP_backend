import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_TYPES.join(', ')}`));
    }
  },
});

const extensionMap: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const getFileExtension = (mimetype: string): string => extensionMap[mimetype] || '.jpg';

export const generateFileName = (mimetype: string, folder?: string): string => {
  const ext = getFileExtension(mimetype);
  const name = uuidv4() + ext;
  return folder ? `${folder}/${name}` : name;
};

export default upload;
