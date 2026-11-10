import { Router } from 'express';
import * as adminManagementValidator from './validator';
import adminManagementController from './controller';
import { WatchAsyncController } from '../../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../shared/middlewares/request-validator.middleware';
import { permissionAccessValidator } from '../shared/middlewares/common.middleware';
import { protectedRoute } from '../shared/middlewares/protected-route.middleware';
import express from 'express';

/**
 * @swagger
 * tags:
 *   - name: Roles and Permissions
 *     description: Role and permission management endpoints
 *   - name: Staff Management
 *     description: Admin staff listing and management endpoints
 *   - name: Staff Invitations
 *     description: Admin invite (single + bulk CSV) and invite-acceptance endpoints
 */

const adminManagementRouter = Router();

/**
 * @swagger
 * /backoffice/roles/permissions:
 *   get:
 *     summary: List all permissions
 *     description: Returns the permission catalogue, grouped by category, used to build the role permission picker.
 *     tags: [Roles and Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permissions fetched successfully
 */
adminManagementRouter.get(
  '/roles/permissions',
  ...protectedRoute,
  permissionAccessValidator('roles:view'),
  validateDataMiddleware(adminManagementValidator.fetchPermissionsQueryValidator, 'query'),
  WatchAsyncController(adminManagementController.fetchPermissions)
);

/**
 * @swagger
 * /backoffice/roles:
 *   post:
 *     summary: Create a role
 *     tags: [Roles and Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_name
 *               - description
 *               - permission_ids
 *             properties:
 *               role_name:
 *                 type: string
 *                 example: State Admin
 *               description:
 *                 type: string
 *                 example: Manages a single state's revenue operations
 *               permission_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Duplicate role name or validation error
 *   get:
 *     summary: List roles
 *     tags: [Roles and Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: [true, false]
 *     responses:
 *       200:
 *         description: Roles fetched successfully
 */
adminManagementRouter.post(
  '/roles',
  ...protectedRoute,
  permissionAccessValidator('roles:create'),
  validateDataMiddleware(adminManagementValidator.createRolePayloadValidator, 'body'),
  WatchAsyncController(adminManagementController.createRole)
);

adminManagementRouter.get(
  '/roles',
  ...protectedRoute,
  permissionAccessValidator('roles:view'),
  validateDataMiddleware(adminManagementValidator.fetchRolesQueryValidator, 'query'),
  WatchAsyncController(adminManagementController.fetchRoles)
);

/**
 * @swagger
 * /backoffice/roles/reassign:
 *   patch:
 *     summary: Reassign an admin's role
 *     description: An admin cannot change their own role (403).
 *     tags: [Roles and Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - admin_id
 *               - role_id
 *             properties:
 *               admin_id:
 *                 type: string
 *               role_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role reassigned successfully
 *       403:
 *         description: You cannot change your own role.
 *       404:
 *         description: Admin or role not found
 */
adminManagementRouter.patch(
  '/roles/reassign',
  ...protectedRoute,
  permissionAccessValidator('roles:update'),
  validateDataMiddleware(adminManagementValidator.reassignRolePayloadValidator, 'body'),
  WatchAsyncController(adminManagementController.reassignRole)
);

/**
 * @swagger
 * /backoffice/roles/{role_id}:
 *   get:
 *     summary: View a role's details and permissions
 *     tags: [Roles and Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role fetched successfully
 *       404:
 *         description: Role not found
 *   patch:
 *     summary: Edit a role's name, description and permissions
 *     tags: [Roles and Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
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
 *               - role_name
 *               - description
 *               - permission_ids
 *             properties:
 *               role_name:
 *                 type: string
 *               description:
 *                 type: string
 *               permission_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         description: Role not found
 *   delete:
 *     summary: Delete a role
 *     description: Fails if the role still has admins assigned to it.
 *     tags: [Roles and Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       400:
 *         description: Role still has assigned admins
 *       404:
 *         description: Role not found
 */
adminManagementRouter.get(
  '/roles/:role_id',
  ...protectedRoute,
  permissionAccessValidator('roles:view'),
  validateDataMiddleware(adminManagementValidator.roleIdParamValidator, 'params'),
  WatchAsyncController(adminManagementController.fetchRoleById)
);

