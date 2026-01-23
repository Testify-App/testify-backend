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
exports.OTPGenerateServiceImpl = void 0;
const crypto = __importStar(require("crypto"));
const env_1 = __importDefault(require("../utils/env"));
const database_1 = require("../../config/database");
const query_1 = __importDefault(require("../../modules/authentication/query"));
;
class OTPGenerateServiceImpl {
    constructor() {
        this.cryptoSecret = env_1.default.get('CRYPTO_SECRET');
        this.timeStep = env_1.default.get('CRYPTO_TIME_STEP');
        this.otpLength = env_1.default.get('CRYPTO_OTP_LENGTH');
        this.hashAlgorithm = env_1.default.get('CRYPTO_HASH_ALGO');
    }
    generateTOTP(payload, entity, t) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTime = Math.floor(Date.now() / 1000);
            const counter = Math.floor(currentTime / this.timeStep);
            const counterBuffer = Buffer.alloc(8);
            counterBuffer.writeUInt32BE(counter, 4);
            const hmac = crypto
                .createHmac(this.hashAlgorithm, this.cryptoSecret)
                .update(counterBuffer)
                .digest();
            const offset = hmac[hmac.length - 1] & 0x0f;
            const otpBytes = new Uint8Array(hmac.buffer, hmac.byteOffset + offset, 4);
            const otpValue = new DataView(otpBytes.buffer, otpBytes.byteOffset, otpBytes.byteLength).getUint32(0, false) % Math.pow(10, this.otpLength);
            const expirationTime = Date.now() + payload.expiresIn * 60 * 1000;
            const otpExpiration = new Date(expirationTime);
            const executor = t !== null && t !== void 0 ? t : database_1.db;
            if (entity === 'admin') {
                yield executor.none(query_1.default.customerVerificationCode, [
                    payload.id,
                    otpValue,
                    otpExpiration,
                ]);
                return otpValue.toString().padStart(this.otpLength, '0');
            }
            yield executor.none(query_1.default.customerVerificationCode, [
                payload.id,
                otpValue,
                otpExpiration,
            ]);
            return otpValue.toString().padStart(this.otpLength, '0');
        });
    }
    ;
    validateTOTP(payload, entity, t) {
        return __awaiter(this, void 0, void 0, function* () {
            const executor = t !== null && t !== void 0 ? t : database_1.db;
            const result = yield executor.one(entity === 'admin' ? query_1.default.validateBackofficeVerificationCode : query_1.default.validateCustomerVerificationCode, [payload.id]);
            const current_time = new Date().toISOString();
            if (result.verification_code_expiry_time !== null &&
                result.verification_code_expiry_time.toISOString() < current_time) {
                return false;
            }
            if (result.verification_code !== payload.token) {
                return false;
            }
            yield executor.none(entity === 'admin' ? query_1.default.clearBackofficeVerificationCode : query_1.default.clearCustomerVerificationCode, [payload.id]);
            return true;
        });
    }
    ;
}
exports.OTPGenerateServiceImpl = OTPGenerateServiceImpl;
;
const otpGenerate = new OTPGenerateServiceImpl();
exports.default = otpGenerate;
//# sourceMappingURL=token.js.map