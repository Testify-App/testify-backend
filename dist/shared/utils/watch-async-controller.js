"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchAsyncController = void 0;
const WatchAsyncController = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
exports.WatchAsyncController = WatchAsyncController;
//# sourceMappingURL=watch-async-controller.js.map