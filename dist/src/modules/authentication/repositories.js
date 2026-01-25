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
exports.AuthenticationRepositoryImpl = void 0;
const crypto_1 = __importDefault(require("crypto"));
const entities = __importStar(require("./entities"));
const query_1 = __importDefault(require("./query"));
const database_1 = require("../../config/database");
const token_1 = __importDefault(require("../../shared/services/token"));
const jwt_1 = __importDefault(require("../../shared/services/jwt"));
const hashing_1 = __importDefault(require("../../shared/services/hashing"));
const MailService = __importStar(require("../../shared/lib/email/index"));
const errors_1 = require("../../shared/lib/errors");
const helpers_1 = require("../../shared/helpers");
class AuthenticationRepositoryImpl {
    register(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const existingUser = yield t.oneOrNone('SELECT id, activated_at FROM users WHERE email = $1;', [payload.email]);
                    if (existingUser) {
                        if (existingUser.activated_at) {
                            throw new errors_1.BadException('Email already exists');
                        }
                        else {
                            const otp = yield token_1.default.generateTOTP({ id: existingUser.id, expiresIn: 5 }, 'user', t);
                            yield MailService.registerTOTP(payload.email, otp, payload.username, 5);
                            const data = new entities.UserEntity({
                                id: existingUser.id,
                            });
                            return data;
                        }
                    }
                    const hashedPassword = yield hashing_1.default.hash(payload.password);
                    const user = yield database_1.db.one(query_1.default.register, [
                        payload.email,
                        hashedPassword,
                        payload.dob,
                        payload.username,
                        payload.profile_image,
                        payload.terms_and_condition,
                    ]);
                    const otp = yield token_1.default.generateTOTP({ id: user.id, expiresIn: 5 }, 'user', t);
                    const data = new entities.UserEntity({
                        id: user.id,
                    });
                    yield MailService.registerTOTP(payload.email, otp, payload.username, 5);
                    return data;
                }));
                return response;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    ;
    activateRegistration(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const user = yield t.oneOrNone(query_1.default.activateRegistration, [payload.id]);
                    if (!user) {
                        throw new errors_1.BadException('Invalid user id.');
                    }
                    const isValid = yield token_1.default.validateTOTP({ id: user.id, token: payload.token }, 'user', t);
                    if (!isValid) {
                        throw new errors_1.BadException('Invalid or expired OTP credentials.');
                    }
                    const signedData = {
                        id: user.id,
                        email: user.email,
                    };
                    const jwt_token = yield jwt_1.default.sign(signedData);
                    const data = new entities.UserEntity({
                        id: user.id,
                        email: user.email,
                        token: jwt_token,
                        status: user.status,
                    });
                    return data;
                }));
                return response;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    ;
    usernameAvailability(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield database_1.db.oneOrNone('SELECT id FROM users WHERE username = $1', [payload.username]);
            if (existingUser) {
                return new errors_1.BadException('Username already exists');
            }
            return 'Username available';
        });
    }
    ;
    forgotPassword(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const user = yield t.oneOrNone('SELECT id, username FROM users WHERE email = $1', [payload.email]);
                    if (!user) {
                        throw new errors_1.NotFoundException('Email does not exist.');
                    }
                    const otp = yield token_1.default.generateTOTP({ id: user.id, expiresIn: 5 }, 'user', t);
                    const data = new entities.UserEntity({
                        id: user.id,
                        otp: otp,
                    });
                    yield MailService.forgotPassword(payload.email, otp, user.username, 5);
                    return data;
                }));
                return response;
            }
            catch (error) {
                return new errors_1.NotFoundException(`${error.message}`);
            }
        });
    }
    ;
    verifyForgotPasswordOTP(_res, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const verificationHash = hashing_1.default.generateVerificationHash();
                    const user = yield t.oneOrNone(`UPDATE users SET hash_id_key = $2 WHERE id = $1 RETURNING id`, [
                        payload.id, verificationHash,
                    ]);
                    if (!user) {
                        throw new errors_1.BadException('Invalid user id.');
                    }
                    const isValid = yield token_1.default.validateTOTP({ id: user.id, token: payload.token }, 'user', t);
                    if (!isValid) {
                        throw new errors_1.BadException('Invalid or expired OTP credentials.');
                    }
                    const data = new entities.UserEntity({
                        id: user.id,
                        hash_id_key: verificationHash,
                    });
                    return data;
                }));
                return response;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    ;
    resetPassword(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const user = yield t.oneOrNone(`SELECT hash_id_key FROM users WHERE id = $1`, [payload.id]);
                    if (!user) {
                        throw new errors_1.BadException('Invalid user id.');
                    }
                    if (user.hash_id_key !== payload.hash_id_key) {
                        throw new errors_1.BadException('Invalid or expired hash-id-key.');
                    }
                    const hashedPassword = yield hashing_1.default.hash(payload.new_password);
                    yield t.none(query_1.default.resetPassword, [payload.id, hashedPassword]);
                    const data = new entities.UserEntity({
                        id: payload.id,
                    });
                    return data;
                }));
                return response;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    ;
    login(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const user = yield t.oneOrNone(query_1.default.login, [payload.email]);
                    if (!user) {
                        throw new errors_1.BadException('Invalid login credentials.');
                    }
                    if (user.status === 'deactivated') {
                        throw new errors_1.BadException('Your account is deactivated. Contact support for assistance.');
                    }
                    const isValid = yield hashing_1.default.compare(payload.password, user.password);
                    if (!isValid) {
                        throw new errors_1.BadException('Invalid login credentials.');
                    }
                    const session_id = crypto_1.default.randomBytes(32).toString('hex');
                    const setLoginTime = yield (0, helpers_1.setLastLoginTime)([user.id, session_id], 'user', t);
                    const signedData = {
                        id: user.id,
                        email: user.email,
                        password: user.password,
                    };
                    const jwt_token = yield jwt_1.default.sign(signedData);
                    const data = new entities.UserEntity({
                        id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        username: user.username,
                        avatar: user.avatar,
                        phone_number: user.phone_number,
                        status: user.status,
                        token: jwt_token,
                    });
                    yield t.batch([user, setLoginTime]);
                    return data;
                }));
                return response;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    ;
}
exports.AuthenticationRepositoryImpl = AuthenticationRepositoryImpl;
const authenticationRepository = new AuthenticationRepositoryImpl();
exports.default = authenticationRepository;
//# sourceMappingURL=repositories.js.map