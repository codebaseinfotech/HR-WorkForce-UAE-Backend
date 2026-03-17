import { useState } from 'react';
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
    Flex,
    Tooltip,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Spinner,
    Divider,
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiMail, FiPhone, FiMapPin, FiEye, FiPlus, FiBriefcase, FiRefreshCw, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useGetCompaniesQuery, useDeleteCompanyMutation, useGetCompanyDashboardQuery } from '../../store/apiSlice';

const UsersList = () => {
    const toast = useToast();
    const navigate = useNavigate();

    const [deleteCompany, { isLoading: isDeleting }] = useDeleteCompanyMutation();

    // RTK Query — fetches from /api/v1/company/list
    const { data: response, isLoading, refetch, isFetching } = useGetCompaniesQuery();

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

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedCompany, setSelectedCompany] = useState(null);

    const { data: companyDetails, isFetching: fetchingDetails } = useGetCompanyDashboardQuery(
        selectedCompany?.id,
        { skip: !selectedCompany?.id }
    );

    const handleViewCompany = (company) => {
        setSelectedCompany(company);
        onOpen();
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
                                Companies Management
                            </Heading>
                            <Text color="whiteAlpha.700" fontSize="sm">
                                Manage all registered client companies in the system
                            </Text>
                        </Box>
                        
                        <HStack spacing={3}>
                            <Tooltip label="Refresh data">
                                <IconButton
                                    icon={<FiRefreshCw />}
                                    variant="outline"
                                    color="white"
                                    borderColor="whiteAlpha.400"
                                    _hover={{ bg: 'whiteAlpha.200' }}
                                    onClick={refetch}
                                    isLoading={isFetching}
                                    aria-label="Refresh"
                                />
                            </Tooltip>
                            <Button
                                leftIcon={<FiPlus />}
                                bgGradient="linear(to-r, purple.400, blue.400)"
                                color="white"
                                _hover={{ bgGradient: 'linear(to-r, purple.500, blue.500)', shadow: 'md' }}
                                onClick={() => navigate('/superadmin/create-user')}
                            >
                                Create Company
                            </Button>
                        </HStack>
                    </Flex>
                </Box>

                {/* ── Table Container ── */}
                {companies.length === 0 ? (
                    <Card>
                        <EmptyState
                            title="No companies found"
                            description="Create your first company to get started"
                            icon={FiBriefcase}
                            action={
                                <Button
                                    leftIcon={<FiPlus />}
                                    bgGradient="linear(to-r, purple.400, blue.400)"
                                    color="white"
                                    _hover={{ bgGradient: 'linear(to-r, purple.500, blue.500)' }}
                                    onClick={() => navigate('/superadmin/create-user')}
                                    mt={4}
                                >
                                    Create First Company
                                </Button>
                            }
                        />
                    </Card>
                ) : (
                    <Card p={0} overflow="hidden" boxShadow="md" border="1px solid" borderColor="gray.100">
                        <Box p={5} borderBottom="1px solid" borderColor="gray.100" bgGradient="linear(to-r, gray.50, white)">
                            <HStack justify="space-between">
                                <HStack spacing={3}>
                                    <Box p={2.5} bg="purple.50" borderRadius="xl">
                                        <Icon as={FiBriefcase} boxSize={5} color="purple.500" />
                                    </Box>
                                    <Heading size="sm" color="gray.800">All Registered Companies</Heading>
                                </HStack>
                                <Badge colorScheme="purple" borderRadius="full" px={3} py={0.5}>
                                    {companies.length} Total
                                </Badge>
                            </HStack>
                        </Box>
                        <Box overflowX="auto">
                            <Table variant="simple" size="sm" w="100%" style={{ minWidth: '1000px' }}>
                                <Thead>
                                    <Tr>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Company</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Owner</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Contact</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Location</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Status</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" textAlign="right" whiteSpace="nowrap">Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {companies.map((company, i) => {
                                        const hasLogo = company.logo && company.logo !== '-';
                                        const hasOwner = company.name_first && company.name_first !== '-';
                                        const hasEmail = company.email && company.email !== '-';
                                        const hasPhone = company.phone && company.phone !== '-';
                                        const hasCity = company.city && company.city !== '-';
                                        const hasAddress = company.address && company.address !== '-';

                                        return (
                                            <Tr key={company.id} bg={i % 2 === 0 ? 'white' : 'gray.50'} _hover={{ bg: 'purple.50' }} transition="all 0.15s">
                                                {/* Company Name + Logo */}
                                                <Td py={3}>
                                                    <HStack spacing={3}>
                                                        <Avatar
                                                            size="md"
                                                            name={company.name}
                                                            src={hasLogo ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${company.logo}` : undefined}
                                                            bg="purple.100"
                                                            color="purple.600"
                                                        />
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontWeight="700" fontSize="sm" color="gray.800">
                                                                {company.name}
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.500" fontWeight="600">
                                                                ID: {company.id}
                                                            </Text>
                                                        </VStack>
                                                    </HStack>
                                                </Td>

                                                {/* Owner */}
                                                <Td>
                                                    {hasOwner ? (
                                                        <Text fontSize="sm" fontWeight="600" color="gray.700">
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
                                                                <Text fontSize="sm" color="gray.600">{company.email}</Text>
                                                            </HStack>
                                                        )}
                                                        {hasPhone && (
                                                            <HStack spacing={2}>
                                                                <Icon as={FiPhone} boxSize={3.5} color="gray.400" />
                                                                <Text fontSize="sm" color="gray.600">{company.phone}</Text>
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
                                                        <HStack spacing={2} maxW="200px">
                                                            <Icon as={FiMapPin} boxSize={3.5} color="gray.400" flexShrink={0}/>
                                                            <Text fontSize="sm" color="gray.600" isTruncated>
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
                                                        colorScheme={company.status === 1 ? 'green' : 'gray'}
                                                        fontSize="2xs"
                                                        px={2.5}
                                                        py={0.5}
                                                        borderRadius="full"
                                                    >
                                                        {company.status === 1 ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </Td>

                                                {/* Actions */}
                                                <Td textAlign="right">
                                                    <HStack spacing={1} justify="flex-end">
                                                        <Tooltip label="View Details">
                                                            <IconButton
                                                                icon={<FiEye />}
                                                                size="sm"
                                                                variant="ghost"
                                                                colorScheme="blue"
                                                                aria-label="View company"
                                                                onClick={() => handleViewCompany(company)}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip label="Edit Company">
                                                            <IconButton
                                                                icon={<FiEdit />}
                                                                size="sm"
                                                                variant="ghost"
                                                                colorScheme="purple"
                                                                aria-label="Edit company"
                                                            />
                                                        </Tooltip>
                                                        <Tooltip label="Delete Company">
                                                            <IconButton
                                                                icon={<FiTrash2 />}
                                                                size="sm"
                                                                variant="ghost"
                                                                colorScheme="red"
                                                                aria-label="Delete company"
                                                                isLoading={isDeleting}
                                                                onClick={() => handleDelete(company.id)}
                                                            />
                                                        </Tooltip>
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

                {/* ── Footer Info ── */}
                {companies.length > 0 && (
                    <Card bg="gray.50" border="1px solid" borderColor="gray.100" py={3}>
                        <HStack justify="center" spacing={3}>
                            <Icon as={FiBriefcase} boxSize={4} color="purple.500" />
                            <Text fontSize="sm" color="gray.600" fontWeight="500">
                                <strong>{companies.length}</strong> active companies managed by Super Admin
                            </Text>
                        </HStack>
                    </Card>
                )}
            </VStack>

            {/* View Company Modal */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
                <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
                <ModalContent borderRadius="xl" overflow="hidden">
                    <ModalHeader bgGradient="linear(to-r, #1a1a2e, #16213e)" color="white" py={5}>
                        <HStack spacing={3}>
                            <Icon as={FiBriefcase} boxSize={5} color="purple.300" />
                            <Text fontSize="lg">Company Details</Text>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton color="white" top={4} />
                    
                    <ModalBody py={6} px={8}>
                        {selectedCompany && (
                            <VStack spacing={5} align="stretch">
                                <Flex align="center" gap={4}>
                                    <Avatar
                                        size="lg"
                                        name={selectedCompany.name}
                                        src={selectedCompany.logo !== '-' ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${selectedCompany.logo}` : undefined}
                                        bg="purple.100"
                                        color="purple.600"
                                    />
                                    <Box>
                                        <Heading size="md" color="gray.800">{selectedCompany.name}</Heading>
                                        <Text fontSize="sm" color="gray.500" mt={1}>ID: {selectedCompany.id}</Text>
                                        <Badge
                                            mt={2}
                                            colorScheme={selectedCompany.status === 1 ? 'green' : 'gray'}
                                            borderRadius="full"
                                            px={3}
                                            py={0.5}
                                        >
                                            {selectedCompany.status === 1 ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </Box>
                                </Flex>

                                <Divider my={2} />

                                <VStack align="start" spacing={3}>
                                    <HStack>
                                        <Icon as={FiUsers} color="gray.400" />
                                        <Text fontSize="sm" fontWeight="600" w="80px">Owner:</Text>
                                        <Text fontSize="sm" color="gray.700">
                                            {selectedCompany.name_first !== '-' ? `${selectedCompany.name_first} ${selectedCompany.name_last !== '-' ? selectedCompany.name_last : ''}` : '—'}
                                        </Text>
                                    </HStack>
                                    <HStack>
                                        <Icon as={FiMail} color="gray.400" />
                                        <Text fontSize="sm" fontWeight="600" w="80px">Email:</Text>
                                        <Text fontSize="sm" color="gray.700">{selectedCompany.email !== '-' ? selectedCompany.email : '—'}</Text>
                                    </HStack>
                                    <HStack>
                                        <Icon as={FiPhone} color="gray.400" />
                                        <Text fontSize="sm" fontWeight="600" w="80px">Phone:</Text>
                                        <Text fontSize="sm" color="gray.700">{selectedCompany.phone !== '-' ? selectedCompany.phone : '—'}</Text>
                                    </HStack>
                                    <HStack>
                                        <Icon as={FiMapPin} color="gray.400" />
                                        <Text fontSize="sm" fontWeight="600" w="80px">Location:</Text>
                                        <Text fontSize="sm" color="gray.700">
                                            {selectedCompany.city !== '-' || selectedCompany.address !== '-' 
                                                ? `${selectedCompany.address !== '-' ? selectedCompany.address : ''}${selectedCompany.address !== '-' && selectedCompany.city !== '-' ? ', ' : ''}${selectedCompany.city !== '-' ? selectedCompany.city : ''}` 
                                                : '—'}
                                        </Text>
                                    </HStack>
                                </VStack>

                                <Box bg="purple.50" p={4} borderRadius="lg" mt={2}>
                                    {fetchingDetails ? (
                                        <Flex justify="center" align="center" gap={3}>
                                            <Spinner size="sm" color="purple.500" />
                                            <Text fontSize="sm" color="purple.700">Loading manager count...</Text>
                                        </Flex>
                                    ) : (
                                        <HStack justify="space-between">
                                            <HStack>
                                                <Icon as={FiUsers} color="purple.600" />
                                                <Text fontSize="sm" fontWeight="600" color="purple.800">Total Managers:</Text>
                                            </HStack>
                                            <Text fontSize="lg" fontWeight="bold" color="purple.700">
                                                {companyDetails?.data?.managersCount || 0}
                                            </Text>
                                        </HStack>
                                    )}
                                </Box>
                            </VStack>
                        )}
                    </ModalBody>
                    
                    <ModalFooter bg="gray.50" borderTop="1px solid" borderColor="gray.100">
                        <Button onClick={onClose} w="full" variant="outline" borderColor="gray.300">
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </DashboardLayout>
    );
};

export default UsersList;

