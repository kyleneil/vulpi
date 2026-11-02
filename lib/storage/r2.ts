import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const R2_CONFIG = {
  publicBucket: process.env.R2_PUBLIC_BUCKET || 'vulpi-public-vehicles',
  privateBucket: process.env.R2_PRIVATE_BUCKET || 'vulpi-private-kyc',
  publicCdnUrl: process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '',
};

export function isR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey);
}

let s3ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client | null {
  if (!isR2Configured()) {
    return null;
  }

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });
  }

  return s3ClientInstance;
}

/**
 * Generates a presigned PUT URL for client-side direct-to-R2 upload.
 * Zero bandwidth egress on the server!
 */
export async function getPresignedUploadUrl(
  bucketType: 'public' | 'private',
  key: string,
  contentType: string,
  expiresInSeconds: number = 300 // 5 minutes
): Promise<{ uploadUrl: string; publicUrl?: string; key: string } | null> {
  const client = getR2Client();
  if (!client) return null;

  const bucket = bucketType === 'public' ? R2_CONFIG.publicBucket : R2_CONFIG.privateBucket;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  const publicUrl = bucketType === 'public' && R2_CONFIG.publicCdnUrl
    ? `${R2_CONFIG.publicCdnUrl.replace(/\/$/, '')}/${key}`
    : undefined;

  return { uploadUrl, publicUrl, key };
}

/**
 * Generates a temporary (60-second) presigned GET URL for viewing sensitive KYC documents.
 * Restricts access to authorized owners/admins.
 */
export async function getPresignedViewUrl(
  key: string,
  expiresInSeconds: number = 60
): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  const command = new GetObjectCommand({
    Bucket: R2_CONFIG.privateBucket,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Delete an object from R2
 */
export async function deleteR2Object(bucketType: 'public' | 'private', key: string): Promise<boolean> {
  const client = getR2Client();
  if (!client) return false;

  const bucket = bucketType === 'public' ? R2_CONFIG.publicBucket : R2_CONFIG.privateBucket;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    console.error('[R2 Delete Error]', error);
    return false;
  }
}
