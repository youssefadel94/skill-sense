import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class GcsService {
  private readonly logger = new Logger(GcsService.name);
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor() {
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
    });
    this.bucketName = process.env.GCS_BUCKET_NAME || 'skill-sense-uploads';
    this.logger.log('GCS service initialized');
  }

  async uploadFile(file: Buffer, filename: string, contentType: string = 'application/octet-stream'): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(filename);

    await blob.save(file, {
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Return GCS URI format for Vertex AI
    const gcsUri = `gs://${this.bucketName}/${filename}`;
    this.logger.log(`File uploaded: ${gcsUri}`);
    return gcsUri;
  }

  async downloadFile(filename: string): Promise<Buffer> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filename);
    const [contents] = await file.download();
    return contents;
  }

  async deleteFile(filename: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    await bucket.file(filename).delete();
    this.logger.log(`File deleted: ${filename}`);
  }

  async getSignedUrl(filename: string, expiresIn: number = 3600): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filename);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });

    return url;
  }
}
