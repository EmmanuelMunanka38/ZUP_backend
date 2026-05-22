import config from '../config';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export interface StorageProvider {
  upload(key: string, buffer: Buffer, mimetype: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

class LocalStorageProvider implements StorageProvider {
  constructor() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  async upload(key: string, buffer: Buffer, _mimetype: string): Promise<string> {
    const filePath = path.join(UPLOADS_DIR, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(UPLOADS_DIR, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  getUrl(key: string): string {
    return `/uploads/${key}`;
  }
}

class S3StorageProvider implements StorageProvider {
  // S3 implementation stub - configure with AWS SDK v3 when ready
  async upload(key: string, _buffer: Buffer, _mimetype: string): Promise<string> {
    return `https://${config.storage.bucket}.s3.${config.storage.region}.amazonaws.com/${key}`;
  }

  async delete(_key: string): Promise<void> {
    // S3 delete implementation
  }

  getUrl(key: string): string {
    return `https://${config.storage.bucket}.s3.${config.storage.region}.amazonaws.com/${key}`;
  }
}

export const getStorageProvider = (): StorageProvider => {
  switch (config.storage.provider) {
    case 's3':
      return new S3StorageProvider();
    case 'local':
    default:
      return new LocalStorageProvider();
  }
};

export const storage = getStorageProvider();
