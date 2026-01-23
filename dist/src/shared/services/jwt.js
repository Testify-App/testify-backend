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
exports.JwtSigningServiceImpl = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../utils/env"));
const env_2 = require("../../config/env");
class JwtSigningServiceImpl {
    constructor() {
        this.JwtSigned = env_2.JwtSignOptions;
        this.jwtSecret = env_1.default.get('JWT_SECRET');
    }
    verify(Token) {
        return jsonwebtoken_1.default.verify(Token, this.jwtSecret);
    }
    sign(payload, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return jsonwebtoken_1.default.sign(payload, this.jwtSecret, Object.assign(Object.assign({}, this.JwtSigned), options));
        });
    }
}
exports.JwtSigningServiceImpl = JwtSigningServiceImpl;
const jwtSigningService = new JwtSigningServiceImpl();
exports.default = jwtSigningService;
//# sourceMappingURL=jwt.js.map