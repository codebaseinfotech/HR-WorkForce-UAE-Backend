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
} from '@chakra-ui/react';
import { FiCheck, FiX, FiInbox, FiCheckCircle, FiXCircle, FiBriefcase } from 'react-icons/fi';
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
    console.log({ user, requests })

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
                <Card>
                    <EmptyState
                        title="No requests found"
                        description="There are no company registration requests"
                        icon={FiInbox}
                    />
                </Card>
            );
        }

        return (
            <Card p={0} overflow="hidden">
                <Box overflow="auto">
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th>Applicant</Th>
                                <Th>Company</Th>
                                <Th>Email</Th>
                                <Th>Contact</Th>
                                <Th>Submitted</Th>
                                <Th>Status</Th>
                                <Th>Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredRequests.map((request) => (
                                <Tr key={request.id}>
                                    <Td>
                                        <HStack spacing={3}>
                                            <Avatar
                                                size="sm"
                                                name={`${request.firstName} ${request.lastName}`}
                                                bg="primary.100"
                                                color="primary.600"
                                            />
                                            <VStack align="start" spacing={0}>
                                                <Text fontWeight="semibold" fontSize="sm" color="gray.800">
                                                    {request.firstName} {request.lastName}
                                                </Text>
                                                <Text fontSize="xs" color="gray.500">
                                                    {request.gender}, {request.nationality}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                    </Td>
                                    <Td>
                                        <VStack align="start" spacing={0}>
                                            <HStack spacing={1}>
                                                <Icon as={FiBriefcase} boxSize={3} color="gray.400" />
                                                <Text fontWeight="medium" fontSize="sm">{request.companyName}</Text>
                                            </HStack>
                                            <Text fontSize="xs" color="gray.500">{request.companyAddress}</Text>
                                        </VStack>
                                    </Td>
                                    <Td>
                                        <Text fontSize="sm">{request.email}</Text>
                                    </Td>
                                    <Td>
                                        <Text fontSize="sm">{request.mobile}</Text>
                                    </Td>
                                    <Td>
                                        <Text fontSize="sm" color="gray.600">{formatDate(request.submittedAt)}</Text>
                                    </Td>
                                    <Td>
                                        <Badge
                                            colorScheme={
                                                request.status === 'approved' ? 'success' :
                                                    request.status === 'rejected' ? 'error' :
                                                        'warning'
                                            }
                                            fontSize="xs"
                                        >
                                            {request.status.toUpperCase()}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        {request.status === 'pending' && (
                                            <HStack spacing={2}>
                                                <Button
                                                    size="sm"
                                                    colorScheme="success"
                                                    leftIcon={<FiCheck />}
                                                    onClick={() => handleApprove(request)}
                                                    isLoading={actionLoading}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    colorScheme="error"
                                                    leftIcon={<FiX />}
                                                    onClick={() => handleRejectClick(request)}
                                                    isLoading={actionLoading}
                                                    variant="outline"
                                                >
                                                    Reject
                                                </Button>
                                            </HStack>
                                        )}
                                        {request.status === 'approved' && (
                                            <Badge colorScheme="success" fontSize="xs">
                                                Company ID: {request.companyId}
                                            </Badge>
                                        )}
                                        {request.status === 'rejected' && request.rejectionReason && (
                                            <Text fontSize="xs" color="error.600">
                                                {request.rejectionReason}
                                            </Text>
                                        )}
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            </Card>
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
                {/* Header */}
                <Box>
                    <Heading
                        size="xl"
                        mb={2}
                        bgGradient="linear(to-r, primary.600, purple.600)"
                        bgClip="text"
                    >
                        Company Requests
                    </Heading>
                    <Text color="gray.600" fontSize="lg">
                        Review and manage company registration requests
                    </Text>
                </Box>

                {/* Alert for pending requests */}
                {counts.pending > 0 && (
                    <Alert status="warning" variant="left-accent" borderRadius="lg">
                        <AlertIcon />
                        You have {counts.pending} pending request{counts.pending !== 1 && 's'} waiting for review
                    </Alert>
                )}

                {/* Tabs */}
                <Card p={0}>
                    <Tabs colorScheme="primary" index={tabIndex} onChange={handleTabChange}>
                        <TabList px={6} pt={4}>
                            <Tab>
                                <HStack spacing={2}>
                                    <Icon as={FiInbox} />
                                    <Text>All Requests</Text>
                                    <Badge colorScheme="gray">{requests.length}</Badge>
                                </HStack>
                            </Tab>
                            <Tab>
                                <HStack spacing={2}>
                                    <Icon as={FiInbox} />
                                    <Text>Pending</Text>
                                    <Badge colorScheme="warning">{counts.pending}</Badge>
                                </HStack>
                            </Tab>
                            <Tab>
                                <HStack spacing={2}>
                                    <Icon as={FiCheckCircle} />
                                    <Text>Approved</Text>
                                    <Badge colorScheme="success">{counts.approved}</Badge>
                                </HStack>
                            </Tab>
                            <Tab>
                                <HStack spacing={2}>
                                    <Icon as={FiXCircle} />
                                    <Text>Rejected</Text>
                                    <Badge colorScheme="error">{counts.rejected}</Badge>
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
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Reject Request</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <Alert status="warning">
                                <AlertIcon />
                                Are you sure you want to reject this request?
                            </Alert>
                            {selectedRequest && (
                                <Text fontSize="sm">
                                    Request from <strong>{selectedRequest.firstName} {selectedRequest.lastName}</strong>
                                </Text>
                            )}
                            <FormControl>
                                <FormLabel>Rejection Reason</FormLabel>
                                <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Provide a reason for rejection..."
                                    rows={4}
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={onClose} mr={3}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="error"
                            onClick={handleRejectConfirm}
                            isLoading={actionLoading}
                        >
                            Reject Request
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </DashboardLayout>
    );
};

export default CompanyRequests;
