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
exports.NotificationsRepositoryImpl = void 0;
const entities = __importStar(require("./entities"));
const query_1 = __importDefault(require("./query"));
const database_1 = require("../../config/database");
const errors_1 = require("../../shared/lib/errors");
const helpers_1 = require("../../shared/helpers");
const FILTER_TYPE_MAP = {
    mentions: ['mention'],
    likes: ['post_like', 'comment_like'],
    comments: ['post_comment', 'comment_reply'],
    circle_requests: ['circle_request', 'circle_accepted', 'circle_removed'],
    follows: ['follow'],
    moderation: ['post_flagged', 'post_removed', 'post_approved'],
};
class NotificationsRepositoryImpl {
    getNotifications(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '20', user_id, filter } = dto;
                let typeFilter = null;
                if (filter && filter !== 'all' && FILTER_TYPE_MAP[filter]) {
                    typeFilter = FILTER_TYPE_MAP[filter].join(',');
                }
                const [{ count }, rows] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getNotifications,
                    params: [user_id, typeFilter],
                });
                const unreadRow = yield database_1.db.one(query_1.default.getUnreadCount, [user_id]);
                const unread_count = parseInt(unreadRow.count, 10);
                const notifications = rows.map((row) => new entities.NotificationWithActorEntity({
                    id: row.id,
                    user_id: row.user_id,
                    type: row.type,
                    entity_type: row.entity_type,
                    entity_id: row.entity_id,
                    data: row.data,
                    is_read: row.is_read,
                    read_at: row.read_at,
                    created_at: row.created_at,
                    actor: row.actor_id
                        ? { id: row.actor_id, username: row.actor_username, avatar: row.actor_avatar }
                        : undefined,
                }));
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    unread_count,
                    notifications,
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getUnreadCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const row = yield database_1.db.one(query_1.default.getUnreadCount, [userId]);
                return { count: parseInt(row.count, 10) };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    markAsRead(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const row = yield database_1.db.oneOrNone(query_1.default.markAsRead, [
                    dto.notification_id,
                    dto.user_id,
                ]);
                if (!row) {
                    return new errors_1.NotFoundException('Notification not found');
                }
                return new entities.NotificationEntity(row);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    markAllAsRead(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield database_1.db.none(query_1.default.markAllAsRead, [userId]);
                return { message: 'All notifications marked as read' };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    deleteNotification(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existing = yield database_1.db.oneOrNone(query_1.default.getNotificationById, [
                    dto.notification_id,
                    dto.user_id,
                ]);
                if (!existing) {
                    return new errors_1.NotFoundException('Notification not found');
                }
                yield database_1.db.none(query_1.default.deleteNotification, [dto.notification_id, dto.user_id]);
                return { message: 'Notification deleted' };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
}
exports.NotificationsRepositoryImpl = NotificationsRepositoryImpl;
const NotificationsRepository = new NotificationsRepositoryImpl();
exports.default = NotificationsRepository;
//# sourceMappingURL=repositories.js.map