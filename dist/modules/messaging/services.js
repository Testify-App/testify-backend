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
exports.MessagingServiceImpl = void 0;
const repositories_1 = __importDefault(require("./repositories"));
class MessagingServiceImpl {
    constructor() {
        this.getOrCreateConversation = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getOrCreateConversation(payload);
        });
        this.getConversations = (query) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getConversations(query);
        });
        this.getMessages = (query) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getMessages(query);
        });
        this.sendMessage = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.sendMessage(payload);
        });
        this.markConversationRead = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.markConversationRead(payload);
        });
        this.unsendMessage = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.unsendMessage(payload);
        });
        this.reactToMessage = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.reactToMessage(payload);
        });
        this.removeReaction = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.removeReaction(payload);
        });
    }
}
exports.MessagingServiceImpl = MessagingServiceImpl;
const MessagingService = new MessagingServiceImpl();
exports.default = MessagingService;
//# sourceMappingURL=services.js.map