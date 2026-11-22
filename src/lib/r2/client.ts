import { S3Client } from '@aws-sdk/client-s3';

let cachedClient: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
  );
}

function resolveR2Endpoint(): string | undefined {
  if (process.env.R2_ENDPOINT) return process.env.R2_ENDPOINT;
  const accountId = process.env.R2_ACCOUNT_ID;
  if (accountId) return `https://${accountId}.r2.cloudflarestorage.com`;
  return undefined;
}

export function createR2Client(): S3Client {
  if (cachedClient) return cachedClient;

  const endpoint = resolveR2Endpoint();
  cachedClient = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  return cachedClient;
}

export function getR2BucketName(): string {
  return process.env.R2_BUCKET_NAME!;
}
