import { Box, Grid, VStack, Heading, Text, SimpleGrid, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { FiUsers, FiUserCheck, FiClock, FiTrendingUp } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useGetDashboardStatsQuery } from '../../store/apiSlice';
import { ROLES } from '../../utils/roleConfig';

const Dashboard = () => {
    const { user } = useAuth();

    // Fetch dashboard stats based on user role and company
    const { data: statsData, isLoading, error } = useGetDashboardStatsQuery(
        {
            companyId: user?.companyId,
            role: user?.role
        },
        {
            skip: user?.role === ROLES.SUPER_ADMIN // Skip for superadmin, they have their own dashboard
        }
    );

    const stats = statsData?.stats || {};

    if (user?.role === ROLES.SUPER_ADMIN) {
        return (
            <DashboardLayout>
                <VStack align="stretch" spacing={8}>
                    <Box>
                        <Heading
                            size="xl"
                            mb={2}
                            bgGradient="linear(to-r, primary.600, purple.600)"
                            bgClip="text"
                            fontWeight="bold"
                        >
                            Welcome back, {user?.firstName} {user?.lastName} 👋
                        </Heading>
                        <Text color="gray.600" fontSize="lg">
                            Visit the SuperAdmin Dashboard for complete system overview
                        </Text>
                    </Box>

                    <Card>
                        <Text color="gray.600" textAlign="center" py={8}>
                            Please navigate to <strong>SuperAdmin Dashboard</strong> from the sidebar to view system-wide statistics, manage companies, and access detailed reports.
                        </Text>
                    </Card>
                </VStack>
            </DashboardLayout>
        );
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
                    <Spinner size="xl" color="purple.500" />
                </Box>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <Alert status="error">
                    <AlertIcon />
                    Failed to load dashboard data. Please try again.
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={8}>
                {/* Header */}
                <Box>
                    <Heading
                        size="xl"
                        mb={2}
                        bgGradient="linear(to-r, primary.600, purple.600)"
                        bgClip="text"
                        fontWeight="bold"
                    >
                        Welcome back, {user?.companyName} 👋
                    </Heading>
                    <Text color="gray.600" fontSize="lg">
                        Here's what's happening with your workforce today
                    </Text>
                </Box>

                {/* Stats Grid */}
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                    <StatCard
                        icon={FiUsers}
                        label="Total Staff"
                        value={stats.totalStaff || 0}
                        helpText={`${stats.totalManagers || 0} managers`}
                        colorScheme="primary"
                    />
                    <StatCard
                        icon={FiUserCheck}
                        label="Present Today"
                        value={stats.presentToday || 0}
                        helpText={stats.totalStaff ? `${Math.round((stats.presentToday || 0) / stats.totalStaff * 100)}% attendance` : '0% attendance'}
                        colorScheme="success"
                    />
                    <StatCard
                        icon={FiClock}
                        label="On Leave"
                        value={stats.onLeaveToday || 0}
                        helpText="Approved leaves today"
                        colorScheme="warning"
                    />
                    <StatCard
                        icon={FiTrendingUp}
                        label="Pending Tasks"
                        value={stats.pendingTasks || 0}
                        helpText={`${stats.inProgressTasks || 0} in progress`}
                        colorScheme="info"
                    />
                </SimpleGrid>

                {/* Quick Actions or Recent Activity */}
                <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                    <Card>
                        <Heading size="md" mb={4} color="gray.800">
                            Recent Check-ins
                        </Heading>
                        <Text color="gray.600">
                            {stats.totalStaff ? `${stats.presentToday || 0} out of ${stats.totalStaff} staff have checked in today` : 'No check-in data available'}
                        </Text>
                    </Card>

                    <Card>
                        <Heading size="md" mb={4} color="gray.800">
                            Task Summary
                        </Heading>
                        <Text color="gray.600" mb={2}>
                            Total Tasks: {stats.totalTasks || 0}
                        </Text>
                        <Text color="gray.600" fontSize="sm">
                            Pending: {stats.pendingTasks || 0} | In Progress: {stats.inProgressTasks || 0} | Completed: {stats.completedTasks || 0}
                        </Text>
                    </Card>
                </Grid>

                {/* Activity Timeline or Charts */}
                <Card>
                    <Heading size="md" mb={4} color="gray.800">
                        Activity Overview
                    </Heading>
                    <Text color="gray.600" mb={4}>
                        Quick summary of today's workforce activity
                    </Text>
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                        <Box>
                            <Text fontWeight="bold" color="gray.700">Staff</Text>
                            <Text fontSize="2xl" color="purple.600">{stats.totalStaff || 0}</Text>
                        </Box>
                        <Box>
                            <Text fontWeight="bold" color="gray.700">Check-ins</Text>
                            <Text fontSize="2xl" color="green.600">{stats.presentToday || 0}</Text>
                        </Box>
                        <Box>
                            <Text fontWeight="bold" color="gray.700">Tasks</Text>
                            <Text fontSize="2xl" color="blue.600">{stats.totalTasks || 0}</Text>
                        </Box>
                    </Grid>
                </Card>
            </VStack>
        </DashboardLayout>
    );
};

export default Dashboard;
