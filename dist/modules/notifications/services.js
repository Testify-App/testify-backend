"use strict";
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
exports.NotificationsServiceImpl = void 0;
const repositories_1 = __importDefault(require("./repositories"));
class NotificationsServiceImpl {
    getNotifications(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.getNotifications(dto);
        });
    }
    getUnreadCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.getUnreadCount(userId);
        });
    }
    markAsRead(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.markAsRead(dto);
        });
    }
    markAllAsRead(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.markAllAsRead(userId);
        });
    }
    deleteNotification(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.deleteNotification(dto);
        });
    }
}
exports.NotificationsServiceImpl = NotificationsServiceImpl;
const NotificationsService = new NotificationsServiceImpl();
exports.default = NotificationsService;
//# sourceMappingURL=services.js.map