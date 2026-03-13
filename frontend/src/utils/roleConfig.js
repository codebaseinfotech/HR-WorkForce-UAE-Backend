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
        '/superadmin/company-requests',
        '/superadmin/company/:id',
        '/staff/list', // View only, cannot create
    ],
    [ROLES.COMPANY]: [
        '/dashboard',
        '/company/managers',
        '/company/create-manager',
        '/company/create-user',
        '/company/roles',
        '/company/permissions/:roleId',
        '/staff/add',
        '/staff/list',
        '/checkin-checkout',
    ],
    [ROLES.MANAGER]: [
        '/dashboard',
        '/staff/add',
        '/staff/list',
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
            label: 'Company Requests',
            path: '/superadmin/company-requests',
            icon: 'FiInbox'
        },
        {
            label: 'Companies List',
            path: '/superadmin/users-list',
            icon: 'FiUsers'
        },
        {
            label: 'Staff Directory',
            path: '/staff/list',
            icon: 'FiFolder',
            badge: 'View Only'
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
            label: 'Add Staff',
            path: '/staff/add',
            icon: 'FiUserCheck'
        },
        {
            label: 'Check-in/Check-out',
            path: '/checkin-checkout',
            icon: 'FiClock'
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
            label: 'Add Staff',
            path: '/staff/add',
            icon: 'FiUserPlus'
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
