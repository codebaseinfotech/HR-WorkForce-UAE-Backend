import {
    Box, VStack, HStack, Heading, Text, SimpleGrid, Spinner,
    Icon, Flex, Badge, Table, Thead, Tbody, Tr, Th, Td, Avatar
} from '@chakra-ui/react';
import {
    FiUsers, FiUserCheck, FiClock, FiTrendingUp, FiCheckCircle,
    FiActivity, FiBriefcase, FiMail
} from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import { useAuth } from '../../contexts/AuthContext';
import {
    useGetUserFetchQuery,
    useGetAttendanceReportQuery,
    useGetAdminTasksQuery
} from '../../store/apiSlice';
import { ROLES } from '../../utils/roleConfig';

const Dashboard = () => {
    const { user } = useAuth();
    const companyId = user?.companyId || user?.id;

    // Fetch real data from multiple APIs instead of generic stats API
    const { data: staffRes, isLoading: loadingStaff } = useGetUserFetchQuery(
        { company_id: companyId, role: 'Employee' },
        { skip: user?.role === ROLES.SUPER_ADMIN || !companyId }
    );
    const { data: managerRes, isLoading: loadingManagers } = useGetUserFetchQuery(
        { company_id: companyId, role: 'manager' },
        { skip: user?.role === ROLES.SUPER_ADMIN || !companyId }
    );
    const { data: attendanceRes, isLoading: loadingAttendance } = useGetAttendanceReportQuery(
        { range: 'week' },
        { skip: user?.role === ROLES.SUPER_ADMIN }
    );
    const { data: tasksRes, isLoading: loadingTasks } = useGetAdminTasksQuery(
        { company_id: companyId },
        { skip: user?.role === ROLES.SUPER_ADMIN || !companyId }
    );

    const isLoading = loadingStaff || loadingManagers || loadingAttendance || loadingTasks;

    const staff = staffRes?.data || staffRes?.users || staffRes || [];
    const staffList = Array.isArray(staff) ? staff : [];

    const managers = managerRes?.data || managerRes?.users || managerRes || [];
    const managersList = Array.isArray(managers) ? managers : [];

    const tasks = tasksRes?.data || tasksRes || [];
    const tasksList = Array.isArray(tasks) ? tasks : [];

    const attSummary = attendanceRes?.summary || {};

    // ── Super Admin redirect message ──
    if (user?.role === ROLES.SUPER_ADMIN) {
        return (
            <DashboardLayout>
                <VStack align="stretch" spacing={6}>
                    <Box
                        bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                        borderRadius="2xl" p={{ base: 6, md: 10 }} position="relative" overflow="hidden"
                    >
                        <Box position="absolute" top="-50px" right="-50px" w="200px" h="200px" borderRadius="full" bg="whiteAlpha.50" />
                        <Box position="absolute" bottom="-30px" left="20%" w="140px" h="140px" borderRadius="full" bg="whiteAlpha.30" />
                        <Heading size="xl" color="white" mb={2} position="relative">
                            Welcome back, {user?.firstName} {user?.lastName} 👋
                        </Heading>
                        <Text color="whiteAlpha.700" fontSize="md" position="relative">
                            Visit the <strong>SuperAdmin Dashboard</strong> from the sidebar for complete system overview
                        </Text>
                    </Box>
                </VStack>
            </DashboardLayout>
        );
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <Flex justify="center" align="center" minH="400px">
                    <VStack spacing={4}>
                        <Spinner size="xl" color="purple.500" thickness="4px" />
                        <Text color="gray.500" fontSize="sm">Loading dashboard data…</Text>
                    </VStack>
                </Flex>
            </DashboardLayout>
        );
    }

    const pendingTasks = tasksList.filter(t => t.status === 'pending').length;

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>

                {/* ── Hero Header ── */}
                <Box
                    bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    borderRadius="2xl" p={{ base: 6, md: 10 }} position="relative" overflow="hidden"
                >
                    <Box position="absolute" top="-60px" right="-40px" w="220px" h="220px" borderRadius="full" bg="whiteAlpha.50" />
                    <Box position="absolute" bottom="-40px" left="25%" w="160px" h="160px" borderRadius="full" bg="whiteAlpha.30" />

                    <Flex justify="space-between" align="flex-end" flexWrap="wrap" gap={4} position="relative">
                        <Box>
                            <Text fontSize="xs" color="whiteAlpha.500" fontWeight="600" letterSpacing="wider"
                                textTransform="uppercase" mb={1}>
                                Company Dashboard
                            </Text>
                            <Heading size="xl" color="white" letterSpacing="-0.02em" mb={1}>
                                Welcome back, {user?.companyName} 👋
                            </Heading>
                            <Text color="whiteAlpha.700" fontSize="sm">
                                Here's what's happening with your workforce today
                            </Text>
                        </Box>

                        {/* Quick stats pills */}
                        <HStack spacing={3} flexWrap="wrap">
                            <Box bg="whiteAlpha.200" backdropFilter="blur(10px)" px={4} py={2} borderRadius="xl">
                                <Text fontSize="2xl" fontWeight="bold" color="white" lineHeight="1">{staffList.length}</Text>
                                <Text fontSize="xs" color="whiteAlpha.700">Staff</Text>
                            </Box>
                            <Box bg="whiteAlpha.200" backdropFilter="blur(10px)" px={4} py={2} borderRadius="xl">
                                <Text fontSize="2xl" fontWeight="bold" color="white" lineHeight="1">{managersList.length}</Text>
                                <Text fontSize="xs" color="whiteAlpha.700">Managers</Text>
                            </Box>
                            <Box bg="whiteAlpha.200" backdropFilter="blur(10px)" px={4} py={2} borderRadius="xl">
                                <Text fontSize="2xl" fontWeight="bold" color="white" lineHeight="1">{tasksList.length}</Text>
                                <Text fontSize="xs" color="whiteAlpha.700">Tasks</Text>
                            </Box>
                        </HStack>
                    </Flex>
                </Box>

                {/* ── Main Stat Cards (Using Real Fetched Data) ── */}
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
                    {[
                        { icon: FiUsers, label: 'Total Staff', value: staffList.length, sub: 'Active staff members', color: 'purple' },
                        { icon: FiBriefcase, label: 'Total Managers', value: managersList.length, sub: 'Active managers', color: 'blue' },
                        { icon: FiCheckCircle, label: 'My Week Present', value: attSummary.present_days || 0, sub: `${attSummary.absent_days || 0} days absent`, color: 'green' },
                        { icon: FiTrendingUp, label: 'Total Tasks', value: tasksList.length, sub: `${pendingTasks} tasks pending`, color: 'orange' },
                    ].map(c => (
                        <Card key={c.label} p={0} overflow="hidden"
                            _hover={{ shadow: 'xl', transform: 'translateY(-3px)' }}
                            transition="all 0.25s" cursor="default">
                            <Box h="3px" bgGradient={`linear(to-r, ${c.color}.400, ${c.color}.600)`} />
                            <Box p={5}>
                                <HStack spacing={4}>
                                    <Box p={3} bg={`${c.color}.50`} borderRadius="xl">
                                        <Icon as={c.icon} boxSize={6} color={`${c.color}.500`} />
                                    </Box>
                                    <Box flex={1}>
                                        <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                                            {c.label}
                                        </Text>
                                        <Text fontSize="3xl" fontWeight="800" color="gray.800" lineHeight="1.1" mt={0.5}>
                                            {c.value}
                                        </Text>
                                        <Text fontSize="xs" color="gray.400" mt={0.5}>{c.sub}</Text>
                                    </Box>
                                </HStack>
                            </Box>
                        </Card>
                    ))}
                </SimpleGrid>

                {/* ── Visual Lists Section ── */}
                <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
                    
                    {/* Managers List */}
                    <Card p={0} overflow="hidden" boxShadow="md" border="1px solid" borderColor="gray.100">
                        <Box p={5} borderBottom="1px solid" borderColor="gray.100" bgGradient="linear(to-r, gray.50, white)">
                            <HStack justify="space-between">
                                <HStack spacing={3}>
                                    <Box p={2.5} bg="blue.50" borderRadius="xl">
                                        <Icon as={FiBriefcase} boxSize={5} color="blue.500" />
                                    </Box>
                                    <Box>
                                        <Heading size="sm" color="gray.800">Company Managers</Heading>
                                        <Text fontSize="xs" color="gray.500">Overview of management team</Text>
                                    </Box>
                                </HStack>
                                <Badge colorScheme="blue" borderRadius="full" px={3} py={0.5}>
                                    {managersList.length} Total
                                </Badge>
                            </HStack>
                        </Box>
                        <Box overflowX="auto" maxH="400px" overflowY="auto">
                            {managersList.length === 0 ? (
                                <Text p={6} textAlign="center" color="gray.500" fontSize="sm">No managers found.</Text>
                            ) : (
                                <Table variant="simple" size="sm" w="100%" style={{ minWidth: '800px' }}>
                                    <Thead position="sticky" top={0} zIndex={1}>
                                        <Tr>
                                            <Th bg="gray.800" color="white" borderBottom="none" py={3}>Name</Th>
                                            <Th bg="gray.800" color="white" borderBottom="none">Contact</Th>
                                            <Th bg="gray.800" color="white" borderBottom="none">Status</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {managersList.slice(0, 10).map((m, i) => {
                                            const roleName = typeof m.role === 'object' ? m.role?.name : m.role || 'Manager';
                                            const fullName = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`.trim();
                                            return (
                                            <Tr key={m.id} bg={i % 2 === 0 ? 'white' : 'gray.50'} _hover={{ bg: 'blue.50' }}>
                                                <Td py={3}>
                                                    <HStack spacing={3}>
                                                        <Avatar size="sm" src={m.p_image_url || m.profileImage} name={fullName} bg="blue.100" color="blue.600" />
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontSize="sm" fontWeight="600" color="gray.800">{fullName || '—'}</Text>
                                                            <Text fontSize="xs" color="gray.500">{roleName}</Text>
                                                        </VStack>
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    <HStack spacing={1}><Icon as={FiMail} color="gray.400" boxSize={3}/><Text fontSize="xs" color="gray.600">{m.email || '—'}</Text></HStack>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={m.status === 'active' || m.status === 1 ? 'green' : 'gray'} fontSize="2xs" borderRadius="full" px={2}>
                                                        {m.status === 'active' || m.status === 1 ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </Td>
                                            </Tr>
                                        )})}
                                    </Tbody>
                                </Table>
                            )}
                        </Box>
                    </Card>

                    {/* Staff List */}
                    <Card p={0} overflow="hidden" boxShadow="md" border="1px solid" borderColor="gray.100">
                        <Box p={5} borderBottom="1px solid" borderColor="gray.100" bgGradient="linear(to-r, gray.50, white)">
                            <HStack justify="space-between">
                                <HStack spacing={3}>
                                    <Box p={2.5} bg="purple.50" borderRadius="xl">
                                        <Icon as={FiUsers} boxSize={5} color="purple.500" />
                                    </Box>
                                    <Box>
                                        <Heading size="sm" color="gray.800">Staff Members</Heading>
                                        <Text fontSize="xs" color="gray.500">Recent staff overview</Text>
                                    </Box>
                                </HStack>
                                <Badge colorScheme="purple" borderRadius="full" px={3} py={0.5}>
                                    {staffList.length} Total
                                </Badge>
                            </HStack>
                        </Box>
                        <Box overflowX="auto" maxH="400px" overflowY="auto">
                            {staffList.length === 0 ? (
                                <Text p={6} textAlign="center" color="gray.500" fontSize="sm">No staff members found.</Text>
                            ) : (
                                <Table variant="simple" size="sm" w="100%" style={{ minWidth: '800px' }}>
                                    <Thead position="sticky" top={0} zIndex={1}>
                                        <Tr bg="gray.800">
                                            <Th bg="gray.800" color="white" borderBottom="none" py={3}>Name</Th>
                                            <Th bg="gray.800" color="white" borderBottom="none">Contact</Th>
                                            <Th bg="gray.800" color="white" borderBottom="none">Status</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {staffList.slice(0, 10).map((s, i) => {
                                            const roleName = typeof s.role === 'object' ? s.role?.name : s.role || 'Staff';
                                            const fullName = `${s.first_name || s.firstName || ''} ${s.last_name || s.lastName || ''}`.trim();
                                            return (
                                            <Tr key={s.id} bg={i % 2 === 0 ? 'white' : 'gray.50'} _hover={{ bg: 'purple.50' }}>
                                                <Td py={3}>
                                                    <HStack spacing={3}>
                                                        <Avatar size="sm" src={s.p_image_url || s.profileImage} name={fullName} bg="purple.100" color="purple.600" />
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontSize="sm" fontWeight="600" color="gray.800">{fullName || '—'}</Text>
                                                            <Text fontSize="xs" color="gray.500">{roleName}</Text>
                                                        </VStack>
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    <HStack spacing={1}><Icon as={FiMail} color="gray.400" boxSize={3}/><Text fontSize="xs" color="gray.600">{s.email || '—'}</Text></HStack>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={s.status === 'active' || s.status === 1 ? 'green' : 'gray'} fontSize="2xs" borderRadius="full" px={2}>
                                                        {s.status === 'active' || s.status === 1 ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </Td>
                                            </Tr>
                                        )})}
                                    </Tbody>
                                </Table>
                            )}
                        </Box>
                    </Card>

                </SimpleGrid>

                {/* ── Quick Activity Overview ── */}
                <Card bg="gray.50" border="1px solid" borderColor="gray.100"
                    _hover={{ shadow: 'md' }} transition="all 0.2s">
                    <HStack spacing={4}>
                        <Box p={3} bg="purple.50" borderRadius="xl" flexShrink={0}>
                            <Icon as={FiActivity} boxSize={5} color="purple.500" />
                        </Box>
                        <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="800" color="gray.800">My Week Overview</Text>
                            <Text fontSize="xs" color="gray.600">
                                <strong>Present:</strong> {attSummary.present_days || 0} &nbsp;|&nbsp;
                                <strong>Leave:</strong> {attSummary.leave_days || 0} &nbsp;|&nbsp;
                                <strong>Absent:</strong> {attSummary.absent_days || 0} &nbsp;|&nbsp;
                                <strong>Worked:</strong> {attSummary.total_worked || '0h'}
                            </Text>
                        </VStack>
                    </HStack>
                </Card>
            </VStack>
        </DashboardLayout>
    );
};

export default Dashboard;
