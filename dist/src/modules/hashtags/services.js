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
exports.HashtagsServiceImpl = void 0;
const repositories_1 = __importDefault(require("./repositories"));
class HashtagsServiceImpl {
    constructor() {
        this.getHashtag = (tag) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getHashtag(tag);
        });
        this.getPostsByHashtag = (dto) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getPostsByHashtag(dto);
        });
        this.getTrendingHashtags = (dto) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getTrendingHashtags(dto);
        });
        this.searchHashtags = (dto) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.searchHashtags(dto);
        });
    }
}
exports.HashtagsServiceImpl = HashtagsServiceImpl;
const HashtagsService = new HashtagsServiceImpl();
exports.default = HashtagsService;
//# sourceMappingURL=services.js.map