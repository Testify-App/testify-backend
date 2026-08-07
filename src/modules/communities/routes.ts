import { Router, RequestHandler } from 'express';
import * as communitiesValidator from './validator';
import communitiesController from './controller';
import * as AuthenticationMiddleware from '../../shared/middlewares/auth.middleware';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../../shared/middlewares/request-validator.middleware';

const verifyAuth: RequestHandler = AuthenticationMiddleware.verifyAuthTokenMiddleware as RequestHandler;

/**
 * @swagger
 * tags:
 *   name: Communities
 *   description: Community management endpoints
 */

const communitiesRouter = Router();

/**
 * @swagger
 * /communities:
 *   post:
 *     summary: Create a new community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: uri
 *               cover_image:
 *                 type: string
 *                 format: uri
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *               rules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *     responses:
 *       201:
 *         description: Community created successfully
 *       400:
 *         description: Validation error
 */
communitiesRouter.post(
  '/',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.createCommunityValidator, 'body'),
  WatchAsyncController(communitiesController.createCommunity)
);

/**
 * @swagger
 * /communities/me:
 *   get:
 *     summary: Get communities created by the authenticated user
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Communities retrieved successfully
 */
communitiesRouter.get(
  '/me',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.getMyCommunitiesValidator, 'query'),
  WatchAsyncController(communitiesController.getMyCommunities)
);

/**
 * @swagger
 * /communities/joined:
 *   get:
 *     summary: Get communities the authenticated user has joined as a member
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Joined communities retrieved successfully
 */
communitiesRouter.get(
  '/joined',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.getMyCommunitiesValidator, 'query'),
  WatchAsyncController(communitiesController.getJoinedCommunities)
);

/**
 * @swagger
 * /communities/{communityId}:
 *   get:
 *     summary: Get a community by ID
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Community retrieved successfully
 *       404:
 *         description: Community not found
 */
communitiesRouter.get(
  '/:communityId',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityIdValidator, 'params'),
  WatchAsyncController(communitiesController.getCommunity)
);

/**
 * @swagger
 * /communities/{communityId}:
 *   patch:
 *     summary: Update a community (owner only)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: uri
 *               cover_image:
 *                 type: string
 *                 format: uri
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *               rules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *     responses:
 *       200:
 *         description: Community updated successfully
 *       404:
 *         description: Community not found or not owner
 */
communitiesRouter.patch(
  '/:communityId',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityIdValidator, 'params'),
  validateDataMiddleware(communitiesValidator.updateCommunityValidator, 'body'),
  WatchAsyncController(communitiesController.updateCommunity)
);

/**
 * @swagger
 * /communities/{communityId}:
 *   delete:
 *     summary: Delete a community (owner only, requires confirm="DELETE" in body)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - confirm
 *             properties:
 *               confirm:
 *                 type: string
 *                 example: DELETE
 *     responses:
 *       200:
 *         description: Community deleted successfully
 *       400:
 *         description: Confirmation text is wrong
 *       404:
 *         description: Community not found or not owner
 */
communitiesRouter.delete(
  '/:communityId',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityIdValidator, 'params'),
  validateDataMiddleware(communitiesValidator.deleteCommunityValidator, 'body'),
  WatchAsyncController(communitiesController.deleteCommunity)
);

/**
 * @swagger
 * /communities/{communityId}/join:
 *   post:
 *     summary: Join a community (instant for public, pending request for private)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Joined community or request sent
 *       400:
 *         description: Already a member or owner
 *       404:
 *         description: Community not found
 */
communitiesRouter.post(
  '/:communityId/join',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityIdValidator, 'params'),
  WatchAsyncController(communitiesController.joinCommunity)
);

/**
 * @swagger
 * /communities/{communityId}/leave:
 *   delete:
 *     summary: Leave a community or cancel a pending join request
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Left community successfully
 *       400:
 *         description: Owner cannot leave
 *       404:
 *         description: Community not found or not a member
 */
communitiesRouter.delete(
  '/:communityId/leave',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityIdValidator, 'params'),
  WatchAsyncController(communitiesController.leaveCommunity)
);

