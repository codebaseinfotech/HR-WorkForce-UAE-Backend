import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    VStack,
    Heading,
    Text,
    HStack,
    Badge,
    Spinner,
    Center,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Avatar,
    Button,
    useToast,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
} from '@chakra-ui/react';
import { FiBriefcase, FiUsers, FiUserCheck, FiFolder } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const CompanyDetails = () => {
    const [companyStats, setCompanyStats] = useState(null);
    const [staff, setStaff] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [staffLoading, setStaffLoading] = useState(false);
    const [managersLoading, setManagersLoading] = useState(false);
    const { id } = useParams(); // User ID
    const toast = useToast();
    const navigate = useNavigate();

    const fetchCompanyStats = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/users/${id}/company-stats`);
            setCompanyStats(response.data);

            // Fetch staff and managers for this company
            if (response.data.stats.companyId) {
                fetchCompanyStaff(response.data.stats.companyId);
                fetchCompanyManagers(response.data.stats.companyId);
            }
        } catch (error) {
            console.error('Error fetching company stats:', error);
            toast({
                title: 'Error fetching data',
                description: error.response?.data?.message || 'Failed to load company details',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            navigate('/superadmin/users-list');
        } finally {
            setLoading(false);
        }
    }, [id, toast, navigate]);

    const fetchCompanyStaff = async (companyId) => {
        try {
            setStaffLoading(true);
            const response = await api.get(`/staff/list?companyId=${companyId}`);
            setStaff(response.data.staff || []);
        } catch (error) {
            console.error('Error fetching company staff:', error);
            toast({
                title: 'Error fetching staff',
                description: 'Failed to load company staff',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setStaffLoading(false);
        }
    };

    const fetchCompanyManagers = async (companyId) => {
        try {
            setManagersLoading(true);
            const response = await api.get(`/managers/list?companyId=${companyId}`);
            setManagers(response.data.managers || []);
        } catch (error) {
            console.error('Error fetching company managers:', error);
            toast({
                title: 'Error fetching managers',
                description: 'Failed to load company managers',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setManagersLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanyStats();
    }, [fetchCompanyStats]);

    if (loading) {
        return (
            <DashboardLayout>
                <Center minH="400px">
                    <VStack>
                        <Spinner size="xl" color="primary.600" thickness="4px" />
                        <Text color="gray.600">Loading company details...</Text>
                    </VStack>
                </Center>
            </DashboardLayout>
        );
    }

    if (!companyStats) {
        return (
            <DashboardLayout>
                <Center minH="400px">
                    <VStack>
                        <Text fontSize="lg" color="gray.600">
                            Company not found
                        </Text>
                        <Button onClick={() => navigate('/superadmin/users-list')}>
                            Back to Users List
                        </Button>
                    </VStack>
                </Center>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>
                {/* Header */}
                <HStack justify="space-between">
                    <Box>
                        <HStack spacing={3} mb={2}>
                            <FiBriefcase size={32} />
                            <Heading size="lg">
                                {companyStats.stats.companyName}
                            </Heading>
                        </HStack>
                        <Text color="gray.600">
                            Company ID: {companyStats.stats.companyId}
                        </Text>
                    </Box>
                    <Button onClick={() => navigate('/superadmin/users-list')}>
                        Back to Users
                    </Button>
                </HStack>

                {/* Statistics Cards */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" borderWidth={1}>
                        <Stat>
                            <StatLabel color="gray.600" fontSize="sm">
                                Total Users
                            </StatLabel>
                            <StatNumber fontSize="3xl" color="primary.600">
                                {companyStats.stats.totalUsers}
                            </StatNumber>
                            <StatHelpText>
                                All company members
                            </StatHelpText>
                        </Stat>
                    </Box>

                    <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" borderWidth={1}>
                        <Stat>
                            <StatLabel color="gray.600" fontSize="sm">
                                Company Owners
                            </StatLabel>
                            <StatNumber fontSize="3xl" color="purple.600">
                                {companyStats.stats.admins}
                            </StatNumber>
                            <StatHelpText>
                                Company administrators
                            </StatHelpText>
                        </Stat>
                    </Box>

                    <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" borderWidth={1}>
                        <Stat>
                            <StatLabel color="gray.600" fontSize="sm">
                                Staff Members
                            </StatLabel>
                            <StatNumber fontSize="3xl" color="green.600">
                                {staff.length}
                            </StatNumber>
                            <StatHelpText>
                                Active staff members
                            </StatHelpText>
                        </Stat>
                    </Box>
                </SimpleGrid>

                {/* Tabs for Team Members and Staff */}
                <Box bg="white" borderRadius="xl" boxShadow="sm" borderWidth={1}>
                    <Tabs colorScheme="primary">
                        <TabList px={6} pt={4}>
                            <Tab>
                                <HStack spacing={2}>
                                    <FiUserCheck />
                                    <Text>Team Members</Text>
                                    <Badge colorScheme="purple">{companyStats.users?.length || 0}</Badge>
                                </HStack>
                            </Tab>
                            <Tab>
                                <HStack spacing={2}>
                                    <FiFolder />
                                    <Text>Staff</Text>
                                    <Badge colorScheme="green">{staff.length}</Badge>
                                </HStack>
                            </Tab>
                            <Tab>
                                <HStack spacing={2}>
                                    <FiUsers />
                                    <Text>Managers</Text>
                                    <Badge colorScheme="blue">{managers.length}</Badge>
                                </HStack>
                            </Tab>
                        </TabList>

                        <TabPanels>
                            {/* Team Members Tab */}
                            <TabPanel p={0}>
                                <Box overflow="auto">
                                    <Table variant="simple">
                                        <Thead bg="gray.50">
                                            <Tr>
                                                <Th>User</Th>
                                                <Th>Email</Th>
                                                <Th>Mobile</Th>
                                                <Th>Role</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {companyStats.users?.map((user) => (
                                                <Tr key={user.id} _hover={{ bg: 'gray.50' }}>
                                                    <Td>
                                                        <HStack spacing={3}>
                                                            <Avatar
                                                                size="sm"
                                                                name={`${user.firstName} ${user.lastName}`}
                                                                bg="primary.100"
                                                            />
                                                            <Text fontWeight="medium">
                                                                {user.firstName} {user.lastName}
                                                            </Text>
                                                        </HStack>
                                                    </Td>
                                                    <Td>
                                                        <Text fontSize="sm">{user.email}</Text>
                                                    </Td>
                                                    <Td>
                                                        <Text fontSize="sm">{user.mobile || 'N/A'}</Text>
                                                    </Td>
                                                    <Td>
                                                        <Badge colorScheme="purple">
                                                            {user.role}
                                                        </Badge>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            </TabPanel>

                            {/* Staff Tab */}
                            <TabPanel p={0}>
                                {staffLoading ? (
                                    <Center py={10}>
                                        <Spinner size="lg" color="primary.600" />
                                    </Center>
                                ) : staff.length === 0 ? (
                                    <Center py={10}>
                                        <VStack>
                                            <Text color="gray.500">No staff members found</Text>
                                            <Text fontSize="sm" color="gray.400">
                                                This company hasn't added any staff yet
                                            </Text>
                                        </VStack>
                                    </Center>
                                ) : (
                                    <Box overflow="auto">
                                        <Table variant="simple">
                                            <Thead bg="gray.50">
                                                <Tr>
                                                    <Th>Staff Member</Th>
                                                    <Th>Email</Th>
                                                    <Th>Mobile</Th>
                                                    <Th>Position</Th>
                                                    <Th>Department</Th>
                                                    <Th>Status</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {staff.map((member) => (
                                                    <Tr key={member.id} _hover={{ bg: 'gray.50' }}>
                                                        <Td>
                                                            <HStack spacing={3}>
                                                                <Avatar
                                                                    size="sm"
                                                                    name={`${member.firstName} ${member.lastName}`}
                                                                    src={member.profileImage}
                                                                    bg="green.100"
                                                                />
                                                                <Text fontWeight="medium">
                                                                    {member.firstName} {member.lastName}
                                                                </Text>
                                                            </HStack>
                                                        </Td>
                                                        <Td>
                                                            <Text fontSize="sm">{member.email}</Text>
                                                        </Td>
                                                        <Td>
                                                            <Text fontSize="sm">{member.mobile || 'N/A'}</Text>
                                                        </Td>
                                                        <Td>
                                                            <Text fontSize="sm">{member.position || 'N/A'}</Text>
                                                        </Td>
                                                        <Td>
                                                            <Text fontSize="sm">{member.department || 'N/A'}</Text>
                                                        </Td>
                                                        <Td>
                                                            <Badge
                                                                colorScheme={member.status === 'active' ? 'green' : 'gray'}
                                                            >
                                                                {member.status || 'active'}
                                                            </Badge>
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                )}
                            </TabPanel>

                            {/* Managers Tab */}
                            <TabPanel p={0}>
                                {managersLoading ? (
                                    <Center py={10}>
                                        <Spinner size="lg" color="primary.600" />
                                    </Center>
                                ) : managers.length === 0 ? (
                                    <Center py={10}>
                                        <VStack>
                                            <Text color="gray.500">No managers found</Text>
                                            <Text fontSize="sm" color="gray.400">
                                                This company hasn't created any managers yet
                                            </Text>
                                        </VStack>
                                    </Center>
                                ) : (
                                    <Box overflow="auto">
                                        <Table variant="simple">
                                            <Thead bg="gray.50">
                                                <Tr>
                                                    <Th>Manager</Th>
                                                    <Th>Email</Th>
                                                    <Th>Designation</Th>
                                                    <Th>Department</Th>
                                                    <Th>Manager ID</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {managers.map((manager) => (
                                                    <Tr key={manager.id} _hover={{ bg: 'gray.50' }}>
                                                        <Td>
                                                            <HStack spacing={3}>
                                                                <Avatar
                                                                    size="sm"
                                                                    name={`${manager.firstName} ${manager.lastName}`}
                                                                    bg="blue.100"
                                                                />
                                                                <Text fontWeight="medium">
                                                                    {manager.firstName} {manager.lastName}
                                                                </Text>
                                                            </HStack>
                                                        </Td>
                                                        <Td>
                                                            <Text fontSize="sm">{manager.email}</Text>
                                                        </Td>
                                                        <Td>
                                                            <Badge colorScheme="blue">{manager.designation}</Badge>
                                                        </Td>
                                                        <Td>
                                                            <Text fontSize="sm">{manager.department || 'N/A'}</Text>
                                                        </Td>
                                                        <Td>
                                                            <Badge colorScheme="purple">{manager.id}</Badge>
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                )}
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </Box>
            </VStack>
        </DashboardLayout>
    );
};

export default CompanyDetails;
