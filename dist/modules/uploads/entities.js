"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extensionForMimeType = exports.UPLOAD_CONTEXT_RULES = void 0;
const MB = 1024 * 1024;
exports.UPLOAD_CONTEXT_RULES = {
    avatar: {
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSizeBytes: 5 * MB,
        keyPrefix: 'avatars',
    },
    community_avatar: {
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSizeBytes: 5 * MB,
        keyPrefix: 'communities/avatars',
    },
    community_cover: {
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSizeBytes: 8 * MB,
        keyPrefix: 'communities/covers',
    },
    post_image: {
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
        maxSizeBytes: 10 * MB,
        keyPrefix: 'posts/images',
    },
    post_video: {
        allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
        maxSizeBytes: 200 * MB,
        keyPrefix: 'posts/videos',
    },
    post_audio: {
        allowedMimeTypes: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm'],
        maxSizeBytes: 20 * MB,
        keyPrefix: 'posts/audio',
    },
    comment_image: {
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSizeBytes: 5 * MB,
        keyPrefix: 'comments/images',
    },
    story_image: {
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSizeBytes: 10 * MB,
        keyPrefix: 'stories/images',
    },
    story_video: {
        allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
        maxSizeBytes: 60 * MB,
        keyPrefix: 'stories/videos',
    },
};
const MIME_TO_EXTENSION = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/webm': 'weba',
};
const extensionForMimeType = (mimeType) => MIME_TO_EXTENSION[mimeType];
exports.extensionForMimeType = extensionForMimeType;
//# sourceMappingURL=entities.js.map