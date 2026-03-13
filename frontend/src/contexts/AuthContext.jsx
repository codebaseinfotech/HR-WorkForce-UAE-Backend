import { useState } from 'react';
import { AuthContext } from './AuthContextInstance';

// Re-export useAuth from the dedicated hook file so existing imports still work
// eslint-disable-next-line react-refresh/only-export-components
export { useAuth } from './useAuth';

// Normalize user data from API response to a flat, consistent format
const normalizeUser = (userData) => {
    if (!userData) return null;
    console.log({ userData })
    return {
        id: userData.id,
        employeeId: userData.employeeId || '',
        firstName: userData.first_name || userData.firstName || '',
        lastName: userData.last_name || userData.lastName || '',
        phone: userData.phone || '',
        email: userData.email || '',
        bod: userData.bod || '',
        gender: userData.gender || '',
        // Extract role slug from role object, or lowercase the string role
        // SuperAdmin: role = { slug: "super_admin" } → "super_admin"
        // Company:    role = "Company" → "company"
        role: typeof userData.role === 'object'
            ? userData.role?.slug
            : (userData.role || '').toLowerCase(),
        roleId: userData.role_id || userData.roleId || '',
        roleName: typeof userData.role === 'object' ? userData.role?.name : userData.role || '',
        isSuperAdmin: userData.is_super_admin === 1 || userData.isSuperAdmin === true,
        companyId: userData.company_id || userData.companyId || '',
        companyName: typeof userData.company === 'string' ? userData.company : userData.company?.name || '',
        isCompanyOwner: userData.is_company_owner === 1 || userData.isCompanyOwner === true,
        nationalityId: userData.nationality_id || userData.nationalityId || '',
        status: userData.status,
        profileImage: userData.p_image_url || userData.profileImage || '',
        signatureImage: userData.signature_image_url || userData.signatureImage || '',
        company: userData.company || '',
        nationality: typeof userData.nationality === 'string' ? userData.nationality : userData.nationality?.name || '',
        permissions: userData.permissions || [],
    };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            localStorage.removeItem('user');
            return null;
        }
    });
    const [loading] = useState(false);

    // Called by pages after successful RTK Query login/signup
    const setUserFromResponse = (userData, token) => {
        if (token) {
            localStorage.setItem('token', token);
        }
        if (userData) {
            const normalizedUser = normalizeUser(userData);
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            setUser(normalizedUser);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const hasRole = (role) => {
        return user?.role === role;
    };

    const hasAnyRole = (roles) => {
        return roles.includes(user?.role);
    };

    const value = {
        user,
        loading,
        setUserFromResponse,
        logout,
        hasRole,
        hasAnyRole,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
