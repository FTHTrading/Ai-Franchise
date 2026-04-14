import type { UploadResult } from './types';

// ─────────────────────────────────────────────
// StorageService — S3-compatible abstraction (works with AWS S3, Cloudflare R2, MinIO)
// ─────────────────────────────────────────────

export interface StorageConfig {
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
  endpoint?: string;   // custom endpoint for R2/MinIO
  publicBaseUrl?: string;
}

export class StorageService {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async upload(params: {
    key: string;
    body: Buffer | Uint8Array | string;
    contentType: string;
    acl?: 'private' | 'public-read';
  }): Promise<UploadResult> {
    try {
      // Dynamic import to keep the package lightweight when storage isn't used
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

      const client = new S3Client({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKey,
          secretAccessKey: this.config.secretKey,
        },
        ...(this.config.endpoint ? { endpoint: this.config.endpoint } : {}),
      });

      await client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: params.key,
          Body: params.body,
          ContentType: params.contentType,
          ACL: params.acl ?? 'private',
        }),
      );

      const url = this.config.publicBaseUrl
        ? `${this.config.publicBaseUrl}/${params.key}`
        : `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${params.key}`;

      return { success: true, url, key: params.key };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    const client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
      ...(this.config.endpoint ? { endpoint: this.config.endpoint } : {}),
    });

    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  async delete(key: string): Promise<void> {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

    const client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
      ...(this.config.endpoint ? { endpoint: this.config.endpoint } : {}),
    });

    await client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }

  buildKey(organizationId: string, category: string, filename: string): string {
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `orgs/${organizationId}/${category}/${Date.now()}-${safe}`;
  }
}
