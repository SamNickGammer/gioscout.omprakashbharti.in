import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { serverEnv } from './env';

let client: S3Client | null = null;

function r2Client(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${serverEnv.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: serverEnv.r2.accessKeyId,
      secretAccessKey: serverEnv.r2.secretAccessKey,
    },
  });
  return client;
}

/** Presigned PUT URL for the browser to upload directly to R2. */
export async function presignUpload(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: serverEnv.r2.bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client(), command, { expiresIn: 600 });
}

export async function deleteObject(key: string): Promise<void> {
  await r2Client().send(
    new DeleteObjectCommand({ Bucket: serverEnv.r2.bucket, Key: key }),
  );
}

export function publicUrlFor(key: string): string {
  const base = serverEnv.r2.publicUrl.replace(/\/$/, '');
  return base ? `${base}/${key}` : key;
}
