import { Router } from 'express';
import authenticationRouter from '../authentication/routes';
import adminManagementRouter from '../admin_management/routes';
import moderationRouter from '../moderation/routes';
import userManagementRouter from '../user_management/routes';
import hiddenContentRouter from '../hidden_content/routes';
import auditLogRouter from '../audit_logs/routes';

const api = Router();

api.use('/auth', authenticationRouter);
api.use('/moderation', moderationRouter);
api.use('/users', userManagementRouter);
api.use('/hidden-content', hiddenContentRouter);
api.use('/audit-logs', auditLogRouter);
api.use('/', adminManagementRouter);

export default api;
