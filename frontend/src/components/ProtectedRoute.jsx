import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Spinner, Center } from '@chakra-ui/react';
import { hasPermission, getDefaultDashboard } from '../utils/roleConfig';

const ProtectedRoute = ({ children, path }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <Center h="100vh">
                <Spinner size="xl" color="primary.600" thickness="4px" />
            </Center>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    // Check if user has permission to access this route
    const currentPath = path || location.pathname;
    if (!hasPermission(user?.role, currentPath)) {
        // Redirect to the user's default dashboard
        const defaultDashboard = getDefaultDashboard(user?.role);
        return <Navigate to={defaultDashboard} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
