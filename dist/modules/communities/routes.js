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
const express_1 = require("express");
const communitiesValidator = __importStar(require("./validator"));
const controller_1 = __importDefault(require("./controller"));
const AuthenticationMiddleware = __importStar(require("../../shared/middlewares/auth.middleware"));
const watch_async_controller_1 = require("../../shared/utils/watch-async-controller");
const request_validator_middleware_1 = require("../../shared/middlewares/request-validator.middleware");
const verifyAuth = AuthenticationMiddleware.verifyAuthTokenMiddleware;
const communitiesRouter = (0, express_1.Router)();
communitiesRouter.post('/', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.createCommunityValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.createCommunity));
communitiesRouter.get('/me', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.getMyCommunitiesValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getMyCommunities));
communitiesRouter.get('/joined', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.getMyCommunitiesValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getJoinedCommunities));
communitiesRouter.get('/:communityId', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityIdValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getCommunity));
communitiesRouter.patch('/:communityId', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.updateCommunityValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.updateCommunity));
communitiesRouter.delete('/:communityId', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.deleteCommunityValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.deleteCommunity));
communitiesRouter.post('/:communityId/join', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityIdValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.joinCommunity));
communitiesRouter.delete('/:communityId/leave', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityIdValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.leaveCommunity));
communitiesRouter.get('/:communityId/requests', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.getCommunityMembersValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getPendingRequests));
communitiesRouter.post('/:communityId/requests/:userId/accept', verifyAuth, (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.acceptJoinRequest));
communitiesRouter.delete('/:communityId/requests/:userId/decline', verifyAuth, (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.declineJoinRequest));
communitiesRouter.get('/:communityId/members', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.getCommunityMembersValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getCommunityMembers));
communitiesRouter.get('/testimonies/me', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.getCommunityTestimoniesValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getUserCommunityTestimonies));
communitiesRouter.get('/testimonies/user/:userId', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.getCommunityTestimoniesValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getUserCommunityTestimonies));
communitiesRouter.post('/:communityId/testimonies', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.createCommunityPostValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.createCommunityPost));
communitiesRouter.get('/:communityId/testimonies', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.getCommunityTestimoniesValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getCommunityTestimonies));
communitiesRouter.delete('/:communityId/members/:userId', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityUserParamsValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.removeMember));
communitiesRouter.post('/:communityId/members/:userId/ban', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityUserParamsValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.banMemberValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.banMember));
communitiesRouter.delete('/:communityId/testimonies/:testimonyId', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityTestimonyParamsValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.removeTestimony));
communitiesRouter.patch('/:communityId/testimonies/:testimonyId/pin', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityTestimonyParamsValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.pinTestimony));
communitiesRouter.post('/:communityId/report', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.reportValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.reportCommunity));
communitiesRouter.post('/:communityId/testimonies/:testimonyId/report', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityTestimonyParamsValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.reportValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.reportTestimony));
communitiesRouter.get('/:communityId/reported', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.getCommunityMembersValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getReportedContent));
communitiesRouter.patch('/:communityId/reported/:reportId', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.communityReportParamsValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(communitiesValidator.reviewReportValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.reviewReport));
exports.default = communitiesRouter;
//# sourceMappingURL=routes.js.map