adminManagementRouter.patch(
  '/roles/:role_id',
  ...protectedRoute,
  permissionAccessValidator('roles:update'),
  validateDataMiddleware(adminManagementValidator.roleIdParamValidator, 'params'),
  validateDataMiddleware(adminManagementValidator.editRolePayloadValidator, 'body'),
  WatchAsyncController(adminManagementController.editRoleById)
);

adminManagementRouter.delete(
  '/roles/:role_id',
  ...protectedRoute,
  permissionAccessValidator('roles:delete'),
  validateDataMiddleware(adminManagementValidator.roleIdParamValidator, 'params'),
  WatchAsyncController(adminManagementController.deleteRoleById)
);

/**
 * @swagger
 * /backoffice/roles/deactivate/{role_id}:
 *   patch:
 *     summary: Deactivate a role
 *     description: Admins currently assigned to this role are locked out on their next request.
 *     tags: [Roles and Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deactivated successfully
 *       404:
 *         description: Role not found
 */
adminManagementRouter.patch(
  '/roles/deactivate/:role_id',
  ...protectedRoute,
  permissionAccessValidator('roles:update'),
  validateDataMiddleware(adminManagementValidator.roleIdParamValidator, 'params'),
  WatchAsyncController(adminManagementController.deactivateRoleById)
);

/**
 * @swagger
 * /backoffice/roles/activate/{role_id}:
 *   patch:
 *     summary: Activate a role
 *     tags: [Roles and Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role activated successfully
 *       404:
 *         description: Role not found
 */
adminManagementRouter.patch(
  '/roles/activate/:role_id',
  ...protectedRoute,
  permissionAccessValidator('roles:update'),
  validateDataMiddleware(adminManagementValidator.roleIdParamValidator, 'params'),
  WatchAsyncController(adminManagementController.activateRoleById)
);

/**
 * @swagger
 * /backoffice/staff:
 *   get:
 *     summary: List staff
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, suspended, pending_invitation]
 *       - in: query
 *         name: role_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Staff fetched successfully
 */
adminManagementRouter.get(
  '/staff',
  ...protectedRoute,
  permissionAccessValidator('staff:view'),
  validateDataMiddleware(adminManagementValidator.fetchStaffQueryValidator, 'query'),
  WatchAsyncController(adminManagementController.fetchStaff)
);

/**
 * @swagger
 * /backoffice/staff/summary:
 *   get:
 *     summary: Staff totals
 *     description: Number of staff overall and per status (active, suspended, pending_invitation).
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff totals
 */
adminManagementRouter.get(
  '/staff/summary',
  ...protectedRoute,
  permissionAccessValidator('staff:view'),
  WatchAsyncController(adminManagementController.fetchStaffSummary)
);

/**
 * @swagger
 * /backoffice/staff/{admin_id}:
 *   get:
 *     summary: View a staff member's details
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admin_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff member fetched successfully
 *       404:
 *         description: Staff member not found
 *   patch:
 *     summary: Edit a staff member's name, phone and role
 *     description: |
 *       Names are saved title-cased. phone_number takes an optional leading + and 7-15 digits
 *       (spaces, dashes, dots and brackets ignored) and is stored without separators. Admins may edit their own
 *       name/phone here but not their own role.
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admin_id
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
 *               - first_name
 *               - last_name
 *               - role_id
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role_id:
 *                 type: string
 *               phone_number:
 *                 type: string
 *                 nullable: true
 *                 description: Omit to keep the current number; empty string or null clears it.
 *     responses:
 *       200:
 *         description: Staff member updated successfully
 *       400:
 *         description: Enter a valid phone number.
 *       403:
 *         description: You cannot change your own role.
 *       404:
 *         description: Staff member or role not found
 *       409:
 *         description: Phone number already in use.
 */
adminManagementRouter.get(
  '/staff/:admin_id',
  ...protectedRoute,
  permissionAccessValidator('staff:view'),
  validateDataMiddleware(adminManagementValidator.staffIdParamValidator, 'params'),
  WatchAsyncController(adminManagementController.fetchStaffById)
);

