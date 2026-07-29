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
exports.NotificationsController = void 0;
const http_status_codes_1 = require("http-status-codes");
const dtos = __importStar(require("./dto"));
const services_1 = __importDefault(require("./services"));
const ResponseBuilder = __importStar(require("../../shared/lib/api-response"));
const errors_1 = require("../../shared/lib/errors");
class NotificationsController {
    constructor() {
        this.getNotifications = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.GetNotificationsQueryDTO(req.query);
            dto.user_id = req.user.id;
            const response = yield services_1.default.getNotifications(dto);
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Notifications retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getUnreadCount = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const response = yield services_1.default.getUnreadCount(req.user.id);
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Unread count retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.markAsRead = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.NotificationIdDTO({
                user_id: req.user.id,
                notification_id: req.params.notificationId,
            });
            const response = yield services_1.default.markAsRead(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Notification marked as read', http_status_codes_1.StatusCodes.OK, response);
        });
        this.markAllAsRead = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const response = yield services_1.default.markAllAsRead(req.user.id);
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'All notifications marked as read', http_status_codes_1.StatusCodes.OK, response);
        });
        this.deleteNotification = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.NotificationIdDTO({
                user_id: req.user.id,
                notification_id: req.params.notificationId,
            });
            const response = yield services_1.default.deleteNotification(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Notification deleted', http_status_codes_1.StatusCodes.OK, null);
        });
    }
}
exports.NotificationsController = NotificationsController;
const notificationsController = new NotificationsController();
exports.default = notificationsController;
//# sourceMappingURL=controller.js.map