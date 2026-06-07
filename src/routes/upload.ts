import { Router, Response } from 'express';
import upload, { generateFileName } from '../middleware/upload';
import { storage } from '../services/storage.service';
import auth, { AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', auth, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }

    const folder = (req.body.folder as string) || 'general';
    const key = generateFileName(req.file.mimetype, folder);
    const url = await storage.upload(key, req.file.buffer, req.file.mimetype);

    res.json({ success: true, data: { url, key } });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
});

export default router;
