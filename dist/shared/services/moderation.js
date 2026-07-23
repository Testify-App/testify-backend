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
exports.classifyContent = classifyContent;
const axios_1 = __importDefault(require("axios"));
const env_1 = __importDefault(require("../utils/env"));
const logger_1 = __importDefault(require("./logger"));
const CATEGORY_MAP = {
    sexual: 'sexual',
    'sexual/minors': 'sexual_minors',
    violence: 'violence',
    'violence/graphic': 'violence_graphic',
    hate: 'hate',
    'hate/threatening': 'hate_threatening',
    harassment: 'harassment',
    'harassment/threatening': 'harassment_threatening',
    'self-harm': 'self_harm',
    'self-harm/intent': 'self_harm_intent',
    'self-harm/instructions': 'self_harm_instructions',
};
function classifyContent(content) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const apiKey = env_1.default.get('OPENAI_API_KEY');
            if (!apiKey) {
                logger_1.default.error('OPENAI_API_KEY not set — skipping moderation', 'moderation.ts');
                return null;
            }
            const { data } = yield axios_1.default.post('https://api.openai.com/v1/moderations', { input: content }, { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } });
            const result = data.results[0];
            const flaggedCategories = Object.entries(result.categories)
                .filter(([, flagged]) => flagged)
                .map(([cat]) => { var _a; return (_a = CATEGORY_MAP[cat]) !== null && _a !== void 0 ? _a : cat; });
            const scores = {};
            for (const [cat, score] of Object.entries(result.category_scores)) {
                scores[(_a = CATEGORY_MAP[cat]) !== null && _a !== void 0 ? _a : cat] = Math.round(score * 1000) / 1000;
            }
            return {
                is_sensitive: result.flagged,
                flagged_at: new Date().toISOString(),
                categories: flaggedCategories,
                scores,
                source: 'openai_moderation',
            };
        }
        catch (error) {
            logger_1.default.error(`Content moderation failed: ${error.message}`, 'moderation.ts');
            return null;
        }
    });
}
//# sourceMappingURL=moderation.js.map