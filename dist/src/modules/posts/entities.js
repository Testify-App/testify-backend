"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentWithUserEntity = exports.PostWithUserEntity = exports.PostBookmarkEntity = exports.PostMentionEntity = exports.RepostEntity = exports.CommentLikeEntity = exports.PostLikeEntity = exports.CommentEntity = exports.PostEntity = exports.PostVisibility = exports.PostType = void 0;
const base_entity_1 = require("../../shared/utils/base-entity");
var PostType;
(function (PostType) {
    PostType["TEXT"] = "text";
    PostType["IMAGE"] = "image";
    PostType["VIDEO"] = "video";
    PostType["AUDIO"] = "audio";
    PostType["MIXED"] = "mixed";
})(PostType || (exports.PostType = PostType = {}));
var PostVisibility;
(function (PostVisibility) {
    PostVisibility["PUBLIC"] = "public";
    PostVisibility["FOLLOWERS_ONLY"] = "followers_only";
    PostVisibility["MENTIONED_ONLY"] = "mentioned_only";
    PostVisibility["PRIVATE"] = "private";
})(PostVisibility || (exports.PostVisibility = PostVisibility = {}));
class PostEntity extends base_entity_1.BaseEntity {
}
exports.PostEntity = PostEntity;
class CommentEntity extends base_entity_1.BaseEntity {
}
exports.CommentEntity = CommentEntity;
class PostLikeEntity extends base_entity_1.BaseEntity {
}
exports.PostLikeEntity = PostLikeEntity;
class CommentLikeEntity extends base_entity_1.BaseEntity {
}
exports.CommentLikeEntity = CommentLikeEntity;
class RepostEntity extends base_entity_1.BaseEntity {
}
exports.RepostEntity = RepostEntity;
class PostMentionEntity extends base_entity_1.BaseEntity {
}
exports.PostMentionEntity = PostMentionEntity;
class PostBookmarkEntity extends base_entity_1.BaseEntity {
}
exports.PostBookmarkEntity = PostBookmarkEntity;
class PostWithUserEntity extends base_entity_1.BaseEntity {
}
exports.PostWithUserEntity = PostWithUserEntity;
class CommentWithUserEntity extends base_entity_1.BaseEntity {
}
exports.CommentWithUserEntity = CommentWithUserEntity;
//# sourceMappingURL=entities.js.map