/**
 * @swagger
 * /communities/{communityId}/requests:
 *   get:
 *     summary: Get pending join requests (owner only)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pending join requests retrieved
 *       400:
 *         description: Not the community owner
 *       404:
 *         description: Community not found
 */
communitiesRouter.get(
  '/:communityId/requests',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityIdValidator, 'params'),
  validateDataMiddleware(communitiesValidator.getCommunityMembersValidator, 'query'),
  WatchAsyncController(communitiesController.getPendingRequests)
);

/**
 * @swagger
 * /communities/{communityId}/requests/{userId}/accept:
 *   post:
 *     summary: Accept a pending join request (owner only)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Join request accepted
 *       400:
 *         description: Not the community owner
 *       404:
 *         description: Community or pending request not found
 */
communitiesRouter.post(
  '/:communityId/requests/:userId/accept',
  verifyAuth,
  WatchAsyncController(communitiesController.acceptJoinRequest)
);

/**
 * @swagger
 * /communities/{communityId}/requests/{userId}/decline:
 *   delete:
 *     summary: Decline a pending join request (owner only)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Join request declined
 *       400:
 *         description: Not the community owner
 *       404:
 *         description: Community or pending request not found
 */
communitiesRouter.delete(
  '/:communityId/requests/:userId/decline',
  verifyAuth,
  WatchAsyncController(communitiesController.declineJoinRequest)
);

/**
 * @swagger
 * /communities/{communityId}/members:
 *   get:
 *     summary: Get accepted members of a community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Members retrieved successfully
 *       404:
 *         description: Community not found
 */
communitiesRouter.get(
  '/:communityId/members',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityIdValidator, 'params'),
  validateDataMiddleware(communitiesValidator.getCommunityMembersValidator, 'query'),
  WatchAsyncController(communitiesController.getCommunityMembers)
);

/**
 * @swagger
 * /communities/testimonies/me:
 *   get:
 *     summary: Get the authenticated user's community testimonies (for profile tab)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Testimonies retrieved successfully
 */
communitiesRouter.get(
  '/testimonies/me',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.getCommunityTestimoniesValidator, 'query'),
  WatchAsyncController(communitiesController.getUserCommunityTestimonies)
);

/**
 * @swagger
 * /communities/testimonies/user/{userId}:
 *   get:
 *     summary: Get another user's community testimonies (for profile tab)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Testimonies retrieved successfully
 */
communitiesRouter.get(
  '/testimonies/user/:userId',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.getCommunityTestimoniesValidator, 'query'),
  WatchAsyncController(communitiesController.getUserCommunityTestimonies)
);

/**
 * @swagger
 * /communities/{communityId}/testimonies:
 *   post:
 *     summary: Share a testimony to a community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *               media_attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - url
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [image, video, audio]
 *                     url:
 *                       type: string
 *                       format: uri
 *                     thumbnail_url:
 *                       type: string
 *                       format: uri
 *                     duration:
 *                       type: number
 *                     size:
 *                       type: number
 *                     mime_type:
 *                       type: string
 *                     filename:
 *                       type: string
 *                     order_index:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Testimony posted successfully
 *       400:
 *         description: Not a member, banned, or missing content
 *       404:
 *         description: Community not found
 *   get:
 *     summary: Get testimonies feed for a community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Testimonies retrieved successfully (pinned first, then newest)
 *       404:
 *         description: Community not found
 */
communitiesRouter.post(
  '/:communityId/testimonies',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityIdValidator, 'params'),
  validateDataMiddleware(communitiesValidator.createCommunityPostValidator, 'body'),
  WatchAsyncController(communitiesController.createCommunityPost)
);

communitiesRouter.get(
  '/:communityId/testimonies',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityIdValidator, 'params'),
  validateDataMiddleware(communitiesValidator.getCommunityTestimoniesValidator, 'query'),
  WatchAsyncController(communitiesController.getCommunityTestimonies)
);

/**
 * @swagger
 * /communities/{communityId}/members/{userId}:
 *   delete:
 *     summary: Remove a member from a community (owner only)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       400:
 *         description: Not the community owner
 *       404:
 *         description: Community or member not found
 */
