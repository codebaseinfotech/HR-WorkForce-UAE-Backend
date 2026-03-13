import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    VStack,
    Heading,
    Text,
    Badge,
    HStack,
    IconButton,
    useToast,
    Button,
    Avatar,
    Icon,
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiMail, FiPhone, FiMapPin, FiEye, FiPlus, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useGetCompaniesQuery, useDeleteCompanyMutation } from '../../store/apiSlice';

const UsersList = () => {
    const toast = useToast();
    const navigate = useNavigate();

    const [deleteCompany] = useDeleteCompanyMutation();

    // RTK Query — fetches from /api/v1/company/list
    const { data: response, isLoading, refetch } = useGetCompaniesQuery();

    // API returns { status: true, data: [...] }
    const companies = response?.data || [];

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this company?')) {
            return;
        }
        try {
            await deleteCompany(id).unwrap();
            toast({
                title: 'Company deleted',
                description: 'Company has been removed successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Delete failed',
                description: error.data?.message || 'Failed to delete company',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleViewCompany = (companyId) => {
        navigate(`/superadmin/company/${companyId}`);
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <LoadingSpinner message="Loading companies..." />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>
                {/* Header */}
                <HStack justify="space-between" flexWrap="wrap" gap={4}>
                    <Box>
                        <Heading
                            size="xl"
                            mb={2}
                            bgGradient="linear(to-r, primary.600, purple.600)"
                            bgClip="text"
                        >
                            Companies Management
                        </Heading>
                        <Text color="gray.600" fontSize="lg">
                            {companies.length} {companies.length === 1 ? 'company' : 'companies'} registered
                        </Text>
                    </Box>
                    <HStack spacing={3}>
                        <Button
                            variant="outline"
                            onClick={refetch}
                            leftIcon={<Icon as={FiUsers} />}
                        >
                            Refresh
                        </Button>
                        <Button
                            leftIcon={<FiPlus />}
                            size="lg"
                            onClick={() => navigate('/superadmin/create-user')}
                        >
                            Create Company
                        </Button>
                    </HStack>
                </HStack>

                {companies.length === 0 ? (
                    <Card>
                        <EmptyState
                            title="No companies found"
                            description="Create your first company to get started"
                            icon={FiUsers}
                            action={
                                <Button
                                    leftIcon={<FiPlus />}
                                    onClick={() => navigate('/superadmin/create-user')}
                                    mt={4}
                                >
                                    Create First Company
                                </Button>
                            }
                        />
                    </Card>
                ) : (
                    <Card p={0} overflow="hidden">
                        <Box overflow="auto">
                            <Table variant="simple">
                                <Thead>
                                    <Tr>
                                        <Th>Company</Th>
                                        <Th>Owner</Th>
                                        <Th>Contact</Th>
                                        <Th>Location</Th>
                                        <Th>Status</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {companies.map((company) => {
                                        const hasLogo = company.logo && company.logo !== '-';
                                        const hasOwner = company.name_first && company.name_first !== '-';
                                        const hasEmail = company.email && company.email !== '-';
                                        const hasPhone = company.phone && company.phone !== '-';
                                        const hasCity = company.city && company.city !== '-';
                                        const hasAddress = company.address && company.address !== '-';

                                        return (
                                            <Tr key={company.id}>
                                                {/* Company Name + Logo */}
                                                <Td>
                                                    <HStack spacing={3}>
                                                        <Avatar
                                                            size="md"
                                                            name={company.name}
                                                            src={hasLogo ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${company.logo}` : undefined}
                                                            bg="primary.100"
                                                            color="primary.600"
                                                        />
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontWeight="semibold" color="gray.800">
                                                                {company.name}
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.500">
                                                                ID: {company.id}
                                                            </Text>
                                                        </VStack>
                                                    </HStack>
                                                </Td>

                                                {/* Owner */}
                                                <Td>
                                                    {hasOwner ? (
                                                        <Text fontSize="sm" fontWeight="medium">
                                                            {company.name_first} {company.name_last !== '-' ? company.name_last : ''}
                                                        </Text>
                                                    ) : (
                                                        <Text fontSize="sm" color="gray.400">—</Text>
                                                    )}
                                                </Td>

                                                {/* Contact */}
                                                <Td>
                                                    <VStack align="start" spacing={1}>
                                                        {hasEmail && (
                                                            <HStack spacing={2}>
                                                                <Icon as={FiMail} boxSize={3.5} color="gray.400" />
                                                                <Text fontSize="sm">{company.email}</Text>
                                                            </HStack>
                                                        )}
                                                        {hasPhone && (
                                                            <HStack spacing={2}>
                                                                <Icon as={FiPhone} boxSize={3.5} color="gray.400" />
                                                                <Text fontSize="sm">{company.phone}</Text>
                                                            </HStack>
                                                        )}
                                                        {!hasEmail && !hasPhone && (
                                                            <Text fontSize="sm" color="gray.400">—</Text>
                                                        )}
                                                    </VStack>
                                                </Td>

                                                {/* Location */}
                                                <Td>
                                                    {hasCity || hasAddress ? (
                                                        <HStack spacing={2}>
                                                            <Icon as={FiMapPin} boxSize={3.5} color="gray.400" />
                                                            <Text fontSize="sm">
                                                                {hasAddress ? company.address : ''}{hasAddress && hasCity ? ', ' : ''}{hasCity ? company.city : ''}
                                                            </Text>
                                                        </HStack>
                                                    ) : (
                                                        <Text fontSize="sm" color="gray.400">—</Text>
                                                    )}
                                                </Td>

                                                {/* Status */}
                                                <Td>
                                                    <Badge
                                                        colorScheme={company.status === 1 ? 'green' : 'red'}
                                                        fontSize="xs"
                                                        px={2}
                                                        py={0.5}
                                                        borderRadius="full"
                                                    >
                                                        {company.status === 1 ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </Td>

                                                {/* Actions */}
                                                <Td>
                                                    <HStack spacing={2}>
                                                        <IconButton
                                                            icon={<FiEye />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="green"
                                                            aria-label="View company"
                                                            onClick={() => handleViewCompany(company.id)}
                                                        />
                                                        <IconButton
                                                            icon={<FiEdit />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="blue"
                                                            aria-label="Edit company"
                                                        />
                                                        <IconButton
                                                            icon={<FiTrash2 />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="red"
                                                            aria-label="Delete company"
                                                            onClick={() => handleDelete(company.id)}
                                                        />
                                                    </HStack>
                                                </Td>
                                            </Tr>
                                        );
                                    })}
                                </Tbody>
                            </Table>
                        </Box>
                    </Card>
                )}

                {/* Footer with Count */}
                {companies.length > 0 && (
                    <Card bg="primary.50" borderColor="primary.200">
                        <HStack spacing={3}>
                            <Icon as={FiUsers} boxSize={5} color="primary.600" />
                            <Text fontSize="sm" color="primary.900">
                                <strong>Total Companies:</strong> {companies.length}
                            </Text>
                        </HStack>
                    </Card>
                )}
            </VStack>
        </DashboardLayout>
    );
};

export default UsersList;
