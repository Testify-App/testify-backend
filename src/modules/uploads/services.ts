import { randomUUID } from 'crypto';
import {
  S3Client,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  UploadPurpose,
  UPLOAD_PURPOSES,
  MAX_UPLOAD_BYTES,
  ALLOWED_CONTENT_TYPES,
} from './validator';

/**
 * Direct-to-S3 uploads.
 *
 * Image bytes never pass through this server. The client asks for permission,
 * receives a short-lived signed URL, and sends the file straight to S3. Routing
 * images through Node consumes memory, blocks the event loop, and caps
 * throughput at the instance's bandwidth — with one t4g.small behind a single
 * CloudFront distribution, that is the first thing that would fall over under a
 * burst of uploads.
 *
 * NO CREDENTIALS ARE CONFIGURED HERE, deliberately.
 *
 * On EC2 the SDK reads the instance role from instance metadata. Locally it
 * reads the developer's own `~/.aws` profile. The same code works in both, and
 * there is no access key to leak, rotate, or commit. If you find yourself
 * adding `credentials: { accessKeyId, secretAccessKey }`, something has gone
 * wrong — see README-aws-infrastructure.md #11.
 */
const s3 = new S3Client({
  region: process.env.AWS_S3_REGION ?? process.env.AWS_REGION ?? 'us-east-1',
});

const BUCKET = (): string => {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error(
      'AWS_S3_BUCKET is not set. It is supplied from Parameter Store at /testifyhub/prod/app/AWS_S3_BUCKET.',
    );
  }
  return bucket;
};

/** Public read base. The bucket itself is private; CloudFront is the only reader. */
const CDN_BASE = (): string =>
  (process.env.CDN_BASE_URL ?? 'https://cdn.testifyhub.co').replace(/\/+$/, '');

/** Five minutes — long enough for a slow mobile connection, short enough to matter. */
const URL_TTL_SECONDS = Number(process.env.UPLOAD_URL_TTL_SECONDS ?? 300);

const EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Where a confirmed object lands, matching the prefixes on the bucket. */
const FINAL_PREFIX: Record<UploadPurpose, string> = {
  post: 'posts',
  profile: 'profile',
};

export interface PresignResult {
  uploadUrl: string;
  key: string;
  expiresIn: number;
  maxBytes: number;
  /** The client MUST send exactly this, or S3 rejects the signature. */
  contentType: string;
}

export interface ConfirmResult {
  key: string;
  url: string;
  bytes: number;
  contentType: string;
}

/**
 * Issue a signed URL for a single PUT.
 *
 * ContentType and ContentLength are part of the signature, not advisory. S3
 * refuses the upload if either differs, which is what stops a client uploading
 * a 4 GB file or a script disguised as an image against a URL we handed out.
 */
export const presignUpload = async (
  userId: string,
  purpose: UploadPurpose,
  contentType: string,
  contentLength: number,
): Promise<PresignResult> => {
  if (!ALLOWED_CONTENT_TYPES.includes(contentType as never)) {
    throw new Error(`unsupported content type: ${contentType}`);
  }
  if (contentLength < 1 || contentLength > MAX_UPLOAD_BYTES) {
    throw new Error(`contentLength must be between 1 and ${MAX_UPLOAD_BYTES}`);
  }

  /**
   * Staged under tmp/, namespaced by user. The bucket has a lifecycle rule that
   * deletes anything left under tmp/ after 24 hours, so an upload that is never
   * confirmed cleans itself up — no orphan sweeper to write or run.
   *
   * The user ID in the path means a caller cannot confirm another user's
   * pending upload: confirm checks the prefix against the caller.
   *
   * The purpose is encoded in the filename because `confirm` receives only the
   * key and must know which permanent prefix the object belongs in.
   */
  const key = `tmp/${userId}/${purpose}-${randomUUID()}.${EXTENSION[contentType]}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    }),
    {
      expiresIn: URL_TTL_SECONDS,
      /**
       * `signableHeaders` is load-bearing, not decoration.
       *
       * By default the presigner signs only `content-length;host`. Passing
       * ContentType to the command sets it on the request but leaves it OUT of
       * the signature, so a client could request a URL for `image/png` and then
       * upload anything — verified: S3 accepted `image/jpeg` against a
       * png-signed URL with a 200.
       *
       * Forcing content-type into the signature makes S3 reject any upload
       * whose Content-Type differs from the one that was signed. That is what
       * stops a script being stored and later served from our own CDN origin.
       *
       * Content-length is already signed by default, and is genuinely
       * enforced: declaring 70 bytes then PUTting 5 MB is refused with 403.
       */
      signableHeaders: new Set(['content-type']),
    },
  );

  return {
    uploadUrl,
    key,
    expiresIn: URL_TTL_SECONDS,
    maxBytes: MAX_UPLOAD_BYTES,
    contentType,
  };
};

/**
 * Promote a staged upload to its permanent home and return its CDN URL.
 *
 * The final key is content-addressed — derived from the object's ETag — so a
 * changed image always gets a new URL. That is what lets the CDN cache
 * aggressively and forever without anyone needing to invalidate it.
 */
export const confirmUpload = async (
  userId: string,
  key: string,
): Promise<ConfirmResult> => {
  // A caller may only confirm uploads staged under their own prefix.
  if (!key.startsWith(`tmp/${userId}/`)) {
    throw new Error('key does not belong to the authenticated user');
  }

  const bucket = BUCKET();

  /**
   * Verify the object actually exists, and re-read its real type and size from
   * S3 rather than trusting anything the client says at this point.
   */
  const head = await s3.send(
    new HeadObjectCommand({ Bucket: bucket, Key: key }),
  );

  const contentType = head.ContentType ?? '';
  const bytes = head.ContentLength ?? 0;

  if (!ALLOWED_CONTENT_TYPES.includes(contentType as never)) {
    // Should be impossible — the type was signed — but never promote unchecked.
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    throw new Error(`rejected object with content type: ${contentType}`);
  }
  if (bytes < 1 || bytes > MAX_UPLOAD_BYTES) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    throw new Error(`rejected object of ${bytes} bytes`);
  }

  /**
   * Purpose comes from the filename prefix that `presignUpload` wrote. Parsed
   * explicitly rather than guessed, and rejected if unrecognised — otherwise a
   * malformed key would silently land in the wrong prefix.
   */
  const filename = key.slice(`tmp/${userId}/`.length);
  const purpose = UPLOAD_PURPOSES.find((p) => filename.startsWith(`${p}-`));
  if (!purpose) {
    throw new Error('key does not encode a recognised upload purpose');
  }

  const extension = EXTENSION[contentType];

  // ETag is the content hash for a single-part upload. Quotes are part of the
  // header value and must be stripped.
  const fingerprint = (head.ETag ?? randomUUID()).replace(/"/g, '');
  const finalKey = `${FINAL_PREFIX[purpose]}/${userId}/${fingerprint}.${extension}`;

  await s3.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${key}`,
      Key: finalKey,
      ContentType: contentType,
      MetadataDirective: 'REPLACE',
    }),
  );

  // Best-effort. If this fails the lifecycle rule removes it within 24h anyway.
  await s3
    .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    .catch(() => undefined);

  return {
    key: finalKey,
    url: `${CDN_BASE()}/${finalKey}`,
    bytes,
    contentType,
  };
};

export default { presignUpload, confirmUpload };
