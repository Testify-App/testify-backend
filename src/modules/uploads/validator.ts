import Joi from 'joi';

/**
 * Upload constraints are enforced in TWO places and both matter.
 *
 * These schemas reject obvious nonsense early and cheaply. The real
 * enforcement is in the pre-signed URL itself: content type and content length
 * are part of the signature, so S3 refuses anything that does not match, even
 * if a client ignores whatever the API told it.
 *
 * Validating here alone would be security theatre — the client holds the upload
 * URL and talks to S3 directly, with the API no longer in the path.
 */

/** Matches the prefixes provisioned on the media bucket. */
export const UPLOAD_PURPOSES = ['post', 'profile'] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

/**
 * Deliberately narrow. No SVG — it can carry script and would be served from
 * our own CDN origin. No HEIC: clients should transcode before upload rather
 * than have the server guess.
 */
export const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/** 10 MB. A phone photo is 2-5 MB; this leaves room without inviting abuse. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const presignUploadValidator = Joi.object({
  purpose: Joi.string()
    .valid(...UPLOAD_PURPOSES)
    .required(),

  contentType: Joi.string()
    .valid(...ALLOWED_CONTENT_TYPES)
    .required(),

  /**
   * Required, not optional. The client must commit to a size up front so it can
   * be pinned into the signature — without it S3 would accept a file of any
   * size against a URL we issued.
   */
  contentLength: Joi.number()
    .integer()
    .min(1)
    .max(MAX_UPLOAD_BYTES)
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
