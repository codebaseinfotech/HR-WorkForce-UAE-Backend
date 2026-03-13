import { useState } from 'react';
import {
    Box,
    Container,
    VStack,
    HStack,
    Heading,
    Text,
    Select,
    Grid,
    GridItem,
    Card,
    CardHeader,
    CardBody,
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
    Badge,
    Icon,
    Spinner,
    Alert,
    AlertIcon,
} from '@chakra-ui/react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiUsers, FiBriefcase, FiActivity, FiTrendingUp } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useGetSuperAdminOverviewQuery, useGetCompanyDashboardQuery } from '../../store/apiSlice';

const COLORS = ['#805AD5', '#38A169', '#DD6B20', '#E53E3E', '#3182CE', '#D69E2E'];

const SuperAdminDashboard = () => {
    const [selectedCompany, setSelectedCompany] = useState('');

    // Fetch overview data using RTK Query
    const { data: overviewData, isLoading, error } = useGetSuperAdminOverviewQuery();

    // Fetch company-specific data when company is selected
    const { data: companyData, isLoading: loadingCompany } = useGetCompanyDashboardQuery(
        selectedCompany,
        { skip: !selectedCompany } // Skip query if no company selected
    );

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
            <Container maxW="container.xl" py={8}>
                <VStack spacing={8} align="stretch">
                    {/* Header */}
                    <Box>
                        <Heading size="xl" mb={2}>
                                    SuperAdmin Dashboard
                                </Heading>
                        <Text color="gray.600">
                            Overview of all companies and system statistics
                                </Text>
                            </Box>

                    {/* Overview Cards */}
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
                        <GridItem>
                            <Card bg="purple.50" borderLeft="4px" borderColor="purple.500">
                                <CardBody>
                                    <Stat>
                                        <HStack justify="space-between" mb={2}>
                                            <StatLabel color="purple.700">Total Companies</StatLabel>
                                            <Icon as={FiBriefcase} boxSize={6} color="purple.500" />
                        </HStack>
                                        <StatNumber color="purple.700" fontSize="3xl">
                                            {overviewData?.data?.totalCompanies || 0}
                                        </StatNumber>
                                        <StatHelpText color="purple.600">Approved companies</StatHelpText>
                                    </Stat>
                                </CardBody>
                            </Card>
                        </GridItem>

                        <GridItem>
                            <Card bg="green.50" borderLeft="4px" borderColor="green.500">
                                <CardBody>
                                    <Stat>
                                        <HStack justify="space-between" mb={2}>
                                            <StatLabel color="green.700">Total Staff</StatLabel>
                                            <Icon as={FiUsers} boxSize={6} color="green.500" />
                            </HStack>
                                        <StatNumber color="green.700" fontSize="3xl">
                                            {overviewData?.data?.totalStaff || 0}
                                        </StatNumber>
                                        <StatHelpText color="green.600">Across all companies</StatHelpText>
                                    </Stat>
                        </CardBody>
                    </Card>
                        </GridItem>

                        <GridItem>
                            <Card bg="blue.50" borderLeft="4px" borderColor="blue.500">
                                <CardBody>
                                    <Stat>
                                        <HStack justify="space-between" mb={2}>
                                            <StatLabel color="blue.700">Total Managers</StatLabel>
                                            <Icon as={FiTrendingUp} boxSize={6} color="blue.500" />
                                        </HStack>
                                        <StatNumber color="blue.700" fontSize="3xl">
                                            {overviewData?.data?.totalManagers || 0}
                                        </StatNumber>
                                        <StatHelpText color="blue.600">System managers</StatHelpText>
                                    </Stat>
                            </CardBody>
                        </Card>
                        </GridItem>

                        <GridItem>
                            <Card bg="orange.50" borderLeft="4px" borderColor="orange.500">
                                <CardBody>
                                    <Stat>
                                        <HStack justify="space-between" mb={2}>
                                            <StatLabel color="orange.700">Active Today</StatLabel>
                                            <Icon as={FiActivity} boxSize={6} color="orange.500" />
                                        </HStack>
                                        <StatNumber color="orange.700" fontSize="3xl">
                                            {overviewData?.data?.activeToday || 0}
                                        </StatNumber>
                                        <StatHelpText color="orange.600">Checked in</StatHelpText>
                                    </Stat>
                            </CardBody>
                        </Card>
                        </GridItem>
                    </Grid>

                    {/* Company Selector */}
                    <Card>
                        <CardHeader>
                            <Heading size="md">Select Company</Heading>
                        </CardHeader>
                        <CardBody>
                            <Select
                                placeholder="Choose a company to view details..."
                                size="lg"
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                                >
                                {overviewData?.data?.companiesList?.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.name} ({company.staffCount} staff)
                                    </option>
                                ))}
                            </Select>
                        </CardBody>
                    </Card>

                    {/* Company Details */}
                    {selectedCompany && (
                        <>
                            {loadingCompany ? (
                                <Box display="flex" justifyContent="center" py={8}>
                                    <Spinner size="lg" color="purple.500" />
                                </Box>
                            ) : companyData && (
                                <VStack spacing={6} align="stretch">
                                    {/* Company Info Header */}
                                    <Card bg="gray.50">
                                        <CardBody>
                                            <HStack justify="space-between">
                                            <Box>
                                                    <Heading size="lg">{companyData?.data?.companyInfo.name}</Heading>
                                                    <Text color="gray.600">Company ID: {companyData?.data?.companyInfo.id}</Text>
                                                </Box>
                                                <Badge colorScheme="green" fontSize="md" px={4} py={2}>
                                                    {companyData?.data?.companyInfo.status}
                                                </Badge>
                                                </HStack>
                                            </CardBody>
                                        </Card>

                                    {/* Company Stats */}
                                    <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                                        <GridItem>
                                            <Card>
                                            <CardBody>
                                                    <Stat>
                                                        <StatLabel>Total Staff</StatLabel>
                                                        <StatNumber>{companyData?.data?.staffCount}</StatNumber>
                                                        <StatHelpText>{companyData?.data?.managersCount} managers</StatHelpText>
                                                    </Stat>
                                            </CardBody>
                                        </Card>
                                        </GridItem>

                                        <GridItem>
                                            <Card>
                                            <CardBody>
                                                    <Stat>
                                                        <StatLabel>Check-in Today</StatLabel>
                                                        <StatNumber>{companyData?.data?.todayCheckIns}</StatNumber>
                                                        <StatHelpText>{companyData?.data?.todayCheckOuts} checked out</StatHelpText>
                                                    </Stat>
                                            </CardBody>
                                        </Card>
                                        </GridItem>

                                        <GridItem>
                                            <Card>
                                                <CardBody>
                                                    <Stat>
                                                        <StatLabel>Leaves</StatLabel>
                                                        <StatNumber>{companyData?.data?.pendingLeaves}</StatNumber>
                                                        <StatHelpText>{companyData?.data?.approvedLeaves} approved</StatHelpText>
                                                    </Stat>
                                                </CardBody>
                                            </Card>
                                        </GridItem>
                                    </Grid>

                                    {/* Charts */}
                                    {companyData?.data?.departmentStats && companyData?.data?.departmentStats.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <Heading size="md">Department Distribution</Heading>
                                            </CardHeader>
                                            <CardBody>
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
                                            </CardBody>
                                        </Card>
                                    )}

                                    {/* Staff List */}
                                    <Card>
                                        <CardHeader>
                                            <Heading size="md">Staff Members</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <Box overflowX="auto">
                                                <Table variant="simple">
                                                    <Thead>
                                                        <Tr>
                                                            <Th>ID</Th>
                                                            <Th>Name</Th>
                                                            <Th>Email</Th>
                                                            <Th>Designation</Th>
                                                            <Th>Department</Th>
                                                            <Th>Status</Th>
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {companyData?.data?.staffList?.map((staff) => (
                                                            <Tr key={staff.id}>
                                                                <Td>{staff.id}</Td>
                                                                <Td fontWeight="medium">{staff.name}</Td>
                                                                <Td>{staff.email}</Td>
                                                                <Td>{staff.designation}</Td>
                                                                <Td>{staff.department || 'N/A'}</Td>
                                                                    <Td>
                                                                        <Badge
                                                                            colorScheme={staff.status === 'active' ? 'green' : 'gray'}
                                                                        >
                                                                        {staff.status}
                                                                        </Badge>
                                                                    </Td>
                                                                </Tr>
                                                        ))}
                                                    </Tbody>
                                                </Table>
                                            </Box>
                                        </CardBody>
                                    </Card>
                                </VStack>
                            )}
                        </>
                    )}

                    {/* Default View */}
                    {!selectedCompany && (
                        <Card>
                            <CardBody>
                                <Box textAlign="center" py={12}>
                                    <Icon as={FiBriefcase} boxSize={16} color="gray.300" mb={4} />
                                    <Heading size="md" color="gray.500" mb={2}>
                                        No Company Selected
                                    </Heading>
                                    <Text color="gray.400">
                                        Select a company from the dropdown above to view detailed statistics
                                    </Text>
                                </Box>
                            </CardBody>
                        </Card>
                    )}
                </VStack>
            </Container>
        </DashboardLayout>
    );
};

export default SuperAdminDashboard;
