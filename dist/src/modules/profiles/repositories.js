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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilesRepositoryImpl = void 0;
const query_1 = __importDefault(require("./query"));
const entities = __importStar(require("./entities"));
const database_1 = require("../../config/database");
const errors_1 = require("../../shared/lib/errors");
class ProfilesRepositoryImpl {
    getProfile(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const profile = yield database_1.db.oneOrNone(query_1.default.getProfileByUserId, [payload.user_id]);
                if (!profile) {
                    return new errors_1.NotFoundException('Profile not found');
                }
                return new entities.ProfileEntity(profile);
            }
            catch (error) {
                return new errors_1.NotFoundException(`${error.message}`);
            }
        });
    }
    ;
    updateProfile(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const profile = yield database_1.db.one(query_1.default.updateProfile, [
                    payload.user_id,
                    payload.first_name || null,
                    payload.last_name || null,
                    payload.country_code || null,
                    payload.phone_number || null,
                    payload.avatar || null,
                    payload.username || null,
                    payload.bio || null,
                    payload.instagram || null,
                    payload.youtube || null,
                    payload.twitter || null,
                ]);
                return new entities.ProfileEntity(profile);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    ;
}
exports.ProfilesRepositoryImpl = ProfilesRepositoryImpl;
;
const ProfilesRepository = new ProfilesRepositoryImpl();
exports.default = ProfilesRepository;
//# sourceMappingURL=repositories.js.map