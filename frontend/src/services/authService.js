import api from './api';

export const authService = {
    // Login with email and password
    loginWithEmail: async (email, password) => {
        const response = await api.post('/auth/login/email', { email, password });
        if (response.data.token) {
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // Login with mobile number and password
    loginWithMobile: async (mobile, password, countryCode = '+971') => {
        const response = await api.post('/auth/login/mobile', {
            mobile: `${countryCode}${mobile}`,
            password
        });
        if (response.data.token) {
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // Admin signup
    signup: async (userData) => {
        const response = await api.post('/auth/signup', userData);
        if (response.data.token) {
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // Super Admin creates user with custom credentials
    createUserByAdmin: async (userData) => {
        const response = await api.post('/auth/admin/create-user', userData);
        return response.data;
    },

    // Logout
    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    },

    // Get current user
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('authToken');
    },

    // Forgot Password - Request OTP
    requestPasswordResetOTP: async (email) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    // Forgot Password - Verify OTP
    verifyPasswordResetOTP: async (email, otp) => {
        const response = await api.post('/auth/verify-otp', { email, otp });
        return response.data;
    },

    // Forgot Password - Reset Password
    resetPassword: async (email, otp, newPassword) => {
        const response = await api.post('/auth/reset-password', { email, otp, newPassword });
        return response.data;
    },
};
