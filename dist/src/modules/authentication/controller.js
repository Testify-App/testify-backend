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
exports.AuthenticationController = void 0;
const http_status_codes_1 = require("http-status-codes");
const dtos = __importStar(require("./dto"));
const services_1 = __importDefault(require("./services"));
const logger_1 = __importDefault(require("../../shared/services/logger"));
const Response = __importStar(require("../../shared/lib/api-response"));
const errors_1 = require("../../shared/lib/errors");
class AuthenticationController {
    constructor() {
        this.register = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const payload = new dtos.RegisterDTO(req.body);
            const response = yield services_1.default.register(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'authentication.controller.ts');
                return Response.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info(`A verification code has been sent to ${payload.email}.`, 'authentication.controller.ts');
            return Response.success(res, `A verification code has been sent to ${payload.email}.`, http_status_codes_1.StatusCodes.CREATED, response);
        });
        this.activateRegistration = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const payload = new dtos.ActivateRegistrationDTO(req.body);
            const response = yield services_1.default.activateRegistration(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'authentication.controller.ts');
                return Response.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Account has been successfully activated.', 'authentication.controller.ts');
            return Response.success(res, 'Account has been successfully activated.', http_status_codes_1.StatusCodes.OK, response);
        });
        this.usernameAvailability = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const payload = new dtos.UsernameAvailabilityDTO(req.query);
            const response = yield services_1.default.usernameAvailability(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'authentication.controller.ts');
                return Response.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info(`Username ${payload.username} is available`, 'authentication.controller.ts');
            return Response.success(res, `Username ${payload.username} is available`, http_status_codes_1.StatusCodes.OK);
        });
        this.forgotPassword = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const payload = new dtos.ForgotPasswordDTO(req.body);
            const response = yield services_1.default.forgotPassword(payload);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'authentication.controller.ts');
                return Response.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            const message = `A 4-digit OTP code was successfully sent to ${payload.email}`;
            logger_1.default.info(`${message}`, 'authentication.controller.ts');
            return Response.success(res, `${message}`, http_status_codes_1.StatusCodes.OK, response);
        });
        this.verifyForgotPasswordOTP = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const payload = new dtos.verifyForgotPasswordOTP(req.body);
            const response = yield services_1.default.verifyForgotPasswordOTP(res, payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'authentication.controller.ts');
                return Response.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Successfully verified forgot password OTP', 'authentication.controller.ts');
            return Response.success(res, 'Successfully verified forgot password OTP.', http_status_codes_1.StatusCodes.OK, { id: response.id });
        });
        this.resetPassword = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const payload = new dtos.ResetPasswordDTO(req.body);
            payload.hash_id_key = req.get('hash-id-key');
            const response = yield services_1.default.resetPassword(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'authentication.controller.ts');
                return Response.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Successfully reset password', 'authentication.controller.ts');
            return Response.success(res, 'Successfully reset password.', http_status_codes_1.StatusCodes.OK, response);
        });
        this.login = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const payload = new dtos.LoginDTO(req.body);
            const response = yield services_1.default.login(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'authentication.controller.ts');
                return Response.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info(`Successfully logged in.`, 'authentication.controller.ts');
            return Response.success(res, `Successfully logged in.`, http_status_codes_1.StatusCodes.OK, response);
        });
    }
}
exports.AuthenticationController = AuthenticationController;
const authenticationController = new AuthenticationController();
exports.default = authenticationController;
//# sourceMappingURL=controller.js.map