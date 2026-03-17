import { useState } from 'react';
import {
    Box, Container, VStack, HStack, Heading, Text, Select, Grid, GridItem,
    Card, CardHeader, CardBody, Stat, StatLabel, StatNumber, StatHelpText,
    Table, Thead, Tbody, Tr, Th, Td, Badge, Icon, Spinner, Alert, AlertIcon, Flex,
} from '@chakra-ui/react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiUsers, FiBriefcase, FiActivity, FiTrendingUp, FiSearch } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useGetSuperAdminOverviewQuery, useGetCompanyDashboardQuery } from '../../store/apiSlice';

const COLORS = ['#805AD5', '#38A169', '#DD6B20', '#E53E3E', '#3182CE', '#D69E2E'];

const SuperAdminDashboard = () => {
    const [selectedCompany, setSelectedCompany] = useState('');
    const { data: overviewData, isLoading, error } = useGetSuperAdminOverviewQuery();
    const { data: companyData, isLoading: loadingCompany } = useGetCompanyDashboardQuery(
        selectedCompany,
        { skip: !selectedCompany }
    );

    if (isLoading) {
        return (
            <DashboardLayout>
                <Flex justify="center" align="center" minH="400px">
                    <VStack spacing={4}>
                        <Spinner size="xl" color="purple.500" thickness="4px" />
                        <Text color="gray.500" fontSize="sm">Loading dashboard…</Text>
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
                    Failed to load dashboard data. Please try again.
                </Alert>
            </DashboardLayout>
        );
    }

    const overviewCards = [
        { label: 'Total Companies', value: overviewData?.data?.totalCompanies || 0, sub: 'Approved companies', icon: FiBriefcase, color: 'purple' },
        { label: 'Total Staff', value: overviewData?.data?.totalStaff || 0, sub: 'Across all companies', icon: FiUsers, color: 'green' },
        { label: 'Total Managers', value: overviewData?.data?.totalManagers || 0, sub: 'System managers', icon: FiTrendingUp, color: 'blue' },
        { label: 'Active Today', value: overviewData?.data?.activeToday || 0, sub: 'Checked in', icon: FiActivity, color: 'orange' },
    ];

    return (
        <DashboardLayout>
            <VStack spacing={6} align="stretch">

                {/* ── Hero Header ── */}
                <Box
                    bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    borderRadius="2xl" p={{ base: 6, md: 10 }} position="relative" overflow="hidden"
                >
                    <Box position="absolute" top="-60px" right="-40px" w="220px" h="220px" borderRadius="full" bg="whiteAlpha.50" />
                    <Box position="absolute" bottom="-40px" left="30%" w="160px" h="160px" borderRadius="full" bg="whiteAlpha.30" />

                    <Flex justify="space-between" align="flex-end" flexWrap="wrap" gap={4} position="relative">
                        <Box>
                            <Text fontSize="xs" color="whiteAlpha.500" fontWeight="600" letterSpacing="wider"
                                textTransform="uppercase" mb={1}>
                                Super Admin
                            </Text>
                            <Heading size="xl" color="white" letterSpacing="-0.02em" mb={1}>
                                System Overview
                            </Heading>
                            <Text color="whiteAlpha.700" fontSize="sm">
                                Overview of all companies and system statistics
                            </Text>
                        </Box>

                        <HStack spacing={3} flexWrap="wrap">
                            {overviewCards.map(c => (
                                <Box key={c.label} bg="whiteAlpha.200" backdropFilter="blur(10px)" px={4} py={2} borderRadius="xl">
                                    <Text fontSize="2xl" fontWeight="bold" color="white" lineHeight="1">{c.value}</Text>
                                    <Text fontSize="xs" color="whiteAlpha.700">{c.label.replace('Total ', '')}</Text>
                                </Box>
                            ))}
                        </HStack>
                    </Flex>
                </Box>

                {/* ── Overview Stat Cards ── */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={5}>
                    {overviewCards.map(c => (
                        <GridItem key={c.label}>
                            <Box
                                bg="white" borderRadius="xl" overflow="hidden"
                                boxShadow="sm" borderWidth="1px" borderColor="gray.100"
                                transition="all 0.25s"
                                _hover={{ shadow: 'xl', transform: 'translateY(-3px)' }}
                            >
                                <Box h="3px" bgGradient={`linear(to-r, ${c.color}.400, ${c.color}.600)`} />
                                <Box p={5}>
                                    <HStack spacing={4}>
                                        <Box p={3} bg={`${c.color}.50`} borderRadius="xl">
                                            <Icon as={c.icon} boxSize={6} color={`${c.color}.500`} />
                                        </Box>
                                        <Stat flex={1}>
                                            <StatLabel fontSize="xs" fontWeight="600" color="gray.500"
                                                textTransform="uppercase" letterSpacing="wide">
                                                {c.label}
                                            </StatLabel>
                                            <StatNumber fontSize="3xl" fontWeight="800" color="gray.800">{c.value}</StatNumber>
                                            <StatHelpText fontSize="xs" color="gray.400" mb={0}>{c.sub}</StatHelpText>
                                        </Stat>
                                    </HStack>
                                </Box>
                            </Box>
                        </GridItem>
                    ))}
                </Grid>

                {/* ── Company Selector ── */}
                <Box bg="white" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.100"
                    overflow="hidden">
                    <Box px={6} py={4} borderBottom="1px solid" borderColor="gray.100"
                        bgGradient="linear(to-r, gray.50, white)">
                        <HStack spacing={3}>
                            <Box p={2} bg="purple.50" borderRadius="lg">
                                <Icon as={FiSearch} boxSize={4} color="purple.500" />
                            </Box>
                            <Heading size="sm" color="gray.800">Select Company</Heading>
                        </HStack>
                    </Box>
                    <Box px={6} py={5}>
                        <Select
                            placeholder="Choose a company to view details..."
                            size="lg"
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                            borderRadius="xl"
                            focusBorderColor="purple.400"
                            bg="gray.50"
                        >
                            {overviewData?.data?.companiesList?.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name} ({company.staffCount} staff)
                                </option>
                            ))}
                        </Select>
                    </Box>
                </Box>

                {/* ── Company Details ── */}
                {selectedCompany && (
                    <>
                        {loadingCompany ? (
                            <Flex justify="center" py={8}>
                                <VStack spacing={3}>
                                    <Spinner size="lg" color="purple.500" thickness="3px" />
                                    <Text fontSize="sm" color="gray.500">Loading company data…</Text>
                                </VStack>
                            </Flex>
                        ) : companyData && (
                            <VStack spacing={5} align="stretch">

                                {/* Company Info Header */}
                                <Box bg="white" borderRadius="xl" boxShadow="sm" borderWidth="1px"
                                    borderColor="gray.100" overflow="hidden">
                                    <Box h="3px" bgGradient="linear(to-r, purple.400, blue.500)" />
                                    <Box p={6}>
                                        <HStack justify="space-between" flexWrap="wrap" gap={3}>
                                            <Box>
                                                <Heading size="lg" color="gray.800">{companyData?.data?.companyInfo.name}</Heading>
                                                <Text fontSize="sm" color="gray.500" mt={1}>Company ID: {companyData?.data?.companyInfo.id}</Text>
                                            </Box>
                                            <Badge colorScheme="green" fontSize="md" px={4} py={2} borderRadius="full" fontWeight="600">
                                                {companyData?.data?.companyInfo.status}
                                            </Badge>
                                        </HStack>
                                    </Box>
                                </Box>

                                {/* Company Stats */}
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={5}>
                                    {[
                                        { label: 'Total Staff', value: companyData?.data?.staffCount, sub: `${companyData?.data?.managersCount} managers`, color: 'purple' },
                                        { label: 'Check-in Today', value: companyData?.data?.todayCheckIns, sub: `${companyData?.data?.todayCheckOuts} checked out`, color: 'green' },
                                        { label: 'Leaves', value: companyData?.data?.pendingLeaves, sub: `${companyData?.data?.approvedLeaves} approved`, color: 'orange' },
                                    ].map(c => (
                                        <GridItem key={c.label}>
                                            <Box bg="white" borderRadius="xl" overflow="hidden" boxShadow="sm"
                                                borderWidth="1px" borderColor="gray.100"
                                                _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                                                transition="all 0.25s">
                                                <Box h="3px" bgGradient={`linear(to-r, ${c.color}.400, ${c.color}.600)`} />
                                                <Box p={5}>
                                                    <Stat>
                                                        <StatLabel fontSize="xs" fontWeight="600" color="gray.500"
                                                            textTransform="uppercase" letterSpacing="wide">{c.label}</StatLabel>
                                                        <StatNumber fontSize="3xl" fontWeight="800" color="gray.800">{c.value}</StatNumber>
                                                        <StatHelpText fontSize="xs" color="gray.400" mb={0}>{c.sub}</StatHelpText>
                                                    </Stat>
                                                </Box>
                                            </Box>
                                        </GridItem>
                                    ))}
                                </Grid>

                                {/* Charts */}
                                {companyData?.data?.departmentStats && companyData?.data?.departmentStats.length > 0 && (
                                    <Box bg="white" borderRadius="xl" boxShadow="sm" borderWidth="1px"
                                        borderColor="gray.100" overflow="hidden">
                                        <Box px={6} py={4} borderBottom="1px solid" borderColor="gray.100"
                                            bgGradient="linear(to-r, gray.50, white)">
                                            <Heading size="sm" color="gray.800">Department Distribution</Heading>
                                        </Box>
                                        <Box p={6}>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie
                                                        data={companyData?.data?.departmentStats}
                                                        dataKey="count"
                                                        nameKey="department"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={100}
                                                        label
                                                    >
                                                        {companyData?.data?.departmentStats.map((entry, index) => (
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

                                {/* Staff List */}
                                <Box bg="white" borderRadius="xl" boxShadow="sm" borderWidth="1px"
                                    borderColor="gray.100" overflow="hidden">
                                    <Box px={6} py={4} borderBottom="1px solid" borderColor="gray.100"
                                        bgGradient="linear(to-r, gray.50, white)">
                                        <HStack justify="space-between">
                                            <Heading size="sm" color="gray.800">Staff Members</Heading>
                                            <Badge colorScheme="purple" borderRadius="full" px={3} py={0.5} fontSize="xs">
                                                {companyData?.data?.staffList?.length || 0} total
                                            </Badge>
                                        </HStack>
                                    </Box>
                                    <Box overflowX="auto">
                                        <Table variant="simple" size="sm" w="100%" style={{ minWidth: '800px' }}>
                                            <Thead>
                                                <Tr>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">ID</Th>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Name</Th>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Email</Th>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Designation</Th>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Department</Th>
                                                    <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Status</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {companyData?.data?.staffList?.map((staff) => (
                                                    <Tr key={staff.id}
                                                        _hover={{ bg: 'purple.50' }}
                                                        transition="all 0.15s">
                                                        <Td fontSize="sm" color="gray.500" fontWeight="600">{staff.id}</Td>
                                                        <Td fontWeight="600" fontSize="sm" color="gray.800">{staff.name}</Td>
                                                        <Td fontSize="sm" color="gray.600">{staff.email}</Td>
                                                        <Td fontSize="sm" color="gray.600">{staff.designation}</Td>
                                                        <Td fontSize="sm" color="gray.500">{staff.department || 'N/A'}</Td>
                                                        <Td>
                                                            <Badge
                                                                colorScheme={staff.status === 'active' ? 'green' : 'gray'}
                                                                borderRadius="full" px={2.5} py={0.5} fontSize="xs"
                                                            >
                                                                {staff.status}
                                                            </Badge>
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                </Box>
                            </VStack>
                        )}
                    </>
                )}

                {/* Default View */}
                {!selectedCompany && (
                    <Box bg="white" borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.100">
                        <Box textAlign="center" py={16}>
                            <Box p={5} borderRadius="full" bg="purple.50" display="inline-flex" mb={4}>
                                <Icon as={FiBriefcase} boxSize={12} color="purple.300" />
                            </Box>
                            <Heading size="md" color="gray.500" mb={2}>
                                No Company Selected
                            </Heading>
                            <Text color="gray.400" fontSize="sm">
                                Select a company from the dropdown above to view detailed statistics
                            </Text>
                        </Box>
                    </Box>
                )}
            </VStack>
        </DashboardLayout>
    );
};

export default SuperAdminDashboard;
