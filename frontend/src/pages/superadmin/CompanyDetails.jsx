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
    Flex,
    Icon,
} from '@chakra-ui/react';
import { FiBriefcase, FiUsers, FiUserCheck, FiFolder, FiArrowLeft, FiActivity } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
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
                    <VStack spacing={4}>
                        <Spinner size="xl" color="purple.500" thickness="4px" />
                        <Text color="gray.500" fontWeight="500">Loading company details...</Text>
                    </VStack>
                </Center>
            </DashboardLayout>
        );
    }

    if (!companyStats) {
        return (
            <DashboardLayout>
                <Center minH="400px">
                    <VStack spacing={4}>
                        <Text fontSize="xl" color="gray.600" fontWeight="600">
                            Company not found
                        </Text>
                        <Button 
                            leftIcon={<FiArrowLeft />}
                            colorScheme="purple"
                            onClick={() => navigate('/superadmin/users-list')}>
                            Back to Companies List
                        </Button>
                    </VStack>
                </Center>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>
                {/* ── Hero Header ── */}
                <Box
                    bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    borderRadius="2xl" p={{ base: 6, md: 8 }} position="relative" overflow="hidden"
                >
                    <Box position="absolute" top="-40px" right="-40px" w="180px" h="180px" borderRadius="full" bg="whiteAlpha.50" />
                    <Box position="absolute" bottom="-20px" left="15%" w="120px" h="120px" borderRadius="full" bg="whiteAlpha.30" />

                    <Flex justify="space-between" align="flex-end" flexWrap="wrap" gap={4} position="relative">
                        <Box>
                            <HStack mb={2}>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    color="whiteAlpha.800"
                                    _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
                                    leftIcon={<FiArrowLeft />}
                                    onClick={() => navigate('/superadmin/users-list')}
                                    px={0}
                                >
                                    Back to Companies
                                </Button>
                            </HStack>
                            <HStack spacing={3} mb={1}>
                                <Icon as={FiBriefcase} boxSize={8} color="white" />
                                <Heading size="xl" color="white" letterSpacing="-0.02em">
                                    {companyStats.stats.companyName}
                                </Heading>
                            </HStack>
                            <Text color="whiteAlpha.700" fontSize="sm">
                                Company ID: <strong>{companyStats.stats.companyId}</strong>
                            </Text>
                        </Box>

                        {/* Quick tags */}
                        <HStack spacing={3} flexWrap="wrap">
                            <Badge colorScheme="purple" px={3} py={1} borderRadius="full" fontSize="xs">
                                Super Admin View
                            </Badge>
                        </HStack>
                    </Flex>
                </Box>

                {/* ── Statistics Cards ── */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
                    <Card p={0} overflow="hidden" _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }} transition="all 0.25s">
                        <Box h="3px" bgGradient="linear(to-r, purple.400, purple.600)" />
                        <Box p={5}>
                            <HStack spacing={4}>
                                <Box p={3} bg="purple.50" borderRadius="xl">
                                    <Icon as={FiUsers} boxSize={6} color="purple.500" />
                                </Box>
                                <Box>
                                    <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase">Total Users</Text>
                                    <Text fontSize="3xl" fontWeight="800" color="gray.800" lineHeight="1.1">{companyStats.stats.totalUsers}</Text>
                                </Box>
                            </HStack>
                        </Box>
                    </Card>

                    <Card p={0} overflow="hidden" _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }} transition="all 0.25s">
                        <Box h="3px" bgGradient="linear(to-r, blue.400, blue.600)" />
                        <Box p={5}>
                            <HStack spacing={4}>
                                <Box p={3} bg="blue.50" borderRadius="xl">
                                    <Icon as={FiBriefcase} boxSize={6} color="blue.500" />
                                </Box>
                                <Box>
                                    <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase">Managers</Text>
                                    <Text fontSize="3xl" fontWeight="800" color="gray.800" lineHeight="1.1">{managers.length}</Text>
                                </Box>
                            </HStack>
                        </Box>
                    </Card>

                    <Card p={0} overflow="hidden" _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }} transition="all 0.25s">
                        <Box h="3px" bgGradient="linear(to-r, green.400, green.600)" />
                        <Box p={5}>
                            <HStack spacing={4}>
                                <Box p={3} bg="green.50" borderRadius="xl">
                                    <Icon as={FiUserCheck} boxSize={6} color="green.500" />
                                </Box>
                                <Box>
                                    <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase">Staff</Text>
                                    <Text fontSize="3xl" fontWeight="800" color="gray.800" lineHeight="1.1">{staff.length}</Text>
                                </Box>
                            </HStack>
                        </Box>
                    </Card>
                </SimpleGrid>

                {/* ── Detailed Lists Tabs ── */}
                <Card p={0} overflow="hidden" boxShadow="md" border="1px solid" borderColor="gray.100">
                    <Tabs colorScheme="purple">
                        <TabList px={6} pt={5} pb={4} borderBottom="1px solid" borderColor="gray.100" bgGradient="linear(to-r, gray.50, white)">
                            <Tab _selected={{ color: 'purple.600', bg: 'purple.50', borderColor: 'purple.200' }} borderRadius="lg" px={4} py={2} fontWeight="600" transition="all 0.2s" border="1px solid transparent">
                                <HStack spacing={2}>
                                    <Icon as={FiUserCheck} />
                                    <Text>Team Members</Text>
                                    <Badge colorScheme="purple" borderRadius="full">{companyStats.users?.length || 0}</Badge>
                                </HStack>
                            </Tab>
                            <Tab _selected={{ color: 'green.600', bg: 'green.50', borderColor: 'green.200' }} borderRadius="lg" px={4} py={2} fontWeight="600" transition="all 0.2s" border="1px solid transparent">
                                <HStack spacing={2}>
                                    <Icon as={FiFolder} />
                                    <Text>Staff Roster</Text>
                                    <Badge colorScheme="green" borderRadius="full">{staff.length}</Badge>
                                </HStack>
                            </Tab>
                            <Tab _selected={{ color: 'blue.600', bg: 'blue.50', borderColor: 'blue.200' }} borderRadius="lg" px={4} py={2} fontWeight="600" transition="all 0.2s" border="1px solid transparent">
                                <HStack spacing={2}>
                                    <Icon as={FiBriefcase} />
                                    <Text>Managers</Text>
                                    <Badge colorScheme="blue" borderRadius="full">{managers.length}</Badge>
                                </HStack>
                            </Tab>
                        </TabList>

                        <TabPanels>
                            {/* Team Members Tab */}
                            <TabPanel p={0}>
                                <Box overflowX="auto">
                                    <Table variant="simple" size="sm" w="100%" style={{ minWidth: '800px' }}>
                                        <Thead>
                                            <Tr>
                                                <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">User Profile</Th>
                                                <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Email</Th>
                                                <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Mobile</Th>
                                                <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">System Role</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {companyStats.users?.map((usr, i) => (
                                                <Tr key={usr.id} bg={i % 2 === 0 ? 'white' : 'gray.50'} _hover={{ bg: 'purple.50' }} transition="all 0.15s">
                                                    <Td py={3}>
                                                        <HStack spacing={3}>
                                                            <Avatar size="sm" name={`${usr.firstName} ${usr.lastName}`} bg="purple.100" color="purple.600" />
                                                            <Text fontWeight="600" color="gray.800" fontSize="sm">{usr.firstName} {usr.lastName}</Text>
                                                        </HStack>
                                                    </Td>
                                                    <Td><Text fontSize="sm" color="gray.600">{usr.email}</Text></Td>
                                                    <Td><Text fontSize="sm" color="gray.600">{usr.mobile || 'N/A'}</Text></Td>
                                                    <Td>
                                                        <Badge colorScheme="purple" fontSize="2xs" px={2} py={0.5} borderRadius="full">
                                                            {usr.role}
                                                        </Badge>
                                                    </Td>
                                                </Tr>
                                            ))}
                                            {(!companyStats.users || companyStats.users.length === 0) && (
                                                <Tr><Td colSpan={4} textAlign="center" py={6} color="gray.500">No team members found.</Td></Tr>
                                            )}
                                        </Tbody>
                                    </Table>
                                </Box>
                            </TabPanel>

                            {/* Staff Tab */}
                            <TabPanel p={0}>
                                {staffLoading ? (
                                    <Center py={10}><Spinner size="lg" color="green.500" /></Center>
                                ) : staff.length === 0 ? (
                                    <Center py={10}>
                                        <VStack>
                                            <Icon as={FiFolder} boxSize={8} color="gray.300" mb={2}/>
                                            <Text fontWeight="600" color="gray.500">No staff members found</Text>
                                            <Text fontSize="sm" color="gray.400">This company hasn't added any staff yet</Text>
                                        </VStack>
                                    </Center>
                                ) : (
                                    <Box overflowX="auto">
                                        <Table variant="simple" size="sm" w="100%" style={{ minWidth: '800px' }}>
                                            <Thead>
                                                <Tr>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Staff Member</Th>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Email</Th>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Position & Dept</Th>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Mobile</Th>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Status</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {staff.map((member, i) => (
                                                    <Tr key={member.id} bg={i % 2 === 0 ? 'white' : 'gray.50'} _hover={{ bg: 'green.50' }} transition="all 0.15s">
                                                        <Td py={3}>
                                                            <HStack spacing={3}>
                                                                <Avatar size="sm" name={`${member.firstName} ${member.lastName}`} src={member.profileImage} bg="green.100" color="green.600" />
                                                                <Text fontWeight="600" color="gray.800" fontSize="sm">{member.firstName} {member.lastName}</Text>
                                                            </HStack>
                                                        </Td>
                                                        <Td><Text fontSize="sm" color="gray.600">{member.email}</Text></Td>
                                                        <Td>
                                                            <VStack align="start" spacing={0}>
                                                                <Text fontSize="sm" fontWeight="500" color="gray.700">{member.position || 'N/A'}</Text>
                                                                <Text fontSize="xs" color="gray.500">{member.department || 'N/A'}</Text>
                                                            </VStack>
                                                        </Td>
                                                        <Td><Text fontSize="sm" color="gray.600">{member.mobile || 'N/A'}</Text></Td>
                                                        <Td>
                                                            <Badge colorScheme={member.status === 'active' ? 'green' : 'gray'} fontSize="2xs" px={2} py={0.5} borderRadius="full">
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
                                    <Center py={10}><Spinner size="lg" color="blue.500" /></Center>
                                ) : managers.length === 0 ? (
                                    <Center py={10}>
                                        <VStack>
                                            <Icon as={FiBriefcase} boxSize={8} color="gray.300" mb={2}/>
                                            <Text fontWeight="600" color="gray.500">No managers found</Text>
                                            <Text fontSize="sm" color="gray.400">This company hasn't added any managers yet</Text>
                                        </VStack>
                                    </Center>
                                ) : (
                                    <Box overflowX="auto">
                                        <Table variant="simple" size="sm" w="100%" style={{ minWidth: '800px' }}>
                                            <Thead>
                                                <Tr>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Manager Profile</Th>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Email</Th>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Role Info</Th>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Department</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {managers.map((manager, i) => (
                                                    <Tr key={manager.id} bg={i % 2 === 0 ? 'white' : 'gray.50'} _hover={{ bg: 'blue.50' }} transition="all 0.15s">
                                                        <Td py={3}>
                                                            <HStack spacing={3}>
                                                                <Avatar size="sm" name={`${manager.firstName} ${manager.lastName}`} bg="blue.100" color="blue.600" />
                                                                <Box>
                                                                    <Text fontWeight="600" color="gray.800" fontSize="sm">{manager.firstName} {manager.lastName}</Text>
                                                                    <Text fontSize="xs" color="gray.500">ID: {manager.id}</Text>
                                                                </Box>
                                                            </HStack>
                                                        </Td>
                                                        <Td><Text fontSize="sm" color="gray.600">{manager.email}</Text></Td>
                                                        <Td>
                                                            <Badge colorScheme="blue" fontSize="2xs" px={2} py={0.5} borderRadius="full">
                                                                {manager.designation || 'Manager'}
                                                            </Badge>
                                                        </Td>
                                                        <Td><Text fontSize="sm" color="gray.600">{manager.department || 'N/A'}</Text></Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                )}
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </Card>
            </VStack>
        </DashboardLayout>
    );
};

export default CompanyDetails;
