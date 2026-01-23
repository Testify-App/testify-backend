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
exports.AuthenticationServiceImpl = void 0;
const env_1 = __importDefault(require("../../shared/utils/env"));
const repositories_1 = __importDefault(require("./repositories"));
const token_1 = __importDefault(require("../../shared/services/token"));
const errors_1 = require("../../shared/lib/errors");
class AuthenticationServiceImpl {
    constructor() {
        this.register = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.register(payload);
        });
        this.activateRegistration = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.activateRegistration(payload);
        });
        this.usernameAvailability = (payload) => __awaiter(this, void 0, void 0, function* () {
            const response = yield repositories_1.default.usernameAvailability(payload);
            if (response instanceof errors_1.BadException) {
                return response;
            }
            return yield token_1.default.generateTOTP({ id: response, expiresIn: 5 }, 'user');
        });
        this.verifyForgotPasswordOTP = (res, payload) => __awaiter(this, void 0, void 0, function* () {
            const response = yield repositories_1.default.verifyForgotPasswordOTP(res, payload);
            if (response instanceof errors_1.BadException) {
                return response;
            }
            res.setHeader('hash-id-key', response.hash_id_key);
            return response;
        });
        this.resetPassword = (payload) => __awaiter(this, void 0, void 0, function* () {
            const { new_password, confirm_new_password } = payload;
            if (new_password !== confirm_new_password) {
                return new errors_1.BadException('Password does not match confirm password field');
            }
            const response = yield repositories_1.default.resetPassword(payload);
            return response;
        });
        this.login = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.login(payload);
        });
    }
    forgotPassword(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield repositories_1.default.forgotPassword(payload);
            if (response instanceof errors_1.NotFoundException) {
                return response;
            }
            env_1.default.get('NODE_ENV') !== 'test' && delete response.otp;
            return response;
        });
    }
    ;
}
exports.AuthenticationServiceImpl = AuthenticationServiceImpl;
const AuthenticationServices = new AuthenticationServiceImpl();
exports.default = AuthenticationServices;
//# sourceMappingURL=services.js.map