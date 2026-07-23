"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./swagger");
const swaggerRouter = (0, express_1.Router)();
swaggerRouter.use('/', swagger_ui_express_1.default.serve);
swaggerRouter.get('/', swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Testify API Documentation',
}));
exports.default = swaggerRouter;
//# sourceMappingURL=routes.js.map