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
exports.RedisServiceImpl = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = __importDefault(require("../utils/env"));
class RedisServiceImpl {
    constructor() {
        this.redisClient = new ioredis_1.default(env_1.default.get('REDIS_URL'), {
            maxRetriesPerRequest: null,
        });
    }
    add(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.redisClient.set(params.key, JSON.stringify(params.value));
                if (params.expiresIn)
                    this.redisClient.expire(params.key, params.expiresIn);
                return true;
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.redisClient.del(key);
                return true;
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const value = yield this.redisClient.get(key);
                if (value)
                    return JSON.parse(value);
                return value;
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
    incrBy(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.redisClient.incrby(params.key, params.value);
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
}
exports.RedisServiceImpl = RedisServiceImpl;
;
const redisService = new RedisServiceImpl();
exports.default = redisService;
//# sourceMappingURL=redis.js.map