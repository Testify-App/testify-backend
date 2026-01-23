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
exports.HashingServiceImpl = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const env_1 = __importDefault(require("../utils/env"));
const uuid_1 = require("uuid");
class HashingServiceImpl {
    constructor() {
        this.saltRound = env_1.default.get('SALT_ROUND');
    }
    hash(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, salt = bcrypt_1.default.genSaltSync(Number(this.saltRound))) {
            return bcrypt_1.default.hash(data, salt);
        });
    }
    compare(data, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            return bcrypt_1.default.compare(data, hash);
        });
    }
    generateVerificationHash() {
        return (0, uuid_1.v1)();
    }
}
exports.HashingServiceImpl = HashingServiceImpl;
const hashingService = new HashingServiceImpl();
exports.default = hashingService;
//# sourceMappingURL=hashing.js.map