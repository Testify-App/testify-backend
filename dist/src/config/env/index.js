"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtSignOptions = void 0;
const production_1 = __importDefault(require("./production"));
const development_1 = __importDefault(require("./development"));
const staging_1 = __importDefault(require("./staging"));
const test_1 = __importDefault(require("./test"));
exports.JwtSignOptions = {
    issuer: 'Testify',
    subject: 'Authentication Token',
    audience: 'https://testify.com',
};
exports.default = {
    production: production_1.default,
    development: development_1.default,
    staging: staging_1.default,
    test: test_1.default,
}[(_a = process.env.TESTIFY_NODE_ENV) !== null && _a !== void 0 ? _a : 'development'];
//# sourceMappingURL=index.js.map