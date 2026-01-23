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
const dotenv_1 = require("dotenv");
const env_1 = __importDefault(require("../../config/env"));
(0, dotenv_1.configDotenv)();
class Env {
    static validateEnv(validationSchema) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.validatedEnv = yield validationSchema.validateAsync(env_1.default);
            }
            catch (e) {
                throw e;
            }
        });
    }
    static get(key) {
        var _a;
        if (((_a = this.validatedEnv) === null || _a === void 0 ? void 0 : _a[key]) != null)
            return this.validatedEnv[key];
        return env_1.default[key];
    }
}
exports.default = Env;
//# sourceMappingURL=env.js.map