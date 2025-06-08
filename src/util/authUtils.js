/**
 * Utility functions for authentication and role management
 */

/**
 * Role hierarchy - từ cao đến thấp
 */
export const ROLE_HIERARCHY = ['ROLE_ADMIN', 'ROLE_INSTRUCTOR', 'ROLE_STUDENT'];

/**
 * Lấy role có quyền cao nhất từ danh sách roles của user
 * @param {string[]} userRoles - Danh sách roles của user
 * @returns {string|null} - Role có quyền cao nhất hoặc null nếu không có role hợp lệ
 */
export const getHighestRole = (userRoles) => {
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
        return null;
    }
    
    return ROLE_HIERARCHY.find(role => userRoles.includes(role)) || null;
};

/**
 * Kiểm tra user có role cụ thể hay không
 * @param {string} userRole - Role hiện tại của user
 * @param {string} requiredRole - Role yêu cầu
 * @returns {boolean} - true nếu user có quyền
 */
export const hasRole = (userRole, requiredRole) => {
    return userRole === requiredRole;
};

/**
 * Kiểm tra user có quyền cao hơn hoặc bằng role yêu cầu hay không
 * @param {string} userRole - Role hiện tại của user
 * @param {string} requiredRole - Role yêu cầu tối thiểu
 * @returns {boolean} - true nếu user có quyền
 */
export const hasRoleOrHigher = (userRole, requiredRole) => {
    const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole);
    const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole);
    
    // Nếu không tìm thấy role thì không có quyền
    if (userRoleIndex === -1 || requiredRoleIndex === -1) {
        return false;
    }
    
    // Index nhỏ hơn = quyền cao hơn
    return userRoleIndex <= requiredRoleIndex;
};

/**
 * Lấy URL điều hướng mặc định dựa trên role
 * @param {string} role - Role của user
 * @returns {string} - URL điều hướng
 */
export const getDefaultRouteByRole = (role) => {
    switch (role) {
        case 'ROLE_ADMIN':
            return '/admin';
        case 'ROLE_INSTRUCTOR':
            return '/instructor';
        case 'ROLE_STUDENT':
            return '/student';
        default:
            return '/login';
    }
}; 