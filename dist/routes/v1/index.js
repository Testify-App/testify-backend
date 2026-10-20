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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const Response = __importStar(require("../../shared/lib/api-response"));
const database_1 = require("../../config/database");
const logger_1 = __importDefault(require("../../config/logger"));
const routes_1 = __importDefault(require("../../modules/authentication/routes"));
const routes_2 = __importDefault(require("../../modules/posts/routes"));
const routes_3 = __importDefault(require("../../modules/profiles/routes"));
const routes_4 = __importDefault(require("../../modules/hashtags/routes"));
const routes_5 = __importDefault(require("../../modules/search/routes"));
const routes_6 = __importDefault(require("../../modules/guest/routes"));
const routes_7 = __importDefault(require("../../modules/communities/routes"));
const routes_8 = __importDefault(require("../../modules/notifications/routes"));
const routes_9 = __importDefault(require("../../modules/stories/routes"));
const routes_10 = __importDefault(require("../../modules/reports/routes"));
const routes_11 = __importDefault(require("../../modules/uploads/routes"));
const routes_12 = __importDefault(require("../../modules/messaging/routes"));
const appRouter = express_1.default.Router();
appRouter.get('/', (_req, res) => Response.success(res, 'Welcome to Testify API.', http_status_codes_1.StatusCodes.OK));
const HEALTHCHECK_TIMEOUT_MS = Number((_a = process.env.HEALTHCHECK_TIMEOUT_MS) !== null && _a !== void 0 ? _a : 2000);
appRouter.get('/healthcheck/ping', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const startedAt = Date.now();
    try {
        yield Promise.race([
            database_1.db.one('select 1 as ok'),
            new Promise((_resolve, reject) => setTimeout(() => reject(new Error('database health probe timed out')), HEALTHCHECK_TIMEOUT_MS)),
        ]);
        return Response.success(res, 'PONG', http_status_codes_1.StatusCodes.OK, {
            database: 'ok',
            durationMs: Date.now() - startedAt,
        });
    }
    catch (err) {
        logger_1.default.error(err);
        return Response.error(res, new Error('database unreachable'), http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE);
    }
}));
appRouter.use("/auth", routes_1.default);
appRouter.use("/posts", routes_2.default);
appRouter.use("/profiles", routes_3.default);
appRouter.use("/hashtags", routes_4.default);
appRouter.use("/search", routes_5.default);
appRouter.use("/guest", routes_6.default);
appRouter.use("/communities", routes_7.default);
appRouter.use("/notifications", routes_8.default);
appRouter.use("/stories", routes_9.default);
appRouter.use("/reports", routes_10.default);
appRouter.use("/uploads", routes_11.default);
appRouter.use("/", routes_12.default);
exports.Router = appRouter;
//# sourceMappingURL=index.js.map