communitiesRouter.delete(
  '/:communityId/members/:userId',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityUserParamsValidator, 'params'),
  WatchAsyncController(communitiesController.removeMember)
);

/**
 * @swagger
 * /communities/{communityId}/members/{userId}/ban:
 *   post:
 *     summary: Ban a member from a community (owner only)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Member banned successfully
 *       400:
 *         description: Not the community owner
 *       404:
 *         description: Community not found
 */
communitiesRouter.post(
  '/:communityId/members/:userId/ban',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityUserParamsValidator, 'params'),
  validateDataMiddleware(communitiesValidator.banMemberValidator, 'body'),
  WatchAsyncController(communitiesController.banMember)
);

/**
 * @swagger
 * /communities/{communityId}/testimonies/{testimonyId}:
 *   delete:
 *     summary: Remove a testimony from a community (owner only)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: testimonyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Testimony removed successfully
 *       400:
 *         description: Not the community owner
 *       404:
 *         description: Testimony not found in this community
 */
communitiesRouter.delete(
  '/:communityId/testimonies/:testimonyId',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityTestimonyParamsValidator, 'params'),
  WatchAsyncController(communitiesController.removeTestimony)
);

/**
 * @swagger
 * /communities/{communityId}/testimonies/{testimonyId}/pin:
 *   patch:
 *     summary: Toggle pin on a community testimony (owner only). Unpins all others first; if already pinned, it is simply unpinned.
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: testimonyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Testimony pin updated successfully
 *       400:
 *         description: Not the community owner
 *       404:
 *         description: Testimony not found in this community
 */
communitiesRouter.patch(
  '/:communityId/testimonies/:testimonyId/pin',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityTestimonyParamsValidator, 'params'),
  WatchAsyncController(communitiesController.pinTestimony)
);

/**
 * @swagger
 * /communities/{communityId}/report:
 *   post:
 *     summary: Report a community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Community reported successfully
 *       404:
 *         description: Community not found
 */
communitiesRouter.post(
  '/:communityId/report',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityIdValidator, 'params'),
  validateDataMiddleware(communitiesValidator.reportValidator, 'body'),
  WatchAsyncController(communitiesController.reportCommunity)
);

/**
 * @swagger
 * /communities/{communityId}/testimonies/{testimonyId}/report:
 *   post:
 *     summary: Report a testimony in a community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: testimonyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Testimony reported successfully
 *       404:
 *         description: Community or testimony not found
 */
communitiesRouter.post(
  '/:communityId/testimonies/:testimonyId/report',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityTestimonyParamsValidator, 'params'),
  validateDataMiddleware(communitiesValidator.reportValidator, 'body'),
  WatchAsyncController(communitiesController.reportTestimony)
);

/**
 * @swagger
 * /communities/{communityId}/reported:
 *   get:
 *     summary: Get pending reported content in a community (owner only)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reported content retrieved successfully
 *       400:
 *         description: Not the community owner
 *       404:
 *         description: Community not found
 */
communitiesRouter.get(
  '/:communityId/reported',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityIdValidator, 'params'),
  validateDataMiddleware(communitiesValidator.getCommunityMembersValidator, 'query'),
  WatchAsyncController(communitiesController.getReportedContent)
);

/**
 * @swagger
 * /communities/{communityId}/reported/{reportId}:
 *   patch:
 *     summary: Review a reported content item — mark as reviewed or dismissed (owner only)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: reportId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reviewed, dismissed]
 *     responses:
 *       200:
 *         description: Report updated successfully
 *       400:
 *         description: Not the community owner
 *       404:
 *         description: Report not found
 */
communitiesRouter.patch(
  '/:communityId/reported/:reportId',
  verifyAuth,
  validateDataMiddleware(communitiesValidator.communityReportParamsValidator, 'params'),
  validateDataMiddleware(communitiesValidator.reviewReportValidator, 'body'),
  WatchAsyncController(communitiesController.reviewReport)
);

export default communitiesRouter;
