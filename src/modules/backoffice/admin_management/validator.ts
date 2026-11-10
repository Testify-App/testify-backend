import Joi from 'joi';
import { passwordSchema } from '../authentication/validator';

export const createRolePayloadValidator = Joi.object({
  role_name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().min(2).max(500).required(),
  permission_ids: Joi.array().items(Joi.string()).min(1).required(),
});

export const editRolePayloadValidator = Joi.object({
  role_name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().min(2).max(500).required(),
  permission_ids: Joi.array().items(Joi.string()).required(),
});

export const roleIdParamValidator = Joi.object({
  role_id: Joi.string().required(),
});

export const fetchRolesQueryValidator = Joi.object({
  page: Joi.string().pattern(/^[0-9]+$/).default('1'),
  limit: Joi.string().pattern(/^[0-9]+$/).default('10'),
  search: Joi.string().trim().allow('').optional(),
  is_active: Joi.string().valid('true', 'false').optional(),
});

export const fetchPermissionsQueryValidator = Joi.object({
  page: Joi.string().pattern(/^[0-9]+$/).default('1'),
  limit: Joi.string().pattern(/^[0-9]+$/).default('50'),
  category: Joi.string().trim().allow('').optional(),
});

export const reassignRolePayloadValidator = Joi.object({
  admin_id: Joi.string().required(),
  role_id: Joi.string().required(),
});

export const fetchStaffQueryValidator = Joi.object({
  page: Joi.string().pattern(/^[0-9]+$/).default('1'),
  limit: Joi.string().pattern(/^[0-9]+$/).default('10'),
  search: Joi.string().trim().allow('').optional(),
  status: Joi.string().valid('active', 'suspended', 'pending_invitation').optional(),
  role_id: Joi.string().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  sort: Joi.string().valid('newest', 'name_asc', 'name_desc').default('newest'),
});

export const staffIdParamValidator = Joi.object({
  admin_id: Joi.string().required(),
});

export const editStaffPayloadValidator = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required(),
  last_name: Joi.string().trim().min(1).max(100).required(),
  role_id: Joi.string().required(),
  // Omit to keep the current number; send '' or null to clear it. Format (optional +, 7-15 digits)
  // is checked in the service so an invalid number returns 400, not 422.
  phone_number: Joi.string().trim().allow('', null).optional(),
});

export const fetchStaffActivityQueryValidator = Joi.object({
  page: Joi.string().pattern(/^[0-9]+$/).default('1'),
  limit: Joi.string().pattern(/^[0-9]+$/).default('10'),
});

export const suspendStaffPayloadValidator = Joi.object({
  reason: Joi.string().trim().max(500).optional(),
});

export const inviteStaffPayloadValidator = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required(),
  last_name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().required(),
  phone_number: Joi.string().trim().allow('', null).optional(),
  role_id: Joi.string().required(),
});

const inviteRowSchema = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required(),
  last_name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().required(),
  phone_number: Joi.string().trim().optional().allow('', null),
  role_id: Joi.string().required(),
});

export const previewBulkInvitePayloadValidator = Joi.object({
  invitees: Joi.array().items(inviteRowSchema).min(1).max(500).required(),
});

export const bulkInviteStaffPayloadValidator = Joi.object({
  invitees: Joi.array().items(inviteRowSchema).min(1).max(500).required(),
});

export const acceptInvitePayloadValidator = Joi.object({
  token: Joi.string().required(),
  new_password: passwordSchema.extract('password').required(),
  confirm_new_password: Joi.string().required().valid(Joi.ref('new_password')).messages({
    'any.only': 'Confirm new password must match new password',
  }),
});
