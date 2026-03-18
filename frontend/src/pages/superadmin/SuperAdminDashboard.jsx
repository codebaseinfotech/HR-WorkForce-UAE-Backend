import { useState, useMemo } from 'react';
import {
    Box, VStack, HStack, Heading, Text, Grid, GridItem,
    Card, Stat, StatLabel, StatNumber, Icon, Spinner, Alert, AlertIcon, Flex, Select
} from '@chakra-ui/react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiUsers, FiBriefcase, FiActivity, FiCheckCircle } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useGetCompaniesQuery, useGetDashboardSummaryQuery } from '../../store/apiSlice';

const COLORS = ['#805AD5', '#38A169', '#3182CE', '#DD6B20', '#E53E3E', '#D69E2E'];

const SuperAdminDashboard = () => {
    const [selectedCompany, setSelectedCompany] = useState('');

    // Fetch list of companies for the dropdown
    const { data: companiesResponse, isLoading: loadingCompanies } = useGetCompaniesQuery();
    const companiesList = companiesResponse?.data || [];

    // Fetch dashboard summary (global if selectedCompany is empty, or specific company data)
    const { data: summaryResponse, isLoading: loadingSummary, error } = useGetDashboardSummaryQuery(selectedCompany, {
        refetchOnMountOrArgChange: true,
    });

    const isLoading = loadingCompanies || loadingSummary;

    // Process summary data
    const summary = summaryResponse?.data || {
        companies_count: 0,
        users: { total: 0, role_wise: [] },
        tasks: { total: 0, assigned: 0, by_status: {} }
    };

    const managerCount = useMemo(() => {
        if (!summary.users?.role_wise) return 0;
        const managerRole = summary.users?.role_wise.find(r => 
            r.role_name?.toLowerCase().includes('manager')
        );
        return managerRole ? managerRole.count : 0;
    }, [summary.users?.role_wise]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <Flex justify="center" align="center" minH="400px">
                    <VStack spacing={4}>
                        <Spinner size="xl" color="purple.500" thickness="4px" />
                        <Text color="gray.500" fontSize="sm">Loading dashboard data...</Text>
                    </VStack>
                </Flex>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <Alert status="error" borderRadius="xl" variant="left-accent">
                    <AlertIcon />
                    Failed to load dashboard data. Please try again or check API connection.
                </Alert>
            </DashboardLayout>
        );
    }

    // Chart Data (Role Distribution)
    const roleChartData = summary.users?.role_wise?.map(role => ({
        name: role.role_name || 'Unknown',
        value: role.count
    })) || [];

    return (
        <DashboardLayout>
            <VStack spacing={6} align="stretch">
                
                {/* ── Hero Header ── */}
                <Box
                    bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    borderRadius="2xl" p={{ base: 6, md: 8 }} position="relative" overflow="hidden"
                >
                    <Box position="absolute" top="-50px" right="-50px" w="200px" h="200px" borderRadius="full" bg="whiteAlpha.50" />
                    <Box position="absolute" bottom="-30px" left="20%" w="140px" h="140px" borderRadius="full" bg="whiteAlpha.30" />

                    <Flex justify="space-between" align="flex-end" flexWrap="wrap" gap={4} position="relative">
                        <Box>
                            <Text fontSize="xs" color="whiteAlpha.500" fontWeight="600" letterSpacing="wider" textTransform="uppercase" mb={1}>
                                Super Admin Panel
                            </Text>
                            <Heading size="xl" color="white" letterSpacing="-0.02em" mb={1}>
                                Dashboard Overview
                            </Heading>
                            <Text color="whiteAlpha.700" fontSize="sm">
                                Overview of system statistics and company data
                            </Text>
                        </Box>
                        
                        <Box w={{ base: '100%', md: '300px' }}>
                            <Select
                                placeholder="All Companies (Global Data)"
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                bg="whiteAlpha.200"
                                color="white"
                                borderColor="whiteAlpha.400"
                                size="lg"
                                borderRadius="lg"
                                _hover={{ borderColor: 'whiteAlpha.500', bg: 'whiteAlpha.300' }}
                                _focus={{ borderColor: 'white', boxShadow: 'none' }}
                                sx={{
                                    '> option': {
                                        background: '#1a1a2e',
                                        color: 'white',
                                    },
                                }}
                            >
                                {companiesList.map(company => (
                                    <option key={company.id} value={company.id}>
                                        {company.name}
                                    </option>
                                ))}
                            </Select>
                        </Box>
                    </Flex>
                </Box>

                {/* Top Stat Cards */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }} gap={5}>
                    <GridItem>
                        <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.100" transition="all 0.2s" _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}>
                            <HStack spacing={4}>
                                <Box p={3} bg="purple.50" borderRadius="xl">
                                    <Icon as={FiBriefcase} boxSize={6} color="purple.500" />
                                </Box>
                                <Stat>
                                    <StatLabel fontSize="sm" fontWeight="600" color="gray.500">Total Companies</StatLabel>
                                    <StatNumber fontSize="3xl" fontWeight="800" color="gray.800">{summary.companies_count}</StatNumber>
                                </Stat>
                            </HStack>
                        </Box>
                    </GridItem>
                    
                    <GridItem>
                        <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.100" transition="all 0.2s" _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}>
                            <HStack spacing={4}>
                                <Box p={3} bg="blue.50" borderRadius="xl">
                                    <Icon as={FiUsers} boxSize={6} color="blue.500" />
                                </Box>
                                <Stat>
                                    <StatLabel fontSize="sm" fontWeight="600" color="gray.500">Total Staff & Users</StatLabel>
                                    <StatNumber fontSize="3xl" fontWeight="800" color="gray.800">{summary.users?.total || 0}</StatNumber>
                                </Stat>
                            </HStack>
                        </Box>
                    </GridItem>
                    <GridItem>
                        <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.100" transition="all 0.2s" _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}>
                            <HStack spacing={4}>
                                <Box p={3} bg="green.50" borderRadius="xl">
                                    <Icon as={FiActivity} boxSize={6} color="green.500" />
                                </Box>
                                <Stat>
                                    <StatLabel fontSize="sm" fontWeight="600" color="gray.500">Total Managers</StatLabel>
                                    <StatNumber fontSize="3xl" fontWeight="800" color="gray.800">{managerCount}</StatNumber>
                                </Stat>
                            </HStack>
                        </Box>
                    </GridItem>

                    <GridItem>
                        <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.100" transition="all 0.2s" _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}>
                            <HStack spacing={4}>
                                <Box p={3} bg="orange.50" borderRadius="xl">
                                    <Icon as={FiCheckCircle} boxSize={6} color="orange.500" />
                                </Box>
                                <Stat>
                                    <StatLabel fontSize="sm" fontWeight="600" color="gray.500">Total Tasks</StatLabel>
                                    <StatNumber fontSize="3xl" fontWeight="800" color="gray.800">{summary.tasks?.total || 0}</StatNumber>
                                </Stat>
                            </HStack>
                        </Box>
                    </GridItem>

                </Grid>

                {/* Role Chart */}
                {roleChartData.length > 0 && (
                    <Box bg="white" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.100" overflow="hidden">
                        <Box px={6} py={4} borderBottom="1px solid" borderColor="gray.100" bgGradient="linear(to-r, gray.50, white)">
                            <Heading size="sm" color="gray.800">{selectedCompany ? 'Company Details (Roles)' : 'Overall System Roles'}</Heading>
                        </Box>
                        <Box p={6}>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={roleChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    >
                                        {roleChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Box>
                )}

            </VStack>
        </DashboardLayout>
    );
};

export default SuperAdminDashboard;
