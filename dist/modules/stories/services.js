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
exports.StoriesServiceImpl = void 0;
const repositories_1 = __importDefault(require("./repositories"));
class StoriesServiceImpl {
    createStory(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.createStory(payload);
        });
    }
    getCircleStories(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.getCircleStories(payload);
        });
    }
    getMyStories(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.getMyStories(payload);
        });
    }
    getStory(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.getStory(payload);
        });
    }
    deleteStory(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.deleteStory(payload);
        });
    }
    getStoryViewers(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.getStoryViewers(payload);
        });
    }
}
exports.StoriesServiceImpl = StoriesServiceImpl;
const StoriesService = new StoriesServiceImpl();
exports.default = StoriesService;
//# sourceMappingURL=services.js.map