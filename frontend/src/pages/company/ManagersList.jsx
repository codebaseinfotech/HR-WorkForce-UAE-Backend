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
            <Tr bg="blue.50">
                <Td colSpan={6} py={2} pl={14}>
                    <Text fontSize="xs" color="gray.400" fontStyle="italic">No staff members found.</Text>
                </Td>
            </Tr>
        );
    }

    return staffList.map((s) => (
        <Tr key={s.id} bg="blue.50" _hover={{ bg: 'blue.100' }} transition="all 0.15s">
            <Td pl={14} py={2}>
                <HStack spacing={2}>
                    <Box w="2px" h="20px" bg="blue.300" borderRadius="full" />
                    <Avatar
                        size="xs"
                        src={s.p_image_url || s.profileImage}
                        name={`${s.first_name || s.firstName} ${s.last_name || s.lastName}`}
                        bg="blue.200"
                        color="blue.700"
                    />
                    <Text fontSize="xs" fontWeight="600" color="gray.700">
                        {s.first_name || s.firstName} {s.last_name || s.lastName}
                    </Text>
                    <Badge colorScheme="blue" fontSize="2xs">Staff</Badge>
                </HStack>
            </Td>
            <Td py={2}>
                <HStack spacing={1}>
                    <Icon as={FiMail} boxSize={3} color="gray.400" />
                    <Text fontSize="xs" color="gray.600">{s.email}</Text>
                </HStack>
            </Td>
            <Td py={2}>
                <HStack spacing={1}>
                    <Icon as={FiPhone} boxSize={3} color="gray.400" />
                    <Text fontSize="xs" color="gray.600">{s.phone || '-'}</Text>
                </HStack>
            </Td>
            <Td py={2}>
                <Text fontSize="xs" color="gray.500">{s.gender || '-'}</Text>
            </Td>
            <Td py={2}>
                <Badge
                    colorScheme={s.status === 'active' || s.status === 1 ? 'green' : 'gray'}
                    fontSize="2xs"
                    borderRadius="full"
                    px={2}
                >
                    {s.status === 'active' || s.status === 1 ? 'Active' : 'Inactive'}
                </Badge>
            </Td>
            <Td py={2}>
                <HStack spacing={1} justify="center">
                    <Tooltip label="View details">
                        <IconButton
                            icon={<FiChevronRight />}
                            size="xs"
                            variant="ghost"
                            colorScheme="blue"
                            aria-label="View staff"
                            onClick={() => navigate(`/company/staff/${s.id}`)}
                        />
                    </Tooltip>
                    <Tooltip label="Delete">
                        <IconButton
                            icon={<FiTrash2 />}
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            aria-label="Delete staff"
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
            transition="all 0.15s"
            borderLeft="3px solid"
            borderLeftColor="transparent"
            _hover_borderLeftColor="purple.400"
            onClick={() => navigate(`/company/manager/${manager.id}/staff`)}
        >
            <Td>
                <HStack spacing={3}>
                    <Tooltip label="View staff">
                        <Icon
                            as={FiChevronRight}
                            boxSize={4}
                            color="purple.400"
                        />
                    </Tooltip>
                    <Avatar
                        size="sm"
                        src={manager.p_image_url || manager.profileImage}
                        name={name}
                        bg="purple.100"
                        color="purple.600"
                    />
                    <VStack align="start" spacing={0}>
                        <Text fontWeight="700" fontSize="sm" color="gray.800">{name || '—'}</Text>
                        <Badge colorScheme="purple" fontSize="2xs" borderRadius="full">{role}</Badge>
                    </VStack>
                </HStack>
            </Td>
            <Td>
                <HStack spacing={1.5}>
                    <Icon as={FiMail} boxSize={3.5} color="gray.400" />
                    <Text fontSize="sm" color="gray.600">{email}</Text>
                </HStack>
            </Td>
            <Td>
                <HStack spacing={1.5}>
                    <Icon as={FiPhone} boxSize={3.5} color="gray.400" />
                    <Text fontSize="sm" color="gray.600">{phone}</Text>
                </HStack>
            </Td>
            <Td>
                <Text fontSize="sm" color="gray.600">{gender}</Text>
            </Td>
            <Td>
                <Badge
                    colorScheme={status === 'active' || status === 1 ? 'green' : 'gray'}
                    borderRadius="full"
                    px={2}
                    fontSize="xs"
                >
                    {status === 'active' || status === 1 ? 'Active' : 'Inactive'}
                </Badge>
            </Td>
            <Td onClick={e => e.stopPropagation()}>
                <IconButton
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    aria-label="Delete manager"
                    isLoading={isDeleting}
                    onClick={() => onDelete(manager)}
                />
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
                {/* Header */}
                <Flex
                    justify="space-between"
                    align={{ base: 'flex-start', md: 'center' }}
                    flexDir={{ base: 'column', md: 'row' }}
                    gap={4}
                >
                    <Box>
                        <Heading
                            size="xl"
                            mb={1}
                            bgGradient="linear(to-r, purple.600, blue.500)"
                            bgClip="text"
                        >
                            Managers & Staff
                        </Heading>
                        <Text color="gray.500" fontSize="sm">
                            {filteredManagers.length} manager{filteredManagers.length !== 1 ? 's' : ''} — click any row to expand their staff
                        </Text>
                    </Box>
                    <HStack spacing={3} flexWrap="wrap">
                        <Tooltip label="Refresh data">
                            <IconButton
                                icon={<FiRefreshCw />}
                                variant="outline"
                                size="md"
                                borderRadius="xl"
                                onClick={refetch}
                                aria-label="Refresh"
                            />
                        </Tooltip>
                        <Button
                            leftIcon={<FiPlus />}
                            size="md"
                            variant="outline"
                            colorScheme="purple"
                            borderRadius="xl"
                            onClick={() => navigate('/company/create-manager')}
                        >
                            Add Manager
                        </Button>
                        <Button
                            leftIcon={<FiUserCheck />}
                            size="md"
                            bgGradient="linear(to-r, purple.500, blue.500)"
                            color="white"
                            borderRadius="xl"
                            _hover={{ bgGradient: 'linear(to-r, purple.600, blue.600)', shadow: 'md' }}
                            onClick={() => navigate('/company/create-user')}
                        >
                            Create User by Role
                        </Button>
                        <Button
                            leftIcon={<FiShield />}
                            size="md"
                            variant="outline"
                            colorScheme="blue"
                            borderRadius="xl"
                            onClick={onDrawerOpen}
                        >
                            View All Tasks
                        </Button>
                    </HStack>
                </Flex>

                {/* Role summary pills */}
                {roles.length > 0 && (
                    <HStack spacing={2} flexWrap="wrap">
                        <Icon as={FiShield} color="purple.400" boxSize={4} />
                        <Text fontSize="xs" fontWeight="600" color="gray.500">Roles in company:</Text>
                        {roles.filter(r => r.slug !== 'super_admin').map(r => (
                            <Badge key={r.id} colorScheme="purple" borderRadius="full" px={2} fontSize="xs">
                                {r.name}
                            </Badge>
                        ))}
                    </HStack>
                )}

                {/* Search */}
                <Card>
                    <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                            <Icon as={FiSearch} color="gray.400" />
                        </InputLeftElement>
                        <Input
                            placeholder="Search managers by name or email..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            borderRadius="xl"
                            focusBorderColor="purple.400"
                        />
                    </InputGroup>
                </Card>

                {/* Managers Table */}
                {filteredManagers.length === 0 ? (
                    <Card>
                        <EmptyState
                            title={searchTerm ? 'No managers found' : 'No managers yet'}
                            description={searchTerm ? 'Try a different search term' : 'Create your first manager or user by role'}
                            icon={FiUsers}
                            action={
                                !searchTerm && (
                                    <HStack spacing={3} mt={4}>
                                        <Button
                                            leftIcon={<FiPlus />}
                                            variant="outline"
                                            colorScheme="purple"
                                            onClick={() => navigate('/company/create-manager')}
                                        >
                                            Add Manager
                                        </Button>
                                        <Button
                                            leftIcon={<FiUserCheck />}
                                            bgGradient="linear(to-r, purple.500, blue.500)"
                                            color="white"
                                            _hover={{ bgGradient: 'linear(to-r, purple.600, blue.600)' }}
                                            onClick={() => navigate('/company/create-user')}
                                        >
                                            Create User by Role
                                        </Button>
                                    </HStack>
                                )
                            }
                        />
                    </Card>
                ) : (
                    <Card p={0} overflow="hidden">
                        <Box overflowX="auto">
                            <Table variant="simple" size="sm">
                                <Thead bg="purple.50">
                                    <Tr>
                                        <Th color="purple.700" fontSize="xs" py={4}>Manager</Th>
                                        <Th color="purple.700" fontSize="xs">Email</Th>
                                        <Th color="purple.700" fontSize="xs">Phone</Th>
                                        <Th color="purple.700" fontSize="xs">Gender</Th>
                                        <Th color="purple.700" fontSize="xs">Status</Th>
                                        <Th color="purple.700" fontSize="xs">Actions</Th>
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
                <Card bg="purple.50" borderColor="purple.100">
                    <HStack spacing={3}>
                        <Icon as={FiUsers} boxSize={5} color="purple.500" />
                        <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="700" color="purple.800">
                                💡 Click any manager row to see their staff
                            </Text>
                            <Text fontSize="xs" color="purple.600">
                                Staff members are loaded dynamically from the API when you expand a manager row.
                            </Text>
                        </VStack>
                    </HStack>
                </Card>
            </VStack>

            {/* Delete Dialog */}
            <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">Remove Manager</AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure you want to remove{' '}
                            <strong>
                                {selectedManager?.first_name || selectedManager?.firstName}{' '}
                                {selectedManager?.last_name || selectedManager?.lastName}
                            </strong>?
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose} variant="outline">Cancel</Button>
                            <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                                Remove
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
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