adminManagementRouter.patch(
  '/staff/:admin_id',
  ...protectedRoute,
  permissionAccessValidator('staff:update'),
  validateDataMiddleware(adminManagementValidator.staffIdParamValidator, 'params'),
  validateDataMiddleware(adminManagementValidator.editStaffPayloadValidator, 'body'),
  WatchAsyncController(adminManagementController.editStaff)
);

/**
 * @swagger
 * /backoffice/staff/suspend/{admin_id}:
 *   patch:
 *     summary: Suspend a staff member
 *     description: An admin cannot suspend their own account.
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admin_id
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
 *     responses:
 *       200:
 *         description: Staff member suspended successfully
 *       400:
 *         description: Cannot suspend own account
 *       404:
 *         description: Staff member not found
 */
adminManagementRouter.patch(
  '/staff/suspend/:admin_id',
  ...protectedRoute,
  permissionAccessValidator('staff:update'),
  validateDataMiddleware(adminManagementValidator.staffIdParamValidator, 'params'),
  validateDataMiddleware(adminManagementValidator.suspendStaffPayloadValidator, 'body'),
  WatchAsyncController(adminManagementController.suspendStaff)
);

/**
 * @swagger
 * /backoffice/staff/reactivate/{admin_id}:
 *   patch:
 *     summary: Reactivate a suspended staff member
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admin_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff member reactivated successfully
 *       400:
 *         description: Cannot reactivate own account
 *       404:
 *         description: Staff member not found
 */
adminManagementRouter.patch(
  '/staff/reactivate/:admin_id',
  ...protectedRoute,
  permissionAccessValidator('staff:update'),
  validateDataMiddleware(adminManagementValidator.staffIdParamValidator, 'params'),
  WatchAsyncController(adminManagementController.reactivateStaff)
);

/**
 * @swagger
 * /backoffice/staff/invite:
 *   post:
 *     summary: Invite a new staff member
 *     description: Creates a pending-invitation admin account and emails a time-limited invite link. No password is ever emailed; the invitee sets their own password when accepting. Names are saved title-cased; the optional phone_number takes an optional leading + and 7-15 digits.
 *     tags: [Staff Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - role_id
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone_number:
 *                 type: string
 *                 example: "08031234567"
 *               role_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *       400:
 *         description: Email already exists, role not found, or "Enter a valid phone number."
 *       409:
 *         description: Phone number already in use.
 */
adminManagementRouter.post(
  '/staff/invite',
  ...protectedRoute,
  permissionAccessValidator('staff:create'),
  validateDataMiddleware(adminManagementValidator.inviteStaffPayloadValidator, 'body'),
  WatchAsyncController(adminManagementController.inviteStaff)
);

/**
 * @swagger
 * /backoffice/staff/invite/bulk/template:
 *   get:
 *     summary: Download the bulk-invite CSV template
 *     tags: [Staff Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV template file
 */
adminManagementRouter.get(
  '/staff/invite/bulk/template',
  ...protectedRoute,
  permissionAccessValidator('staff:create'),
  WatchAsyncController(adminManagementController.downloadBulkInviteTemplate)
);

/**
 * @swagger
 * /backoffice/staff/invite/bulk/preview:
 *   post:
 *     summary: Upload and validate a bulk-invite CSV before sending
 *     description: Validates each row of a CSV (sent as text/csv) or of rows already parsed by the portal (JSON) - duplicate email, email repeated in the file, unknown role, invalid phone -> "Enter a valid phone number.", phone held by another admin or repeated in the file -> "Phone number already in use.") without creating any accounts. Returned rows carry title-cased names and the normalised phone, so the caller can review and confirm before committing.
 *     tags: [Staff Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         text/csv:
 *           schema:
 *             type: string
 *             example: "first_name,last_name,email,phone_number,role_id\nJane,Doe,jane@testify.app,,role-id"
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invitees]
 *             properties:
 *               invitees:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     first_name: { type: string }
 *                     last_name: { type: string }
 *                     email: { type: string }
 *                     phone_number: { type: string }
 *                     role_id: { type: string }
 *     responses:
 *       200:
 *         description: File parsed successfully
 *       400:
 *         description: Malformed CSV
 */
