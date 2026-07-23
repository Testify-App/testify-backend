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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("./config/express"));
const env_1 = __importDefault(require("./shared/utils/env"));
const logger_1 = __importDefault(require("./config/logger"));
const database_1 = require("./config/database");
const enums_1 = require("./shared/enums");
const env_validator_1 = require("./shared/env-validator");
function main(app) {
    return __awaiter(this, void 0, void 0, function* () {
        const logger = new logger_1.default(app.name);
        yield env_1.default.validateEnv(env_validator_1.envValidatorSchema);
        yield database_1.db.connect();
        const server = http_1.default.createServer(app);
        const PORT = env_1.default.get('PORT') || 8080;
        const NODE_ENV = env_1.default.get('NODE_ENV');
        NODE_ENV !== enums_1.AppEnv.PRODUCTION &&
            server.on('listening', () => {
                logger.log(`Listening on http://localhost:${PORT}`);
                logger.log(`Swagger Documentation: http://localhost:${PORT}/docs`);
            });
        server.listen(PORT);
    });
}
main(express_1.default);
//# sourceMappingURL=index.js.map