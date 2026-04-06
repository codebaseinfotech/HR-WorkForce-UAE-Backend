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
    Flex,
    Center,
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
    const { data: rolesData, isLoading, refetch } = useGetRolesQuery();
    const roles = Array.isArray(rolesData?.data) ? rolesData.data : (Array.isArray(rolesData) ? rolesData : []);
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
                company_id: localStorage.getItem('companyId'),
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
                {/* ── Hero Header ── */}
                <Box
                    bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    borderRadius="2xl" p={{ base: 6, md: 8 }} position="relative" overflow="hidden"
                >
                    <Box position="absolute" top="-40px" right="-40px" w="180px" h="180px" borderRadius="full" bg="whiteAlpha.50" />
                    <Box position="absolute" bottom="-20px" left="15%" w="120px" h="120px" borderRadius="full" bg="whiteAlpha.30" />

                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={4} position="relative">
                        <Box>
                            <HStack spacing={3} mb={2}>
                                <Center p={2} bg="whiteAlpha.200" borderRadius="lg" backdropFilter="blur(10px)">
                                    <Icon as={FiShield} boxSize={6} color="white" />
                                </Center>
                                <Heading size="lg" color="white" letterSpacing="-0.02em">
                                    Roles Management
                                </Heading>
                            </HStack>
                            <Text color="whiteAlpha.800" fontSize="sm">
                                Configure system roles and permissions for your workforce
                            </Text>
                        </Box>

                        <HStack spacing={3}>
                            <Button
                                variant="outline"
                                color="white"
                                _hover={{ bg: 'whiteAlpha.200' }}
                                borderColor="whiteAlpha.300"
                                onClick={refetch}
                                leftIcon={<Icon as={FiRefreshCw} />}
                                size="sm"
                            >
                                Refresh
                            </Button>
                            <Button
                                leftIcon={<FiPlus />}
                                size="sm"
                                onClick={onOpen}
                                colorScheme="purple"
                                bg="purple.500"
                                _hover={{ bg: 'purple.400', transform: 'translateY(-1px)', shadow: 'md' }}
                                _active={{ transform: 'translateY(0)' }}
                                transition="all 0.2s"
                            >
                                Add New Role
                            </Button>
                        </HStack>
                    </Flex>
                </Box>

                {roles.length === 0 ? (
                    <Card border="1px solid" borderColor="gray.100" shadow="sm">
                        <EmptyState
                            title="No roles found"
                            description="Create your first role to get started"
                            icon={FiShield}
                            action={
                                <Button
                                    leftIcon={<FiPlus />}
                                    onClick={onOpen}
                                    mt={4}
                                    colorScheme="purple"
                                >
                                    Create First Role
                                </Button>
                            }
                        />
                    </Card>
                ) : (
                    <Card p={0} overflow="hidden" border="1px solid" borderColor="gray.100" shadow="sm">
                        <Box overflowX="auto">
                            <Table variant="simple" w="100%" style={{ minWidth: '800px' }}>
                                <Thead>
                                    <Tr>
                                        <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" whiteSpace="nowrap" w="60px">#</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" whiteSpace="nowrap">Role Name</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" whiteSpace="nowrap">Slug</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" isNumeric whiteSpace="nowrap">Permissions</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" whiteSpace="nowrap">Status</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" textAlign="center" whiteSpace="nowrap">Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {roles.map((role, index) => {
                                        const isSystemRole = RESTRICTED_SLUGS.includes(role.slug);
                                        return (
                                        <Tr
                                            key={role.id}
                                            _hover={{ bg: isSystemRole ? 'gray.50' : 'purple.50' }}
                                            transition="all 0.15s"
                                            opacity={isSystemRole ? 0.75 : 1}
                                            bg={index % 2 === 0 ? 'white' : 'gray.50'}
                                        >
                                            <Td py={4}>
                                                <Text fontWeight="600" color="gray.500" fontSize="sm">{index + 1}</Text>
                                            </Td>
                                            <Td py={4}>
                                                <HStack spacing={3}>
                                                    <Center p={2} borderRadius="lg" bg={isSystemRole ? 'gray.200' : 'purple.100'}>
                                                        <Icon as={FiShield} color={isSystemRole ? 'gray.600' : 'purple.600'} boxSize={4} />
                                                    </Center>
                                                    <Box>
                                                        <Text fontWeight="600" color="gray.800" fontSize="sm">
                                                            {role.name}
                                                        </Text>
                                                        {isSystemRole && <Text fontSize="xs" color="gray.500">System Role</Text>}
                                                    </Box>
                                                </HStack>
                                            </Td>
                                            <Td py={4}>
                                                <Badge
                                                    variant="subtle"
                                                    colorScheme="gray"
                                                    fontSize="xs"
                                                    fontFamily="mono"
                                                    px={2}
                                                    py={0.5}
                                                    borderRadius="full"
                                                >
                                                    {role.slug}
                                                </Badge>
                                            </Td>
                                            <Td isNumeric py={4}>
                                                <Badge
                                                    variant="solid"
                                                    bg="gray.800"
                                                    color="white"
                                                    fontSize="xs"
                                                    px={2.5}
                                                    py={0.5}
                                                    borderRadius="full"
                                                >
                                                    {role.permissions?.length || 0}
                                                </Badge>
                                            </Td>
                                            <Td py={4}>
                                                <Badge
                                                    colorScheme={role.status === 1 ? 'green' : 'red'}
                                                    fontSize="2xs"
                                                    px={2.5}
                                                    py={1}
                                                    borderRadius="full"
                                                >
                                                    {role.status === 1 ? 'ACTIVE' : 'INACTIVE'}
                                                </Badge>
                                            </Td>
                                            <Td py={4}>
                                                <HStack spacing={1} justify="center">
                                                    <Tooltip label="View Permissions" hasArrow placement="top">
                                                        <IconButton
                                                            icon={<FiEye />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="green"
                                                            aria-label="View permissions"
                                                            onClick={() => handleViewPermissions(role.id)}
                                                            isDisabled={isSystemRole}
                                                            _hover={{ bg: 'green.100' }}
                                                        />
                                                    </Tooltip>
                                                    <Tooltip label="Edit Role" hasArrow placement="top">
                                                        <IconButton
                                                            icon={<FiEdit />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="blue"
                                                            aria-label="Edit role"
                                                            isDisabled={isSystemRole}
                                                            _hover={{ bg: 'blue.100' }}
                                                        />
                                                    </Tooltip>
                                                    <Tooltip label={isSystemRole ? 'System role' : 'Delete Role'} hasArrow placement="top">
                                                        <IconButton
                                                            icon={<FiTrash2 />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="red"
                                                            aria-label="Delete role"
                                                            isDisabled={isSystemRole}
                                                            onClick={() => handleDelete(role)}
                                                            _hover={{ bg: 'red.100' }}
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
                    <Box bg="purple.50" p={4} borderRadius="xl" border="1px solid" borderColor="purple.100">
                        <HStack spacing={3} justify="center">
                            <Icon as={FiShield} boxSize={5} color="purple.600" />
                            <Text fontSize="sm" color="purple.900" fontWeight="500">
                                Total Roles: <strong>{roles.length}</strong> &bull; Active: <strong>{roles.filter(r => r.status === 1).length}</strong> &bull; Total Permissions Assigned: <strong>{roles.reduce((acc, r) => acc + (r.permissions?.length || 0), 0)}</strong>
                            </Text>
                        </HStack>
                    </Box>
                )}
            </VStack>

            {/* Add Role Modal */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
                <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
                <ModalContent borderRadius="xl" mx={4} overflow="hidden">
                    <ModalHeader
                        bgGradient="linear(to-r, #1a1a2e, #16213e)"
                        color="white"
                        py={5}
                    >
                        <HStack spacing={3}>
                            <Icon as={FiShield} boxSize={5} color="purple.300" />
                            <Text fontSize="lg">Add New Role</Text>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton color="white" top={4} />
                    <ModalBody py={6}>
                        <VStack spacing={5}>
                            <FormControl isRequired>
                                <FormLabel fontWeight="600" fontSize="sm" color="gray.700">Role Name</FormLabel>
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
                                    focusBorderColor="purple.500"
                                    bg="gray.50"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel fontWeight="600" fontSize="sm" color="gray.700">Slug Identifier</FormLabel>
                                <Input
                                    placeholder="auto-generated"
                                    value={newRole.slug}
                                    onChange={(e) => setNewRole({ ...newRole, slug: e.target.value })}
                                    size="lg"
                                    borderRadius="lg"
                                    fontFamily="mono"
                                    fontSize="sm"
                                    focusBorderColor="purple.500"
                                    bg="gray.50"
                                />
                                <Text fontSize="xs" color="gray.500" mt={2}>
                                    Used internally for system reference. Usually auto-generated.
                                </Text>
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter borderTop="1px solid" borderColor="gray.100" bg="gray.50" gap={3}>
                        <Button variant="ghost" onClick={onClose} size="md" colorScheme="gray">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddRole}
                            isLoading={isCreating}
                            loadingText="Creating..."
                            size="md"
                            colorScheme="purple"
                            bg="purple.600"
                            _hover={{ bg: 'purple.700' }}
                            px={8}
                            borderRadius="lg"
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
