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
    Avatar,
    HStack,
    IconButton,
    useToast,
    Button,
    InputGroup,
    InputLeftElement,
    Input,
    Icon,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    useDisclosure,
    Flex,
    Tooltip,
} from '@chakra-ui/react';
import {
    FiEdit,
    FiTrash2,
    FiMail,
    FiPhone,
    FiSearch,
    FiMoreVertical,
    FiPlus,
    FiClipboard,
    FiEye,
    FiUserCheck,
    FiRefreshCw,
    FiUsers,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import AssignTaskModal from '../../components/tasks/AssignTaskModal';
import TaskManagementModal from '../../components/tasks/TaskManagementModal';
import { useAuth } from '../../contexts/AuthContext';
import {
    useGetUserFetchQuery,
    useGetUserFetchQuery as useGetManagersForAssign,
    useUpdateCreatedByMutation,
} from '../../store/apiSlice';

// ── Assign Manager Submenu ─────────────────────────────────────────────────
const AssignManagerMenu = ({ staffId, companyId }) => {
    const toast = useToast();
    const [updateCreatedBy, { isLoading }] = useUpdateCreatedByMutation();

    const { data: mData } = useGetManagersForAssign(
        { company_id: companyId, role: 'manager' },
        { skip: !companyId }
    );
    const raw = mData?.data || mData?.users || mData || [];
    const managers = Array.isArray(raw) ? raw : [];

    const handleAssign = async (manager) => {
        try {
            await updateCreatedBy({
                user_id: staffId,
                created_by_user: manager.id,
            }).unwrap();
            toast({
                title: '✓ Manager Assigned',
                description: `Staff assigned to ${manager.first_name || manager.firstName} ${manager.last_name || manager.lastName}`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (err) {
            toast({
                title: 'Assignment Failed',
                description: err?.data?.message || 'Could not assign manager',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        }
    };

    if (managers.length === 0) {
        return (
            <MenuItem icon={<FiUserCheck />} isDisabled>
                No managers available
            </MenuItem>
        );
    }

    return managers.map(m => {
        const name = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`.trim();
        return (
            <MenuItem
                key={m.id}
                icon={<FiUserCheck />}
                onClick={() => handleAssign(m)}
                isDisabled={isLoading}
                fontSize="sm"
            >
                {name}
            </MenuItem>
        );
    });
};

// ── Main StaffList ─────────────────────────────────────────────────────────
const StaffList = () => {
    const navigate = useNavigate();
    // const location = useLocation();
    // const toast = useToast();
    const { user } = useAuth();

    const companyId = user?.companyId || user?.id;

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStaff, setSelectedStaff] = useState(null);

    const {
        isOpen: isAssignTaskOpen,
        onOpen: onAssignTaskOpen,
        onClose: onAssignTaskClose,
    } = useDisclosure();
    const {
        isOpen: isTaskManagementOpen,
        onOpen: onTaskManagementOpen,
        onClose: onTaskManagementClose,
    } = useDisclosure();

    // Fetch ALL staff for this company via the new user-fetch API
    const {
        data: staffData,
        isLoading,
        error,
        refetch,
    } = useGetUserFetchQuery(
        { company_id: companyId, role: 'Employee' },
        { skip: !companyId }
    );

    const raw = staffData?.data || staffData?.users || staffData || [];
    const staff = Array.isArray(raw) ? raw : [];

    const filteredStaff = staff.filter(m => {
        const name = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`;
        return `${name} ${m.email || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <LoadingSpinner message="Loading staff members..." />
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <Card>
                    <EmptyState
                        title="Error loading staff"
                        description={error?.data?.message || 'Could not load staff members'}
                    />
                </Card>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>
                {/* ── Hero Header ── */}
                <Box
                    bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    borderRadius="3xl"
                    p={{ base: 6, md: 8 }}
                    position="relative"
                    overflow="hidden"
                    boxShadow="xl"
                >
                    {/* Background abstract elements */}
                    <Box position="absolute" top="-20%" right="-5%" w="300px" h="300px" bg="purple.500" opacity="0.1" filter="blur(60px)" borderRadius="full" />
                    <Box position="absolute" bottom="-20%" left="10%" w="200px" h="200px" bg="blue.500" opacity="0.1" filter="blur(40px)" borderRadius="full" />
                    <Box position="absolute" top="10%" right="15%" w="100px" h="100px" bg="cyan.500" opacity="0.15" filter="blur(30px)" borderRadius="full" />

                    <Flex
                        direction={{ base: 'column', md: 'row' }}
                        justify="space-between"
                        align={{ base: 'flex-start', md: 'center' }}
                        gap={6}
                        position="relative"
                        zIndex={1}
                    >
                        <Box>
                            <Badge bg="whiteAlpha.200" color="white" px={3} py={1} borderRadius="full" fontSize="xs" mb={3} backdropFilter="blur(10px)">
                                Team Roster
                            </Badge>
                            <Heading size="xl" color="white" mb={2} letterSpacing="-0.02em">
                                Staff Management
                            </Heading>
                            <Text color="whiteAlpha.800" fontSize="sm">
                                {filteredStaff.length} {filteredStaff.length === 1 ? 'member' : 'members'} available • Use ⋮ to assign managers
                            </Text>
                        </Box>

                        <HStack spacing={3}>
                            <Tooltip label="Refresh">
                                <IconButton
                                    icon={<FiRefreshCw />}
                                    variant="outline"
                                    color="white"
                                    borderColor="whiteAlpha.400"
                                    borderRadius="xl"
                                    onClick={refetch}
                                    aria-label="Refresh"
                                    _hover={{ bg: 'whiteAlpha.200' }}
                                />
                            </Tooltip>
                            <Button
                                leftIcon={<FiPlus />}
                                size="lg"
                                bg="purple.500"
                                color="white"
                                _hover={{ bg: 'purple.600', transform: 'translateY(-2px)', shadow: 'md' }}
                                _active={{ bg: 'purple.700' }}
                                borderRadius="xl"
                                transition="all 0.2s"
                                onClick={() => navigate('/staff/add')}
                            >
                                Add Staff
                            </Button>
                        </HStack>
                    </Flex>
                </Box>

                {/* ── Search & Filter Bar ── */}
                <Card bg="white" p={4} borderRadius="2xl" border="1px solid" borderColor="gray.100" shadow="sm">
                    <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                            <Icon as={FiSearch} color="gray.400" />
                        </InputLeftElement>
                        <Input
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            borderRadius="xl"
                            bg="gray.50"
                            border="none"
                            _hover={{ bg: 'gray.100' }}
                            _focus={{ bg: 'white', ring: 2, ringColor: 'purple.400' }}
                            fontSize="sm"
                        />
                    </InputGroup>
                </Card>

                {/* Staff Table */}
                {filteredStaff.length === 0 ? (
                    <Card border="1px solid" borderColor="gray.100" shadow="sm" borderRadius="2xl">
                        <EmptyState
                            title={searchTerm ? 'No staff found' : 'No staff members yet'}
                            description={searchTerm ? 'Try a different search term' : 'Start by adding your first staff member'}
                            icon={FiUsers}
                            action={
                                !searchTerm && (
                                    <Button
                                        leftIcon={<FiPlus />}
                                        onClick={() => navigate('/staff/add')}
                                        mt={4}
                                        borderRadius="xl"
                                        colorScheme="purple"
                                    >
                                        Add First Staff Member
                                    </Button>
                                )
                            }
                        />
                    </Card>
                ) : (
                    <Card p={0} overflow="hidden" border="1px solid" borderColor="gray.100" shadow="sm" borderRadius="2xl">
                        <Box overflowX="auto">
                            <Table variant="simple" size="md" w="100%" style={{ minWidth: '1000px' }}>
                                <Thead>
                                    <Tr>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Staff Member</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Email</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Phone</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Gender</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Role</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Status</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" textAlign="right" pr={6}>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {filteredStaff.map((member) => {
                                        const name = `${member.first_name || member.firstName || ''} ${member.last_name || member.lastName || ''}`.trim();
                                        const role = typeof member.role === 'object' ? member.role?.name : member.role || 'Staff';
                                        const isActive = member.status === 'active' || member.status === 1;

                                        return (
                                            <Tr key={member.id} _hover={{ bg: 'gray.50' }} transition="all 0.15s">
                                                <Td py={3}>
                                                    <HStack spacing={3}>
                                                        <Avatar
                                                            size="sm"
                                                            name={name}
                                                            src={member.p_image_url || member.profileImage}
                                                            bg="purple.100"
                                                            color="purple.600"
                                                        />
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontWeight="700" fontSize="sm" color="gray.800">
                                                                {name || '—'}
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.400">ID: {member.id}</Text>
                                                        </VStack>
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    <HStack spacing={1}>
                                                        <Icon as={FiMail} boxSize={3.5} color="gray.400" />
                                                        <Text fontSize="sm" color="gray.600">{member.email || '—'}</Text>
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    <HStack spacing={1}>
                                                        <Icon as={FiPhone} boxSize={3.5} color="gray.400" />
                                                        <Text fontSize="sm" color="gray.600">{member.phone || '—'}</Text>
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm" color="gray.600">{member.gender || '—'}</Text>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme="purple" borderRadius="full" px={2} fontSize="xs">
                                                        {role}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Badge
                                                        colorScheme={isActive ? 'green' : 'gray'}
                                                        borderRadius="full"
                                                        px={2}
                                                        fontSize="xs"
                                                    >
                                                        {isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Menu>
                                                        <MenuButton
                                                            as={IconButton}
                                                            icon={<FiMoreVertical />}
                                                            variant="ghost"
                                                            size="sm"
                                                            borderRadius="lg"
                                                            aria-label="Actions"
                                                        />
                                                        <MenuList shadow="xl" borderRadius="xl" py={2}>
                                                            {/* ── Assign Manager ── */}
                                                            <Text
                                                                fontSize="2xs"
                                                                fontWeight="700"
                                                                color="gray.400"
                                                                px={3}
                                                                py={1}
                                                                letterSpacing="wider"
                                                                textTransform="uppercase"
                                                            >
                                                                Assign to Manager
                                                            </Text>
                                                            <AssignManagerMenu
                                                                staffId={member.id}
                                                                companyId={companyId}
                                                            />
                                                            <MenuDivider />
                                                            {/* ── Tasks ── */}
                                                            <MenuItem
                                                                icon={<FiClipboard />}
                                                                onClick={() => {
                                                                    setSelectedStaff(member);
                                                                    onAssignTaskOpen();
                                                                }}
                                                            >
                                                                Assign Task
                                                            </MenuItem>
                                                            <MenuItem
                                                                icon={<FiEye />}
                                                                onClick={() => {
                                                                    setSelectedStaff(member);
                                                                    onTaskManagementOpen();
                                                                }}
                                                            >
                                                                View Tasks
                                                            </MenuItem>
                                                            <MenuDivider />
                                                            <MenuItem icon={<FiEdit />}>
                                                                Edit
                                                            </MenuItem>
                                                            <MenuItem
                                                                icon={<FiTrash2 />}
                                                                color="red.500"
                                                            >
                                                                Delete
                                                            </MenuItem>
                                                        </MenuList>
                                                    </Menu>
                                                </Td>
                                            </Tr>
                                        );
                                    })}
                                </Tbody>
                            </Table>
                        </Box>
                    </Card>
                )}
            </VStack>

            {/* Task Modals */}
            {selectedStaff && (
                <>
                    <AssignTaskModal
                        isOpen={isAssignTaskOpen}
                        onClose={onAssignTaskClose}
                        staffMember={selectedStaff}
                    />
                    <TaskManagementModal
                        isOpen={isTaskManagementOpen}
                        onClose={onTaskManagementClose}
                        staffMember={selectedStaff}
                    />
                </>
            )}
        </DashboardLayout>
    );
};

export default StaffList;
