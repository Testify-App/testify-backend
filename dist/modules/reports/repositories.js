"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsRepositoryImpl = void 0;
const entities = __importStar(require("./entities"));
const query_1 = __importDefault(require("./query"));
const database_1 = require("../../config/database");
const errors_1 = require("../../shared/lib/errors");
const helpers_1 = require("../../shared/helpers");
function mapToEntity(row) {
    const isPost = row.entity_type === 'post';
    return new entities.ReportEntity({
        id: row.id,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        content_owner_id: row.content_owner_id,
        reporter_id: row.reporter_id,
        reason: row.reason,
        details: row.details,
        status: row.status,
        moderator_action: row.moderator_action,
        reviewed_by: row.reviewed_by,
        reviewed_at: row.reviewed_at,
        created_at: row.created_at,
        reporter: { username: row.reporter_username, avatar: row.reporter_avatar },
        content_owner: {
            id: row.content_owner_id,
            username: row.content_owner_username,
            avatar: row.content_owner_avatar,
        },
        content: isPost
            ? (row.post_id ? {
                id: row.post_id,
                content: row.post_content,
                media_attachments: row.post_media_attachments,
                created_at: row.post_created_at,
            } : null)
            : (row.comment_id ? {
                id: row.comment_id,
                content: row.comment_content,
                media_attachments: row.comment_media_attachments,
                created_at: row.comment_created_at,
            } : null),
    });
}
class ReportsRepositoryImpl {
    createReport(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ownerRow = yield database_1.db.oneOrNone(payload.entity_type === 'post' ? query_1.default.getPostOwner : query_1.default.getCommentOwner, [payload.entity_id]);
                if (!ownerRow) {
                    return new errors_1.NotFoundException(`${payload.entity_type === 'post' ? 'Post' : 'Comment'} not found`);
                }
                if (ownerRow.user_id === payload.reporter_id) {
                    return new errors_1.BadException('You cannot report your own content');
                }
                const created = yield database_1.db.oneOrNone(query_1.default.createReport, [
                    payload.entity_type,
                    payload.entity_id,
                    ownerRow.user_id,
                    payload.reporter_id,
                    payload.reason,
                    payload.details || null,
                ]);
                if (!created) {
                    return new errors_1.BadException('You have already reported this content');
                }
                if (payload.entity_type === 'post') {
                    yield database_1.db.none('UPDATE posts SET report_count = report_count + 1 WHERE id = $1', [payload.entity_id]);
                }
                return new entities.ReportEntity(created);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getReports(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '20' } = query;
                const [{ count }, rows] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getReports,
                    params: [query.status || null, query.entity_type || null],
                });
                const reports = rows.map((row) => mapToEntity(row));
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    reports,
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    reviewReport(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updated = yield database_1.db.oneOrNone(query_1.default.updateReportStatus, [
                    payload.report_id,
                    payload.status,
                    payload.moderator_action || null,
                    payload.reviewer_id,
                ]);
                if (!updated) {
                    return new errors_1.NotFoundException('Report not found');
                }
                return new entities.ReportEntity(updated);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
}
exports.ReportsRepositoryImpl = ReportsRepositoryImpl;
const ReportsRepository = new ReportsRepositoryImpl();
exports.default = ReportsRepository;
//# sourceMappingURL=repositories.js.map