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
    Button,
    Icon,
    useToast,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Tooltip,
} from '@chakra-ui/react';
import { FiEye, FiPlus, FiShield, FiTrash2, FiEdit, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useGetRolesQuery, useCreateRoleMutation, useDeleteRoleMutation } from '../../store/apiSlice';

const Roles = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const { isOpen, onOpen, onClose } = useDisclosure();

    // RTK Query
    const { data: roles = [], isLoading, refetch } = useGetRolesQuery();
    const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
    const [deleteRole] = useDeleteRoleMutation();

    const [newRole, setNewRole] = useState({ name: '', slug: '' });

    // Restricted slugs that cannot be created or deleted
    const RESTRICTED_SLUGS = ['super_admin'];

    const handleAddRole = async () => {
        if (!newRole.name.trim()) {
            toast({
                title: 'Role name is required',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const slug = newRole.slug || newRole.name.toLowerCase().replace(/\s+/g, '_');

        if (RESTRICTED_SLUGS.includes(slug)) {
            toast({
                title: 'Restricted slug',
                description: `"${slug}" is a system role and cannot be created`,
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
            return;
        }

        try {
            await createRole({
                name: newRole.name,
                slug: newRole.slug || newRole.name.toLowerCase().replace(/\s+/g, '_'),
            }).unwrap();

            setNewRole({ name: '', slug: '' });
            onClose();

            toast({
                title: 'Role Created',
                description: `"${newRole.name}" role has been added successfully`,
                status: 'success',
                duration: 4000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Failed to create role',
                description: error.data?.message || 'Something went wrong',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleViewPermissions = (roleId) => {
        navigate(`/company/permissions/${roleId}`);
    };

    const handleDelete = async (role) => {
        if (RESTRICTED_SLUGS.includes(role.slug)) return;

        if (!window.confirm(`Are you sure you want to delete "${role.name}" role?`)) return;

        try {
            await deleteRole(role.id).unwrap();
            toast({
                title: 'Role Deleted',
                description: `"${role.name}" has been removed`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Delete failed',
                description: error.data?.message || 'Failed to delete role',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <LoadingSpinner message="Loading roles..." />
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
                            Roles Management
                        </Heading>
                        <Text color="gray.600" fontSize="lg">
                            {roles.length} {roles.length === 1 ? 'role' : 'roles'} configured
                        </Text>
                    </Box>
                    <HStack spacing={3}>
                        <Button
                            variant="outline"
                            onClick={refetch}
                            leftIcon={<Icon as={FiRefreshCw} />}
                            size="md"
                        >
                            Refresh
                        </Button>
                        <Button
                            leftIcon={<FiPlus />}
                            size="lg"
                            onClick={onOpen}
                            bgGradient="linear(to-r, primary.500, purple.500)"
                            color="white"
                            _hover={{ bgGradient: 'linear(to-r, primary.600, purple.600)', transform: 'translateY(-1px)', shadow: 'lg' }}
                            _active={{ transform: 'translateY(0)' }}
                            transition="all 0.2s"
                        >
                            Add New Role
                        </Button>
                    </HStack>
                </HStack>

                {roles.length === 0 ? (
                    <Card>
                        <EmptyState
                            title="No roles found"
                            description="Create your first role to get started"
                            icon={FiShield}
                            action={
                                <Button
                                    leftIcon={<FiPlus />}
                                    onClick={onOpen}
                                    mt={4}
                                >
                                    Create First Role
                                </Button>
                            }
                        />
                    </Card>
                ) : (
                    <Card p={0} overflow="hidden">
                        <Box overflow="auto">
                            <Table variant="simple">
                                <Thead bg="gray.50">
                                    <Tr>
                                        <Th fontSize="xs" color="gray.600" py={4}>#</Th>
                                        <Th fontSize="xs" color="gray.600" py={4}>Role Name</Th>
                                        <Th fontSize="xs" color="gray.600" py={4}>Slug</Th>
                                        <Th fontSize="xs" color="gray.600" py={4} isNumeric>Permissions</Th>
                                        <Th fontSize="xs" color="gray.600" py={4}>Status</Th>
                                        <Th fontSize="xs" color="gray.600" py={4} textAlign="center">Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {roles.map((role, index) => {
                                        const isSystemRole = RESTRICTED_SLUGS.includes(role.slug);
                                        return (
                                        <Tr
                                            key={role.id}
                                            _hover={{ bg: isSystemRole ? 'gray.100' : 'gray.50' }}
                                            transition="background 0.15s"
                                            opacity={isSystemRole ? 0.6 : 1}
                                            bg={isSystemRole ? 'gray.50' : 'white'}
                                        >
                                            <Td>
                                                <Text fontWeight="medium" color="gray.500">{index + 1}</Text>
                                            </Td>
                                            <Td>
                                                <HStack spacing={3}>
                                                    <Box p={2} borderRadius="lg" bg="primary.50">
                                                        <Icon as={FiShield} color="primary.500" boxSize={4} />
                                                    </Box>
                                                    <Text fontWeight="semibold" color="gray.800">
                                                        {role.name}
                                                    </Text>
                                                </HStack>
                                            </Td>
                                            <Td>
                                                <Badge
                                                    variant="subtle"
                                                    colorScheme="gray"
                                                    fontSize="xs"
                                                    fontFamily="mono"
                                                    px={2}
                                                    py={0.5}
                                                    borderRadius="md"
                                                >
                                                    {role.slug}
                                                </Badge>
                                            </Td>
                                            <Td isNumeric>
                                                <Badge
                                                    variant="subtle"
                                                    colorScheme="purple"
                                                    fontSize="xs"
                                                    px={2.5}
                                                    py={0.5}
                                                    borderRadius="full"
                                                >
                                                    {role.permissions?.length || 0}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <Badge
                                                    colorScheme={role.status === 1 ? 'green' : 'red'}
                                                    fontSize="xs"
                                                    px={2.5}
                                                    py={0.5}
                                                    borderRadius="full"
                                                >
                                                    {role.status === 1 ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <HStack spacing={1} justify="center">
                                                    <Tooltip label="View Permissions" hasArrow>
                                                        <IconButton
                                                            icon={<FiEye />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="green"
                                                            aria-label="View permissions"
                                                            onClick={() => handleViewPermissions(role.id)}
                                                            isDisabled={isSystemRole}
                                                        />
                                                    </Tooltip>
                                                    <Tooltip label="Edit Role" hasArrow>
                                                        <IconButton
                                                            icon={<FiEdit />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="blue"
                                                            aria-label="Edit role"
                                                            isDisabled={isSystemRole}
                                                        />
                                                    </Tooltip>
                                                    <Tooltip label={isSystemRole ? 'System role' : 'Delete Role'} hasArrow>
                                                        <IconButton
                                                            icon={<FiTrash2 />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="red"
                                                            aria-label="Delete role"
                                                            isDisabled={isSystemRole}
                                                            onClick={() => handleDelete(role)}
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

                {/* Footer Stats */}
                {roles.length > 0 && (
                    <Card bg="primary.50" borderColor="primary.200">
                        <HStack spacing={3}>
                            <Icon as={FiShield} boxSize={5} color="primary.600" />
                            <Text fontSize="sm" color="primary.900">
                                <strong>Total Roles:</strong> {roles.length} &nbsp;|&nbsp;
                                <strong>Active:</strong> {roles.filter(r => r.status === 1).length} &nbsp;|&nbsp;
                                <strong>Total Permissions Assigned:</strong> {roles.reduce((acc, r) => acc + (r.permissions?.length || 0), 0)}
                            </Text>
                        </HStack>
                    </Card>
                )}
            </VStack>

            {/* Add Role Modal */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
                <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
                <ModalContent borderRadius="xl" mx={4}>
                    <ModalHeader
                        bgGradient="linear(to-r, primary.500, purple.500)"
                        color="white"
                        borderTopRadius="xl"
                        py={5}
                    >
                        <HStack spacing={3}>
                            <Icon as={FiShield} boxSize={5} />
                            <Text>Add New Role</Text>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton color="white" />
                    <ModalBody py={6}>
                        <VStack spacing={5}>
                            <FormControl isRequired>
                                <FormLabel fontWeight="semibold" fontSize="sm">Role Name</FormLabel>
                                <Input
                                    placeholder="e.g. HR Manager"
                                    value={newRole.name}
                                    onChange={(e) => setNewRole({
                                        ...newRole,
                                        name: e.target.value,
                                        slug: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                                    })}
                                    size="lg"
                                    borderRadius="lg"
                                    focusBorderColor="primary.500"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel fontWeight="semibold" fontSize="sm">Slug</FormLabel>
                                <Input
                                    placeholder="auto-generated"
                                    value={newRole.slug}
                                    onChange={(e) => setNewRole({ ...newRole, slug: e.target.value })}
                                    size="lg"
                                    borderRadius="lg"
                                    fontFamily="mono"
                                    fontSize="sm"
                                    focusBorderColor="primary.500"
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter borderTop="1px solid" borderColor="gray.100" gap={3}>
                        <Button variant="ghost" onClick={onClose} size="lg">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddRole}
                            isLoading={isCreating}
                            loadingText="Creating..."
                            size="lg"
                            bgGradient="linear(to-r, primary.500, purple.500)"
                            color="white"
                            _hover={{ bgGradient: 'linear(to-r, primary.600, purple.600)' }}
                            px={8}
                        >
                            Create Role
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </DashboardLayout>
    );
};

export default Roles;
