/**
 * Admin User Service Proxy
 * Delegates to specialized sub-modules for users management.
 */

export {
  banUser,
  deleteUser,
  promoteUserToAdmin,
  toggleUserBan,
  updateUserRole,
  verifyUserBusiness,
} from "./user-actions";
export { getUserDetail, type UserDetailData } from "./user-details";
export { getAllUsers } from "./user-list";
