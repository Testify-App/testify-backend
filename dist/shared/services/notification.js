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
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("../../config/firebase");
const errors_1 = require("../lib/errors");
function buildPayload(title, body, data, imageUrl) {
    return Object.assign({ notification: Object.assign({ title, body }, (imageUrl && { imageUrl })) }, (data && { data }));
}
class NotificationServiceImpl {
    sendToDevice(token, title, body, data, imageUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const messageId = yield firebase_1.firebaseMessaging.send(Object.assign({ token }, buildPayload(title, body, data, imageUrl)));
                return messageId;
            }
            catch (error) {
                throw new errors_1.InternalServerErrorException(`FCM send failed: ${error.message}`);
            }
        });
    }
    sendToMultipleDevices(tokens, title, body, data, imageUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!tokens.length) {
                return { successCount: 0, failureCount: 0, responses: [] };
            }
            try {
                const result = yield firebase_1.firebaseMessaging.sendMulticast(Object.assign({ tokens }, buildPayload(title, body, data, imageUrl)));
                return {
                    successCount: result.successCount,
                    failureCount: result.failureCount,
                    responses: result.responses.map((r) => {
                        var _a;
                        return ({
                            success: r.success,
                            messageId: r.messageId,
                            error: (_a = r.error) === null || _a === void 0 ? void 0 : _a.message,
                        });
                    }),
                };
            }
            catch (error) {
                throw new errors_1.InternalServerErrorException(`FCM multicast failed: ${error.message}`);
            }
        });
    }
    sendToTopic(topic, title, body, data, imageUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const messageId = yield firebase_1.firebaseMessaging.send(Object.assign({ topic }, buildPayload(title, body, data, imageUrl)));
                return messageId;
            }
            catch (error) {
                throw new errors_1.InternalServerErrorException(`FCM topic send failed: ${error.message}`);
            }
        });
    }
}
const NotificationService = new NotificationServiceImpl();
exports.default = NotificationService;
//# sourceMappingURL=notification.js.map