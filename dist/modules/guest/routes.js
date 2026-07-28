"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const watch_async_controller_1 = require("../../shared/utils/watch-async-controller");
const controller_1 = __importDefault(require("../posts/controller"));
const controller_2 = __importDefault(require("../profiles/controller"));
const guestRouter = (0, express_1.Router)();
guestRouter.get('/posts', (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getGuestPosts));
guestRouter.get('/profiles/:username', (0, watch_async_controller_1.WatchAsyncController)(controller_2.default.getGuestProfile));
exports.default = guestRouter;
//# sourceMappingURL=routes.js.map