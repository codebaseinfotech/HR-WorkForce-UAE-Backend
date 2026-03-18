import { useState, useRef } from 'react';
import {
    Box,
    VStack,
    HStack,
    Heading,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    IconButton,
    useToast,
    Text,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    useDisclosure,
    Avatar,
    Icon,
    InputGroup,
    InputLeftElement,
    Input,
    Collapse,
    Flex,
    Spinner,
    Tooltip,
    Center,
} from '@chakra-ui/react';
import {
    FiPlus,
    FiTrash2,
    FiUsers,
    FiMail,
    FiSearch,
    FiChevronDown,
    FiChevronRight,
    FiUserCheck,
    FiPhone,
    FiRefreshCw,
    FiShield,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useGetUserFetchQuery, useGetRolesQuery } from '../../store/apiSlice';
import ViewTasksDrawer from '../../components/common/ViewTasksDrawer';


// ── Staff sub-row component ────────────────────────────────────────────────
const StaffSubTable = ({ companyId }) => {
    const navigate = useNavigate();
    const { data, isLoading } = useGetUserFetchQuery(
        { company_id: companyId, role: 'staff' },
        { skip: !companyId }
    );

    const staff = data?.data || data?.users || data || [];
    const staffList = Array.isArray(staff) ? staff : [];

    if (isLoading) {
        return (
            <Tr>
                <Td colSpan={6} py={3}>
                    <HStack spacing={2} pl={10}>
                        <Spinner size="xs" color="blue.400" />
                        <Text fontSize="xs" color="gray.500">Loading staff...</Text>
                    </HStack>
                </Td>
            </Tr>
        );
    }

    if (staffList.length === 0) {
        return (
            <Tr bg="gray.50">
                <Td colSpan={6} py={3} pl={14}>
                    <Text fontSize="xs" color="gray.400" fontStyle="italic">No staff members found.</Text>
                </Td>
            </Tr>
        );
    }

    return staffList.map((s) => (
        <Tr key={s.id} bg="gray.50" _hover={{ bg: 'purple.50' }} transition="all 0.15s">
            <Td pl={14} py={3}>
                <HStack spacing={3}>
                    <Box w="3px" h="24px" bg="purple.300" borderRadius="full" />
                    <Avatar
                        size="xs"
                        src={s.p_image_url || s.profileImage}
                        name={`${s.first_name || s.firstName} ${s.last_name || s.lastName}`}
                        bg="purple.200"
                        color="purple.700"
                    />
                    <Text fontSize="sm" fontWeight="600" color="gray.700">
                        {s.first_name || s.firstName} {s.last_name || s.lastName}
                    </Text>
                    <Badge colorScheme="purple" fontSize="2xs" variant="subtle" borderRadius="full">Staff</Badge>
                </HStack>
            </Td>
            <Td py={3}>
                <HStack spacing={1.5}>
                    <Icon as={FiMail} boxSize={3.5} color="gray.400" />
                    <Text fontSize="sm" color="gray.600">{s.email}</Text>
                </HStack>
            </Td>
            <Td py={3}>
                <HStack spacing={1.5}>
                    <Icon as={FiPhone} boxSize={3.5} color="gray.400" />
                    <Text fontSize="sm" color="gray.600">{s.phone || '-'}</Text>
                </HStack>
            </Td>
            <Td py={3}>
                <Text fontSize="sm" color="gray.500">{s.gender || '-'}</Text>
            </Td>
            <Td py={3}>
                <Badge
                    colorScheme={s.status === 'active' || s.status === 1 ? 'green' : 'gray'}
                    fontSize="2xs"
                    borderRadius="full"
                    px={2.5}
                    py={0.5}
                >
                    {s.status === 'active' || s.status === 1 ? 'Active' : 'Inactive'}
                </Badge>
            </Td>
            <Td py={3}>
                <HStack spacing={1} justify="center">
                    <Tooltip label="View details" placement="top" hasArrow>
                        <IconButton
                            icon={<FiChevronRight />}
                            size="sm"
                            variant="ghost"
                            colorScheme="purple"
                            aria-label="View staff"
                            onClick={() => navigate(`/company/staff/${s.id}`)}
                            _hover={{ bg: 'purple.100' }}
                        />
                    </Tooltip>
                    <Tooltip label="Delete" placement="top" hasArrow>
                        <IconButton
                            icon={<FiTrash2 />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            aria-label="Delete staff"
                            _hover={{ bg: 'red.100' }}
                        />
                    </Tooltip>
                </HStack>
            </Td>
        </Tr>
    ));
};

// ── Expandable manager row ────────────────────────────────────────────────
const ManagerRow = ({ manager, onDelete, isDeleting }) => {
    const navigate = useNavigate();
    const name = `${manager.first_name || manager.firstName || ''} ${manager.last_name || manager.lastName || ''}`.trim();
    const email = manager.email || '';
    const phone = manager.phone || '-';
    const gender = manager.gender || '-';
    const role = typeof manager.role === 'object' ? manager.role?.name : manager.role || 'Manager';
    const status = manager.status;

    return (
        <Tr
            _hover={{ bg: 'purple.50', cursor: 'pointer' }}
            transition="all 0.2s"
            borderLeft="3px solid"
            borderLeftColor="transparent"
            _hover_borderLeftColor="purple.500"
            onClick={() => navigate(`/company/manager/${manager.id}/staff`)}
            bg="white"
        >
            <Td py={4}>
                <HStack spacing={4}>
                    <Avatar
                        size="sm"
                        src={manager.p_image_url || manager.profileImage}
                        name={name}
                        bg="purple.100"
                        color="purple.700"
                        border="2px solid white"
                        shadow="sm"
                    />
                    <VStack align="start" spacing={0.5}>
                        <Text fontWeight="700" fontSize="sm" color="gray.800">{name || '—'}</Text>
                        <Badge colorScheme="purple" fontSize="3xs" variant="solid" borderRadius="full" px={2}>{role}</Badge>
                    </VStack>
                </HStack>
            </Td>
            <Td py={4}>
                <HStack spacing={1.5}>
                    <Icon as={FiMail} boxSize={3.5} color="gray.400" />
                    <Text fontSize="sm" color="gray.600">{email}</Text>
                </HStack>
            </Td>
            <Td py={4}>
                <HStack spacing={1.5}>
                    <Icon as={FiPhone} boxSize={3.5} color="gray.400" />
                    <Text fontSize="sm" color="gray.600">{phone}</Text>
                </HStack>
            </Td>
            <Td py={4}>
                <Text fontSize="sm" color="gray.600">{gender}</Text>
            </Td>
            <Td py={4}>
                <Badge
                    colorScheme={status === 'active' || status === 1 ? 'green' : 'gray'}
                    borderRadius="full"
                    px={2.5}
                    py={0.5}
                    fontSize="xs"
                >
                    {status === 'active' || status === 1 ? 'Active' : 'Inactive'}
                </Badge>
            </Td>
            <Td py={4} onClick={e => e.stopPropagation()}>
                <Center>
                    <Tooltip label="Remove Manager" placement="top" hasArrow>
                        <IconButton
                            icon={<FiTrash2 />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            aria-label="Delete manager"
                            isLoading={isDeleting}
                            onClick={() => onDelete(manager)}
                            _hover={{ bg: 'red.50', color: 'red.600' }}
                        />
                    </Tooltip>
                </Center>
            </Td>
        </Tr>
    );
};


// ── Main ManagersList Page ────────────────────────────────────────────────
const ManagersList = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();

    const companyId = user?.companyId || user?.id;

    // Fetch managers via /api/user-fetch?company_id=&role=manager
    const {
        data: managersData,
        isLoading,
        error,
        refetch,
    } = useGetUserFetchQuery(
        { company_id: companyId, role: 'manager' },
        { skip: !companyId }
    );

    // Also fetch all roles for display
    const { data: roles = [] } = useGetRolesQuery();

    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
    const [selectedManager, setSelectedManager] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const cancelRef = useRef();


    const handleDeleteClick = (manager) => {
        setSelectedManager(manager);
        onOpen();
    };

    const handleDeleteConfirm = () => {
        // TODO: wire real delete API if available
        toast({
            title: 'Feature coming soon',
            description: 'Delete via user-fetch API not yet configured',
            status: 'info',
            duration: 3000,
        });
        onClose();
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <LoadingSpinner message="Loading managers..." />
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <Card>
                    <EmptyState
                        title="Error loading managers"
                        description={error?.data?.message || 'Failed to fetch managers. Check your connection.'}
                    />
                </Card>
            </DashboardLayout>
        );
    }

    // Normalize response — API may return array or { data: [] } or { users: [] }
    const raw = managersData?.data || managersData?.users || managersData || [];
    const managers = Array.isArray(raw) ? raw : [];

    const filteredManagers = managers.filter(m => {
        const name = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`;
        return `${name} ${m.email || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <DashboardLayout>
            <VStack spacing={6} align="stretch">
                {/* ── Hero Header ── */}
                <Box
                    bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    borderRadius="2xl" p={{ base: 6, md: 8 }} position="relative" overflow="hidden"
                >
                    {/* Decorative Background Elements */}
                    <Box position="absolute" top="-40px" right="-40px" w="180px" h="180px" borderRadius="full" bg="whiteAlpha.50" />
                    <Box position="absolute" bottom="-20px" left="15%" w="120px" h="120px" borderRadius="full" bg="whiteAlpha.30" />

                    <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} flexDir={{ base: 'column', md: 'row' }} gap={4} position="relative">
                        <Box>
                            <HStack spacing={3} mb={2}>
                                <Center p={2} bg="whiteAlpha.200" borderRadius="lg" backdropFilter="blur(10px)">
                                    <Icon as={FiUsers} boxSize={6} color="white" />
                                </Center>
                                <Heading size="lg" color="white" letterSpacing="-0.02em">
                                    Managers & Staff
                                </Heading>
                            </HStack>
                            <Text color="whiteAlpha.800" fontSize="sm">
                                {filteredManagers.length} manager{filteredManagers.length !== 1 ? 's' : ''} configured for your company
                            </Text>
                        </Box>
                        
                        <HStack spacing={3} flexWrap="wrap">
                            <Tooltip label="Refresh data" placement="top" hasArrow>
                                <IconButton
                                    icon={<FiRefreshCw />}
                                    variant="outline"
                                    color="white"
                                    borderColor="whiteAlpha.300"
                                    _hover={{ bg: 'whiteAlpha.200' }}
                                    size="sm"
                                    onClick={refetch}
                                    aria-label="Refresh"
                                />
                            </Tooltip>
                            <Button
                                leftIcon={<FiShield />}
                                size="sm"
                                variant="outline"
                                color="white"
                                borderColor="whiteAlpha.300"
                                _hover={{ bg: 'whiteAlpha.200' }}
                                onClick={onDrawerOpen}
                            >
                                View All Tasks
                            </Button>
                            <Button
                                leftIcon={<FiPlus />}
                                size="sm"
                                colorScheme="purple"
                                bg="purple.500"
                                _hover={{ bg: 'purple.400', transform: 'translateY(-1px)', shadow: 'md' }}
                                onClick={() => navigate('/company/create-manager')}
                            >
                                Add Manager
                            </Button>
                            <Button
                                leftIcon={<FiUserCheck />}
                                size="sm"
                                colorScheme="blue"
                                bg="blue.500"
                                _hover={{ bg: 'blue.400', transform: 'translateY(-1px)', shadow: 'md' }}
                                onClick={() => navigate('/company/create-user')}
                            >
                                Create User Role
                            </Button>
                        </HStack>
                    </Flex>
                </Box>

                {/* Role summary pills */}
                {roles.length > 0 && (
                    <Card py={3} px={5} borderRadius="xl" border="1px solid" borderColor="gray.100" shadow="sm">
                        <HStack spacing={3} flexWrap="wrap">
                            <Icon as={FiShield} color="purple.500" boxSize={4} />
                            <Text fontSize="sm" fontWeight="600" color="gray.600">Company Roles:</Text>
                            {roles.filter(r => r.slug !== 'super_admin').map(r => (
                                <Badge key={r.id} colorScheme="purple" variant="subtle" borderRadius="full" px={3} py={0.5} fontSize="xs">
                                    {r.name}
                                </Badge>
                            ))}
                        </HStack>
                    </Card>
                )}

                {/* Search */}
                <InputGroup size="lg" bg="white" borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
                    <InputLeftElement pointerEvents="none" h="full">
                        <Icon as={FiSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                        placeholder="Search managers by name or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        border="none"
                        _focus={{ boxShadow: 'none' }}
                        fontSize="md"
                        bg="transparent"
                        h="56px"
                    />
                </InputGroup>

                {/* Managers Table */}
                {filteredManagers.length === 0 ? (
                    <Card border="1px solid" borderColor="gray.100" shadow="sm">
                        <EmptyState
                            title={searchTerm ? 'No managers found' : 'No managers yet'}
                            description={searchTerm ? 'Try a different search term' : 'Create your first manager or user by role'}
                            icon={FiUsers}
                            action={
                                !searchTerm && (
                                    <HStack spacing={3} mt={4}>
                                        <Button
                                            leftIcon={<FiPlus />}
                                            colorScheme="purple"
                                            onClick={() => navigate('/company/create-manager')}
                                        >
                                            Add Manager
                                        </Button>
                                    </HStack>
                                )
                            }
                        />
                    </Card>
                ) : (
                     <Card p={0} overflow="hidden" shadow="sm" border="1px solid" borderColor="gray.100" borderRadius="2xl">
                        <Box overflowX="auto">
                            <Table variant="simple" size="md" w="100%" style={{ minWidth: '1000px' }}>
                                <Thead>
                                    <Tr>
                                        <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" whiteSpace="nowrap">Manager</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" whiteSpace="nowrap">Email</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" whiteSpace="nowrap">Phone</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" whiteSpace="nowrap">Gender</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" whiteSpace="nowrap">Status</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" textAlign="center" whiteSpace="nowrap">Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {filteredManagers.map(manager => ( 
                                        <ManagerRow
                                            key={manager.id}
                                            manager={manager}
                                            companyId={companyId}
                                            onDelete={handleDeleteClick}
                                            isDeleting={false}
                                        />
                                    ))}
                                </Tbody>
                            </Table>
                        </Box>
                    </Card>
                )}

                {/* Info box */}
                <Box bg="purple.50" p={4} borderRadius="xl" border="1px solid" borderColor="purple.100">
                    <HStack spacing={4}>
                        <Center p={2} bg="white" borderRadius="lg" shadow="sm">
                            <Icon as={FiUsers} boxSize={5} color="purple.600" />
                        </Center>
                        <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="700" color="purple.900">
                                Click any manager row to see their staff
                            </Text>
                            <Text fontSize="xs" color="purple.700">
                                Detailed staff information is displayed inside each manager's dedicated view.
                            </Text>
                        </VStack>
                    </HStack>
                </Box>
            </VStack>

            {/* Delete Dialog */}
            <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
                <AlertDialogOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
                <AlertDialogContent borderRadius="xl">
                    <AlertDialogHeader fontSize="lg" fontWeight="bold" borderBottom="1px solid" borderColor="gray.100" pt={5} pb={4}>
                        Remove Manager
                    </AlertDialogHeader>
                    <AlertDialogBody py={6}>
                        <Text color="gray.600">
                            Are you sure you want to remove{' '}
                            <Text as="span" fontWeight="bold" color="gray.800">
                                {selectedManager?.first_name || selectedManager?.firstName}{' '}
                                {selectedManager?.last_name || selectedManager?.lastName}
                            </Text>? This action cannot be undone.
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter borderTop="1px solid" borderColor="gray.100" bg="gray.50" borderBottomRadius="xl">
                        <Button ref={cancelRef} onClick={onClose} variant="ghost" colorScheme="gray">
                            Cancel
                        </Button>
                        <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3} px={6}>
                            Remove
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* View All Tasks Drawer */}
            <ViewTasksDrawer
                isOpen={isDrawerOpen}
                onClose={onDrawerClose}
                companyId={companyId}
            />
        </DashboardLayout>
    );
};

export default ManagersList;
