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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDataMiddleware = void 0;
const http_status_codes_1 = require("http-status-codes");
const validateDataMiddleware = (validationSchema, type) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const getType = {
        body: req.body,
        params: req.params,
        query: req.query,
        headers: req.headers,
        file: req.file,
    };
    const options = { messages: { key: '{{key}} ' }, abortEarly: false };
    const data = getType[type];
    try {
        const validatedData = yield validationSchema.validateAsync(data, options);
        req[type] = validatedData;
        return next();
    }
    catch (error) {
        if (error.isJoi) {
            const message = ((_c = (_b = (_a = error.details) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.replace(/"/g, '')) || 'Validation failed';
            return res.status(http_status_codes_1.StatusCodes.UNPROCESSABLE_ENTITY).json({
                status: 'error',
                statusCode: http_status_codes_1.StatusCodes.UNPROCESSABLE_ENTITY,
                message,
            });
        }
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal server error',
        });
    }
});
exports.validateDataMiddleware = validateDataMiddleware;
//# sourceMappingURL=request-validator.middleware.js.map