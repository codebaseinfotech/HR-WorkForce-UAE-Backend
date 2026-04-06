import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { getDefaultDashboard } from './utils/roleConfig';

// Auth Pages
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Super Admin
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import CreateUser from './pages/superadmin/CreateUser';
import UsersList from './pages/superadmin/UsersList';

// Staff Management
import StaffList from './pages/staff/StaffList';


// Company/Manager Management
import CreateManager from './pages/company/CreateManager';
import CreateUserByRole from './pages/company/CreateUserByRole';
import ManagersList from './pages/company/ManagersList';
import ManagerStaffList from './pages/company/ManagerStaffList';
import Roles from './pages/company/Roles';
import Permissions from './pages/company/Permissions';
import Positions from './pages/company/Positions';
import Teams from './pages/company/Teams';
import HolidayCalendar from './pages/company/HolidayCalendar';
import EmployeeSalaries from './pages/company/EmployeeSalaries';
import LiveLocation from './pages/company/LiveLocation';
import Chat from './pages/company/Chat';

import StaffDetail from './pages/company/StaffDetail';




function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const defaultDashboard = getDefaultDashboard(user?.role);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/signin"
        element={isAuthenticated ? <Navigate to={defaultDashboard} replace /> : <SignIn />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to={defaultDashboard} replace /> : <SignUp />}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to={defaultDashboard} replace /> : <ForgotPassword />}
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute path="/dashboard">
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/superadmin/dashboard"
        element={
          <ProtectedRoute path="/superadmin/dashboard">
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/superadmin/create-user"
        element={
          <ProtectedRoute path="/superadmin/create-user">
            <CreateUser />
          </ProtectedRoute>
        }
      />

      <Route
        path="/superadmin/users-list"
        element={
          <ProtectedRoute path="/superadmin/users-list">
            <UsersList />
          </ProtectedRoute>
        }
      />

      {/* Company/Manager Routes */}
      <Route
        path="/company/managers"
        element={
          <ProtectedRoute path="/company/managers">
            <ManagersList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/create-manager"
        element={
          <ProtectedRoute path="/company/create-manager">
            <CreateManager />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/create-user"
        element={
          <ProtectedRoute path="/company/create-user">
            <CreateUserByRole />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/create-user/:roleId"
        element={
          <ProtectedRoute path="/company/create-user">
            <CreateUserByRole />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/manager/:managerId/staff"
        element={
          <ProtectedRoute path="/company/managers">
            <ManagerStaffList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/staff/:staffId"
        element={
          <ProtectedRoute path="/company/managers">
            <StaffDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/roles"
        element={
          <ProtectedRoute path="/company/roles">
            <Roles />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/positions"
        element={
          <ProtectedRoute path="/company/positions">
            <Positions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/teams"
        element={
          <ProtectedRoute path="/company/teams">
            <Teams />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/holiday-calendar"
        element={
          <ProtectedRoute path="/company/holiday-calendar">
            <HolidayCalendar />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/salaries"
        element={
          <ProtectedRoute path="/company/salaries">
            <EmployeeSalaries />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/live-location"
        element={
          <ProtectedRoute path="/company/live-location">
            <LiveLocation />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/chat"
        element={
          <ProtectedRoute path="/company/chat">
            <Chat />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/permissions/:roleId"
        element={
          <ProtectedRoute path="/company/permissions/:roleId">
            <Permissions />
          </ProtectedRoute>
        }
      />





      <Route
        path="/staff/list"
        element={
          <ProtectedRoute path="/staff/list">
            <StaffList />
          </ProtectedRoute>
        }
      />






      {/* Default Route */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to={defaultDashboard} replace /> : <Navigate to="/signin" replace />
        }
      />
      <Route
        path="*"
        element={
          isAuthenticated ? <Navigate to={defaultDashboard} replace /> : <Navigate to="/signin" replace />
        }
      />
    </Routes>
  );
}

export default App;

