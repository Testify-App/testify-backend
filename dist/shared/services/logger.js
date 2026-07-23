"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerImpl = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const dayjs_1 = __importDefault(require("dayjs"));
class LoggerImpl {
    constructor() {
        this.logger = new logger_1.default(LoggerImpl.name);
        this.dateFormat = (0, dayjs_1.default)().format('DD-MMM-YYYY h:mm:ss');
    }
    info(message, ...args) {
        this.logger.log(`${this.dateFormat}: ${message} in ${args[0]}`);
    }
    error(message, ...args) {
        this.logger.error(`${this.dateFormat}: ${message} in ${args[0]}`);
    }
}
exports.LoggerImpl = LoggerImpl;
const logger = new LoggerImpl();
exports.default = logger;
//# sourceMappingURL=logger.js.map