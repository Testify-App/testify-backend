"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const routes_1 = require("../routes");
const routes_2 = __importDefault(require("./swagger/routes"));
const global_error_catcher_middleware_1 = require("../shared/middlewares/global-error-catcher.middleware");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
const corsOptions = {
    exposedHeaders: ['hash-id-key'],
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.static('public'));
app.use((0, helmet_1.default)());
app.disable('x-powered-by');
app.use(routes_1.ROUTE_BASE.V1_PATH, routes_1.Router);
app.use('/docs', routes_2.default);
app.use(global_error_catcher_middleware_1.GlobalErrorCatcherMiddleware);
exports.default = app;
//# sourceMappingURL=express.js.map