"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = exports.error = void 0;
const error = (res, error, code) => {
    return res.status(code).json({
        status: 'error',
        code: code,
        message: error.message,
    });
};
exports.error = error;
const success = (res, message, code, data) => {
    return res.status(code).json({
        status: 'success',
        message,
        code,
        data,
    });
};
exports.success = success;
//# sourceMappingURL=api-response.js.map