import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createR2Client, getR2BucketName, isR2Configured } from '@/lib/r2/client';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

function sanitizeUserId(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9-]/g, '');
}

function generateKey(userId: string, fileType: string): string {
  const ext = MIME_EXTENSIONS[fileType] ?? 'bin';
  const safeUserId = sanitizeUserId(userId);
  const id = crypto.randomUUID();
  const timestamp = Date.now();
  return `uploads/${safeUserId}/${timestamp}-${id}.${ext}`;
}

export async function generateUploadUrl(
  fileType: string,
  userId: string,
): Promise<{ url: string; publicUrl: string; key: string } | null> {
  if (!isR2Configured()) return null;

  const key = generateKey(userId, fileType);
  const client = createR2Client();
  const bucket = getR2BucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: fileType,
  });

  const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;

  return { url, publicUrl, key };
}
