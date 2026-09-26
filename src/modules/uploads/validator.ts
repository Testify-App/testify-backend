import Joi from 'joi';

/**
 * Upload constraints are enforced in TWO places and both matter.
 *
 * These schemas reject obvious nonsense early and cheaply. The real enforcement
 * is in the pre-signed URL itself: content type and content length are part of
 * the signature, so S3 refuses anything that does not match even if a client
 * ignores whatever the API told it.
 *
 * Validating here alone would be security theatre — the client holds the upload
 * URL and talks to S3 directly, with the API no longer in the path.
 */

/** Matches the prefixes provisioned on the media bucket. */
export const UPLOAD_PURPOSES = ['post', 'profile'] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export type MediaKind = 'image' | 'video' | 'audio';

/**
 * Accepted types, the media kind each belongs to, and the file extension used
 * in the stored key.
 *
 * Deliberately a closed list rather than a prefix match on `video/*`. An
 * open-ended match would accept containers nothing can play and formats we have
 * not considered, all served from our own CDN origin.
 *
 * No SVG — it can carry script. No HEIC — clients should transcode before
 * upload rather than have the server guess. `post_type` in the database already
 * has 'image', 'video' and 'audio', so nothing here needs a schema change.
 */
export const MEDIA_TYPES: Record<string, { kind: MediaKind; ext: string }> = {
  'image/jpeg': { kind: 'image', ext: 'jpg' },
  'image/png': { kind: 'image', ext: 'png' },
  'image/webp': { kind: 'image', ext: 'webp' },

  'video/mp4': { kind: 'video', ext: 'mp4' },
  'video/quicktime': { kind: 'video', ext: 'mov' },
  'video/webm': { kind: 'video', ext: 'webm' },

  'audio/mpeg': { kind: 'audio', ext: 'mp3' },
  'audio/mp4': { kind: 'audio', ext: 'm4a' },
  'audio/aac': { kind: 'audio', ext: 'aac' },
};

export const ALLOWED_CONTENT_TYPES = Object.keys(MEDIA_TYPES);

/**
 * Size ceilings per media kind.
 *
 * A single ceiling would mean either rejecting ordinary video or allowing a
 * 100 MB "profile picture". Note that nothing transcodes these — the file is
 * stored and served exactly as uploaded — so the limit is also the bandwidth
 * every viewer pays to download it. Design doc defers transcoding
 * (MediaConvert) to Stage 3.
 */
export const MAX_BYTES: Record<MediaKind, number> = {
  image: 10 * 1024 * 1024, // 10 MB
  audio: 25 * 1024 * 1024, // 25 MB
  video: 100 * 1024 * 1024, // 100 MB
};

/**
 * What each purpose may carry. A profile image is displayed in avatars and
 * headers, so video and audio there make no sense and would just be a way to
 * park large files.
 */
export const ALLOWED_KINDS: Record<UploadPurpose, MediaKind[]> = {
  post: ['image', 'video', 'audio'],
  profile: ['image'],
};

/**
 * How long a signed upload URL lives, per kind.
 *
 * Video gets longer because a 100 MB upload over a phone connection can
 * genuinely take minutes, and a URL that expires mid-transfer wastes the whole
 * upload.
 */
export const URL_TTL_SECONDS: Record<MediaKind, number> = {
  image: 300, // 5 minutes
  audio: 600, // 10 minutes
  video: 900, // 15 minutes
};

const GLOBAL_MAX_BYTES = Math.max(...Object.values(MAX_BYTES));

export const presignUploadValidator = Joi.object({
  purpose: Joi.string()
    .valid(...UPLOAD_PURPOSES)
    .required(),

  contentType: Joi.string()
    .valid(...ALLOWED_CONTENT_TYPES)
    .required()
    .messages({
      'any.only': `contentType must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
    }),

  /**
   * Required, not optional. The client must commit to a size up front so it can
   * be pinned into the signature — without it S3 would accept a file of any
   * size against a URL we issued.
   *
   * Checked here against the largest allowed for any kind; the exact per-kind
   * and per-purpose limit is applied in the service, where the kind is known.
   */
  contentLength: Joi.number()
    .integer()
    .min(1)
    .max(GLOBAL_MAX_BYTES)
    .required(),
});

export const confirmUploadValidator = Joi.object({
  /**
   * Keys are only ever issued by the presign endpoint. Constrained to the
   * staging prefix and to safe characters so a caller cannot use confirm to
   * reach arbitrary objects, or walk out of the prefix with `..`.
   */
  key: Joi.string()
    .max(512)
    .pattern(/^tmp\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/)
    .required()
    .messages({
      'string.pattern.base':
        'key must be an upload key previously issued by /uploads/presign',
    }),
});
