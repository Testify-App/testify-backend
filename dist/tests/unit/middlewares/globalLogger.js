"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sinon_1 = __importDefault(require("sinon"));
const global_error_catcher_middleware_1 = require("../../../src/shared/middlewares/global-error-catcher.middleware");
describe('GlobalErrorCatcherMiddleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    beforeEach(() => {
        mockReq = {};
        mockRes = {
            status: sinon_1.default.stub().returnsThis(),
            send: sinon_1.default.stub(),
        };
        mockNext = sinon_1.default.spy();
    });
    it('should handle non-HttpException errors', () => {
        const err = new Error('Some unexpected error');
        (0, global_error_catcher_middleware_1.GlobalErrorCatcherMiddleware)(err, mockReq, mockRes, mockNext);
        sinon_1.default.assert.calledWith(mockRes.status, 500);
        sinon_1.default.assert.calledWith(mockRes.send, 'Internal Server Error');
    });
    it('should handle undefined error', () => {
        (0, global_error_catcher_middleware_1.GlobalErrorCatcherMiddleware)(undefined, mockReq, mockRes, mockNext);
        sinon_1.default.assert.calledWith(mockRes.status, 500);
        sinon_1.default.assert.calledWith(mockRes.send, 'Internal Server Error');
    });
});
//# sourceMappingURL=globalLogger.js.map