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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_http_1 = __importDefault(require("chai-http"));
const chai_1 = __importStar(require("chai"));
const mocha_1 = require("mocha");
const http_status_codes_1 = require("http-status-codes");
const express_1 = __importDefault(require("../../src/config/express"));
chai_1.default.use(chai_http_1.default);
(0, mocha_1.describe)('Integration test', () => {
    (0, mocha_1.it)('Welcome', (done) => {
        chai_1.default.request(express_1.default)
            .get('/api/v1')
            .end((_err, res) => {
            (0, chai_1.expect)(res.statusCode).to.equal(http_status_codes_1.StatusCodes.OK);
            (0, chai_1.expect)(res.body.message).to.equal('Welcome to Testify API.');
            done();
        });
    });
    (0, mocha_1.it)('Healthcheck', (done) => {
        chai_1.default.request(express_1.default)
            .get('/api/v1/healthcheck/ping')
            .end((_err, res) => {
            (0, chai_1.expect)(res.statusCode).to.equal(http_status_codes_1.StatusCodes.OK);
            (0, chai_1.expect)(res.body.message).to.equal('PONG');
            done();
        });
    });
});
//# sourceMappingURL=app.js.map