adminManagementRouter.post(
  '/staff/invite/bulk/preview',
  ...protectedRoute,
  permissionAccessValidator('staff:create'),
  express.text({ type: ['text/csv', 'text/plain'], limit: '1mb' }),
  WatchAsyncController(adminManagementController.previewBulkInvite)
);

/**
 * @swagger
 * /backoffice/staff/invite/bulk:
 *   post:
 *     summary: Confirm and send a bulk invite
 *     description: Takes the (optionally edited) rows returned by the preview step and creates+invites each valid row. Each invitee gets a distinct invite token; per-row failures do not block the rest of the batch. Rows are re-validated; an invalid or already-used phone gives row status "invalid" with reason "Enter a valid phone number." / "Phone number already in use."; the response adds an `invalid` count alongside `invited` and `failed`.
 *     tags: [Staff Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitees
 *             properties:
 *               invitees:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - first_name
 *                     - last_name
 *                     - email
 *                     - role_id
 *                   properties:
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone_number:
 *                       type: string
 *                     role_id:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bulk invite operation completed
 */
adminManagementRouter.post(
  '/staff/invite/bulk',
  ...protectedRoute,
  permissionAccessValidator('staff:create'),
  validateDataMiddleware(adminManagementValidator.bulkInviteStaffPayloadValidator, 'body'),
  WatchAsyncController(adminManagementController.bulkInviteStaff)
);

/**
 * @swagger
 * /backoffice/staff/invite/resend/{admin_id}:
 *   post:
 *     summary: Resend a pending staff invitation
 *     description: Issues a new invitation link (valid 72 hours) and emails it. The previous link stops working.
 *     tags: [Staff Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admin_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation resent successfully
 *       404:
 *         description: Staff member not found
 *       409:
 *         description: Invitation already accepted
 *       429:
 *         description: An invite was sent less than a minute ago
 */
adminManagementRouter.post(
  '/staff/invite/resend/:admin_id',
  ...protectedRoute,
  permissionAccessValidator('staff:create'),
  validateDataMiddleware(adminManagementValidator.staffIdParamValidator, 'params'),
  WatchAsyncController(adminManagementController.resendInvite)
);

/**
 * @swagger
 * /backoffice/staff/{admin_id}/activity:
 *   get:
 *     summary: Activity feed for a staff member
 *     description: Audit entries performed by the staff member or performed on them, newest first.
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admin_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: '1'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: '10'
 *     responses:
 *       200:
 *         description: Staff activity fetched successfully
 *       404:
 *         description: Staff member not found
 */
adminManagementRouter.get(
  '/staff/:admin_id/activity',
  ...protectedRoute,
  permissionAccessValidator('staff:view'),
  validateDataMiddleware(adminManagementValidator.staffIdParamValidator, 'params'),
  validateDataMiddleware(adminManagementValidator.fetchStaffActivityQueryValidator, 'query'),
  WatchAsyncController(adminManagementController.fetchStaffActivity)
);

/**
 * @swagger
 * /backoffice/staff/invite/accept:
 *   post:
 *     summary: Accept a staff invitation and set a password
 *     description: Public endpoint (no auth token) reached via the link emailed to the invitee. Validates the invite token and its expiry, then activates the account.
 *     tags: [Staff Invitations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - new_password
 *               - confirm_new_password
 *             properties:
 *               token:
 *                 type: string
 *               new_password:
 *                 type: string
 *               confirm_new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation accepted
 *       400:
 *         description: Expired invite or password mismatch
 *       404:
 *         description: Invalid invite token
 */
adminManagementRouter.post(
  '/staff/invite/accept',
  validateDataMiddleware(adminManagementValidator.acceptInvitePayloadValidator, 'body'),
  WatchAsyncController(adminManagementController.acceptInvite)
);

export default adminManagementRouter;
