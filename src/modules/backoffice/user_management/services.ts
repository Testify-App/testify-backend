import UserManagementRepository from './repositories';

// Thin layer kept for the module's usual shape; the logic lives in the repository and the
// shared user-standing service.
const UserManagementServices = UserManagementRepository;

export default UserManagementServices;
