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
exports.verifyAdminMiddleware = void 0;
const database_1 = require("../../config/database");
const http_status_codes_1 = require("http-status-codes");
const verifyAdminMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield database_1.db.oneOrNone('SELECT is_admin FROM users WHERE id = $1 AND deleted_at IS NULL', [(_a = req.user) === null || _a === void 0 ? void 0 : _a.id]);
        if (!(user === null || user === void 0 ? void 0 : user.is_admin)) {
            return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
                status: 'error',
                statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                message: 'Admin access required.',
            });
        }
        return next();
    }
    catch (error) {
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            message: 'Failed to verify admin access.',
        });
    }
});
exports.verifyAdminMiddleware = verifyAdminMiddleware;
//# sourceMappingURL=admin.middleware.js.map