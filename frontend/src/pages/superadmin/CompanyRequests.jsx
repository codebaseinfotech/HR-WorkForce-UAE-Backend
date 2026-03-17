import { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    Heading,
    Text,
    HStack,
    Badge,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    useToast,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    useDisclosure,
    FormControl,
    FormLabel,
    Textarea,
    Alert,
    AlertIcon,
    Icon,
    Avatar,
    Flex,
    Tooltip,
} from '@chakra-ui/react';
import { FiCheck, FiX, FiInbox, FiCheckCircle, FiXCircle, FiBriefcase, FiClock } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CompanyRequests = () => {
    const [requests, setRequests] = useState([]);
    const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [tabIndex, setTabIndex] = useState(0);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();
    const { user } = useAuth();

    const fetchRequests = async (status = null) => {
        try {
            setLoading(true);
            const url = status ? `/company-requests/list?status=${status}` : '/company-requests/list';
            const response = await api.get(url);
            setRequests(response.data.requests || []);
            setCounts(response.data.counts || { pending: 0, approved: 0, rejected: 0 });
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast({
                title: 'Error fetching requests',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleTabChange = (index) => {
        setTabIndex(index);
        // Fetch data based on tab
        switch (index) {
            case 0:
                fetchRequests(); // All requests
                break;
            case 1:
                fetchRequests('pending');
                break;
            case 2:
                fetchRequests('approved');
                break;
            case 3:
                fetchRequests('rejected');
                break;
            default:
                fetchRequests();
        }
    };

    const handleApprove = async (request) => {
        try {
            setActionLoading(true);
            const response = await api.post(`/company-requests/${request.id}/approve`, {
                adminId: user?.id
            });

            toast({
                title: 'Request Approved!',
                description: `Credentials sent to ${request.email}`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            // Show credentials in console (for demo)
            if (response.data.company) {
                console.log('✅ Company Approved:', response.data.company);
            }

            fetchRequests();
        } catch (error) {
            toast({
                title: 'Approval Failed',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectClick = (request) => {
        setSelectedRequest(request);
        setRejectionReason('');
        onOpen();
    };

    const handleRejectConfirm = async () => {
        try {
            setActionLoading(true);
            await api.post(`/company-requests/${selectedRequest.id}/reject`, {
                adminId: user?.id,
                reason: rejectionReason
            });

            toast({
                title: 'Request Rejected',
                description: `Request from ${selectedRequest.email} has been rejected`,
                status: 'info',
                duration: 3000,
                isClosable: true,
            });

            onClose();
            fetchRequests();
        } catch (error) {
            toast({
                title: 'Rejection Failed',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderRequestsTable = (filteredRequests) => {
        if (filteredRequests.length === 0) {
            return (
                <EmptyState
                    title="No requests found"
                    description="There are no company registration requests in this category"
                    icon={FiInbox}
                />
            );
        }

        return (
            <Box overflowX="auto">
                <Table variant="simple" size="sm" w="100%" style={{ minWidth: '800px' }}>
                    <Thead>
                        <Tr>
                            <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Applicant</Th>
                            <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Company</Th>
                            <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Email</Th>
                            <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Contact</Th>
                            <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Submitted</Th>
                            <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Status</Th>
                            <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" textAlign="right" whiteSpace="nowrap">Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredRequests.map((request, i) => (
                            <Tr key={request.id} bg={i % 2 === 0 ? 'white' : 'gray.50'} _hover={{ bg: 'blue.50' }} transition="all 0.15s">
                                <Td py={3}>
                                    <HStack spacing={3}>
                                        <Avatar
                                            size="sm"
                                            name={`${request.firstName} ${request.lastName}`}
                                            bg="blue.100"
                                            color="blue.600"
                                        />
                                        <VStack align="start" spacing={0}>
                                            <Text fontWeight="700" fontSize="sm" color="gray.800">
                                                {request.firstName} {request.lastName}
                                            </Text>
                                            <Text fontSize="xs" color="gray.500" fontWeight="600">
                                                {request.gender}, {request.nationality}
                                            </Text>
                                        </VStack>
                                    </HStack>
                                </Td>
                                <Td>
                                    <HStack spacing={2} align="start">
                                        <Icon as={FiBriefcase} boxSize={3.5} color="gray.400" mt={1} />
                                        <VStack align="start" spacing={0}>
                                            <Text fontWeight="600" fontSize="sm" color="gray.700">{request.companyName}</Text>
                                            <Text fontSize="xs" color="gray.500" maxW="200px" isTruncated>{request.companyAddress}</Text>
                                        </VStack>
                                    </HStack>
                                </Td>
                                <Td>
                                    <Text fontSize="sm" color="gray.600">{request.email}</Text>
                                </Td>
                                <Td>
                                    <Text fontSize="sm" color="gray.600">{request.mobile}</Text>
                                </Td>
                                <Td>
                                    <HStack spacing={1.5}>
                                        <Icon as={FiClock} boxSize={3.5} color="gray.400" />
                                        <Text fontSize="sm" color="gray.600">{formatDate(request.submittedAt)}</Text>
                                    </HStack>
                                </Td>
                                <Td>
                                    <Badge
                                        colorScheme={
                                            request.status === 'approved' ? 'green' :
                                                request.status === 'rejected' ? 'red' :
                                                    'orange'
                                        }
                                        fontSize="2xs"
                                        px={2.5}
                                        py={0.5}
                                        borderRadius="full"
                                    >
                                        {request.status.toUpperCase()}
                                    </Badge>
                                </Td>
                                <Td textAlign="right">
                                    {request.status === 'pending' && (
                                        <HStack spacing={2} justify="flex-end">
                                            <Tooltip label="Approve Request">
                                                <Button
                                                    size="sm"
                                                    colorScheme="green"
                                                    leftIcon={<FiCheck />}
                                                    onClick={() => handleApprove(request)}
                                                    isLoading={actionLoading}
                                                    borderRadius="full"
                                                    px={4}
                                                >
                                                    Approve
                                                </Button>
                                            </Tooltip>
                                            <Tooltip label="Reject Request">
                                                <Button
                                                    size="sm"
                                                    colorScheme="red"
                                                    leftIcon={<FiX />}
                                                    onClick={() => handleRejectClick(request)}
                                                    isLoading={actionLoading}
                                                    variant="outline"
                                                    borderRadius="full"
                                                    px={4}
                                                >
                                                    Reject
                                                </Button>
                                            </Tooltip>
                                        </HStack>
                                    )}
                                    {request.status === 'approved' && (
                                        <Badge colorScheme="green" fontSize="2xs" borderRadius="md" px={2} py={1}>
                                            Company ID: {request.companyId}
                                        </Badge>
                                    )}
                                    {request.status === 'rejected' && request.rejectionReason && (
                                        <Tooltip label={request.rejectionReason}>
                                            <Text fontSize="xs" color="red.500" fontWeight="600" isTruncated maxW="150px">
                                                {request.rejectionReason}
                                            </Text>
                                        </Tooltip>
                                    )}
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
        );
    };

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingSpinner message="Loading company requests..." />
            </DashboardLayout>
        );
    }

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
                                Company Requests
                            </Heading>
                            <Text color="whiteAlpha.700" fontSize="sm">
                                Review and manage company registration requests
                            </Text>
                        </Box>

                        <HStack spacing={4}>
                            <Box bg="whiteAlpha.200" backdropFilter="blur(10px)" px={4} py={2} borderRadius="xl" textAlign="center">
                                <Text fontSize="2xl" fontWeight="bold" color="white" lineHeight="1">{counts.pending}</Text>
                                <Text fontSize="xs" color="whiteAlpha.700">Pending</Text>
                            </Box>
                            <Box bg="whiteAlpha.200" backdropFilter="blur(10px)" px={4} py={2} borderRadius="xl" textAlign="center">
                                <Text fontSize="2xl" fontWeight="bold" color="white" lineHeight="1">{counts.approved}</Text>
                                <Text fontSize="xs" color="whiteAlpha.700">Approved</Text>
                            </Box>
                        </HStack>
                    </Flex>
                </Box>

                {/* Alert for pending requests */}
                {counts.pending > 0 && (
                    <Alert status="warning" variant="left-accent" borderRadius="xl" boxShadow="sm">
                        <AlertIcon />
                        <Text fontWeight="500">You have <strong>{counts.pending}</strong> pending request{counts.pending !== 1 && 's'} waiting for review</Text>
                    </Alert>
                )}

                {/* Tabs */}
                <Card p={0} overflow="hidden" boxShadow="md" border="1px solid" borderColor="gray.100">
                    <Tabs colorScheme="blue" index={tabIndex} onChange={handleTabChange}>
                        <TabList px={6} pt={5} pb={4} borderBottom="1px solid" borderColor="gray.100" bgGradient="linear(to-r, gray.50, white)">
                            <Tab _selected={{ color: 'blue.600', bg: 'blue.50', borderColor: 'blue.200' }} borderRadius="lg" px={4} py={2} fontWeight="600" transition="all 0.2s" border="1px solid transparent">
                                <HStack spacing={2}>
                                    <Icon as={FiInbox} />
                                    <Text>All Requests</Text>
                                    <Badge colorScheme={tabIndex === 0 ? 'blue' : 'gray'} borderRadius="full">{requests.length}</Badge>
                                </HStack>
                            </Tab>
                            <Tab _selected={{ color: 'orange.600', bg: 'orange.50', borderColor: 'orange.200' }} borderRadius="lg" px={4} py={2} fontWeight="600" transition="all 0.2s" border="1px solid transparent">
                                <HStack spacing={2}>
                                    <Icon as={FiClock} />
                                    <Text>Pending</Text>
                                    <Badge colorScheme={tabIndex === 1 ? 'orange' : 'gray'} borderRadius="full">{counts.pending}</Badge>
                                </HStack>
                            </Tab>
                            <Tab _selected={{ color: 'green.600', bg: 'green.50', borderColor: 'green.200' }} borderRadius="lg" px={4} py={2} fontWeight="600" transition="all 0.2s" border="1px solid transparent">
                                <HStack spacing={2}>
                                    <Icon as={FiCheckCircle} />
                                    <Text>Approved</Text>
                                    <Badge colorScheme={tabIndex === 2 ? 'green' : 'gray'} borderRadius="full">{counts.approved}</Badge>
                                </HStack>
                            </Tab>
                            <Tab _selected={{ color: 'red.600', bg: 'red.50', borderColor: 'red.200' }} borderRadius="lg" px={4} py={2} fontWeight="600" transition="all 0.2s" border="1px solid transparent">
                                <HStack spacing={2}>
                                    <Icon as={FiXCircle} />
                                    <Text>Rejected</Text>
                                    <Badge colorScheme={tabIndex === 3 ? 'red' : 'gray'} borderRadius="full">{counts.rejected}</Badge>
                                </HStack>
                            </Tab>
                        </TabList>

                        <TabPanels>
                            <TabPanel p={0}>
                                {renderRequestsTable(requests)}
                            </TabPanel>
                            <TabPanel p={0}>
                                {renderRequestsTable(requests.filter(r => r.status === 'pending'))}
                            </TabPanel>
                            <TabPanel p={0}>
                                {renderRequestsTable(requests.filter(r => r.status === 'approved'))}
                            </TabPanel>
                            <TabPanel p={0}>
                                {renderRequestsTable(requests.filter(r => r.status === 'rejected'))}
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </Card>
            </VStack>

            {/* Rejection Modal */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom">
                <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.300" />
                <ModalContent borderRadius="xl" overflow="hidden">
                    <Box h="4px" bgGradient="linear(to-r, red.400, orange.400)" />
                    <ModalHeader color="gray.800">Reject Company Request</ModalHeader>
                    <ModalCloseButton mt={1} />
                    <ModalBody pb={6}>
                        <VStack spacing={5} align="stretch">
                            <Alert status="warning" borderRadius="lg" variant="left-accent">
                                <AlertIcon />
                                <Box>
                                    <Text fontWeight="600" fontSize="sm">Please provide a reason</Text>
                                    <Text fontSize="xs">This reason will be recorded and may be visible in logs.</Text>
                                </Box>
                            </Alert>
                            {selectedRequest && (
                                <Box p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.100">
                                    <Text fontSize="xs" color="gray.500" mb={1}>Request from</Text>
                                    <Text fontWeight="700" color="gray.800">
                                        {selectedRequest.firstName} {selectedRequest.lastName} ({selectedRequest.companyName})
                                    </Text>
                                </Box>
                            )}
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Rejection Reason</FormLabel>
                                <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Briefly explain why this request is rejected..."
                                    rows={4}
                                    borderRadius="lg"
                                    focusBorderColor="red.400"
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter bg="gray.50" borderTop="1px solid" borderColor="gray.100">
                        <Button variant="ghost" onClick={onClose} mr={3} borderRadius="lg">
                            Cancel
                        </Button>
                        <Button
                            colorScheme="red"
                            onClick={handleRejectConfirm}
                            isLoading={actionLoading}
                            borderRadius="lg"
                            leftIcon={<FiXCircle />}
                            isDisabled={!rejectionReason.trim()}
                        >
                            Confirm Rejection
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </DashboardLayout>
    );
};

export default CompanyRequests;
