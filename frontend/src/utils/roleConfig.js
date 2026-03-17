// Role-based access control configuration

export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    COMPANY: 'company',
    MANAGER: 'manager'
};

// Define which routes each role can access
export const rolePermissions = {
    [ROLES.SUPER_ADMIN]: [
        '/dashboard',
        '/superadmin/dashboard',
        '/superadmin/create-user',
        '/superadmin/users-list',
    ],
    [ROLES.COMPANY]: [
        '/dashboard',
        '/company/managers',
        '/company/create-manager',
        '/company/create-user',
        '/company/roles',
        '/company/permissions/:roleId',
        '/staff/list',
        '/checkin-checkout',
        '/company/all-attendance',
    ],
    [ROLES.MANAGER]: [
        '/dashboard',
        '/staff/list',
        '/checkin-checkout',
        '/company/all-attendance',
    ]
};

// Menu items for each role
export const roleMenuItems = {
    [ROLES.SUPER_ADMIN]: [
        {
            label: 'Dashboard',
            path: '/superadmin/dashboard',
            icon: 'FiHome'
        },
        {
            label: 'Create Company',
            path: '/superadmin/create-user',
            icon: 'FiUserPlus'
        },
        {
            label: 'Companies List',
            path: '/superadmin/users-list',
            icon: 'FiUsers'
        }
    ],
    [ROLES.COMPANY]: [
        {
            label: 'Dashboard',
            path: '/dashboard',
            icon: 'FiHome'
        },
        {
            label: 'Managers',
            path: '/company/managers',
            icon: 'FiUsers'
        },
        {
            label: 'Create User',
            path: '/company/create-user',
            icon: 'FiUserPlus'
        },
        {
            label: 'Roles & Permissions',
            path: '/company/roles',
            icon: 'FiShield'
        },
        {
            label: 'Staff Management',
            path: '/staff/list',
            icon: 'FiFolder'
        },
        {
            label: 'Check-in/Check-out',
            path: '/checkin-checkout',
            icon: 'FiClock'
        },
        {
            label: 'Team Attendance',
            path: '/company/all-attendance',
            icon: 'FiUsers'
        }
    ],
    [ROLES.MANAGER]: [
        {
            label: 'Dashboard',
            path: '/dashboard',
            icon: 'FiHome'
        },
        {
            label: 'Staff Management',
            path: '/staff/list',
            icon: 'FiUsers'
        },
        {
            label: 'Check-in/Check-out',
            path: '/checkin-checkout',
            icon: 'FiClock'
        },
        {
            label: 'Team Attendance',
            path: '/company/all-attendance',
            icon: 'FiUsers'
        }
    ]
};

// Check if a role has permission to access a path
export const hasPermission = (role, path) => {
    if (!role || !path) return false;

    const permissions = rolePermissions[role];
    if (!permissions) return false;

    // Exact match
    if (permissions.includes(path)) return true;

    // Check for dynamic routes (e.g., /superadmin/company/:id)
    return permissions.some(permission => {
        if (permission.includes(':')) {
            const pattern = permission.replace(/:[^/]+/g, '[^/]+');
            const regex = new RegExp(`^${pattern}$`);
            return regex.test(path);
        }
        return false;
    });
};

// Get menu i   tems for a role
export const getMenuItems = (role) => {
    return roleMenuItems[role] || [];
};

// Get the default dashboard path for a role
export const getDefaultDashboard = (role) => {
    if (role === ROLES.SUPER_ADMIN) return '/superadmin/dashboard';
    return '/dashboard';
};
