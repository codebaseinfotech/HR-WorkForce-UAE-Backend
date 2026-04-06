import React, { useState } from 'react';
import {
    Box,
    Button,
    Flex,
    HStack,
    Text,
    VStack,
    Heading,
    Center,
    Icon,
    useDisclosure,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    FormControl,
    FormLabel,
    Input,
    Switch,
    Badge,
    IconButton,
} from '@chakra-ui/react';
import { FiBriefcase, FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
    useGetPositionsQuery,
    useCreatePositionMutation,
    useUpdatePositionMutation,
    useDeletePositionMutation,
    useChangePositionStatusMutation,
} from '../../store/apiSlice';

const Positions = () => {
    const { data: positionsData, isLoading, refetch } = useGetPositionsQuery();
    const positions = positionsData?.data || [];

    const [createPosition, { isLoading: isCreating }] = useCreatePositionMutation();
    const [updatePosition, { isLoading: isUpdating }] = useUpdatePositionMutation();
    const [deletePosition] = useDeletePositionMutation();
    const [changePositionStatus] = useChangePositionStatusMutation();

    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    const [editingPosition, setEditingPosition] = useState(null);
    const [formData, setFormData] = useState({ name: '', status: 1 });

    const handleOpenModal = (position = null) => {
        if (position) {
            setEditingPosition(position);
            setFormData({ name: position.name, status: position.status });
        } else {
            setEditingPosition(null);
            setFormData({ name: '', status: 1 });
        }
        onOpen();
    };

    const handleCloseModal = () => {
        setEditingPosition(null);
        setFormData({ name: '', status: 1 });
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPosition) {
                await updatePosition({ id: editingPosition.id, ...formData }).unwrap();
                toast({ title: 'Position updated successfully', status: 'success', duration: 3000, isClosable: true });
            } else {
                await createPosition(formData).unwrap();
                toast({ title: 'Position created successfully', status: 'success', duration: 3000, isClosable: true });
            }
            handleCloseModal();
            refetch();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.data?.message || 'Something went wrong',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this position?')) {
            try {
                await deletePosition(id).unwrap();
                toast({ title: 'Position deleted successfully', status: 'success', duration: 3000, isClosable: true });
                refetch();
            } catch (error) {
                toast({
                    title: 'Delete failed',
                    description: error.data?.message || 'Position is assigned to users and cannot be deleted.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            }
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 1 ? 0 : 1;
            await changePositionStatus({ id, status: newStatus }).unwrap();
            toast({ title: 'Position status updated', status: 'success', duration: 2000, isClosable: true });
            refetch();
        } catch (error) {
            toast({ title: 'Status update failed', description: error?.data?.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <LoadingSpinner message="Loading positions..." />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>
                {/* Hero Header */}
                <Box bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" borderRadius="2xl" p={{ base: 6, md: 8 }} position="relative" overflow="hidden">
                    <Box position="absolute" top="-40px" right="-40px" w="180px" h="180px" borderRadius="full" bg="whiteAlpha.50" />
                    <Box position="absolute" bottom="-20px" left="15%" w="120px" h="120px" borderRadius="full" bg="whiteAlpha.30" />

                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={4} position="relative">
                        <Box>
                            <HStack spacing={3} mb={2}>
                                <Center p={2} bg="whiteAlpha.200" borderRadius="lg" backdropFilter="blur(10px)">
                                    <Icon as={FiBriefcase} boxSize={6} color="white" />
                                </Center>
                                <Heading size="lg" color="white" letterSpacing="-0.02em">Positions Management</Heading>
                            </HStack>
                            <Text color="whiteAlpha.800" fontSize="sm">Manage job titles and hierarchy levels for your organization</Text>
                        </Box>

                        <HStack spacing={3}>
                            <Button variant="outline" color="white" _hover={{ bg: 'whiteAlpha.200' }} borderColor="whiteAlpha.300" onClick={refetch} leftIcon={<Icon as={FiRefreshCw} />} size="sm">
                                Refresh
                            </Button>
                            <Button leftIcon={<FiPlus />} size="sm" onClick={() => handleOpenModal()} colorScheme="purple" bg="purple.500" _hover={{ bg: 'purple.400', transform: 'translateY(-1px)', shadow: 'md' }} transition="all 0.2s">
                                Add New Position
                            </Button>
                        </HStack>
                    </Flex>
                </Box>

                {positions.length === 0 ? (
                    <Card border="1px solid" borderColor="gray.100" shadow="sm">
                        <EmptyState
                            title="No positions found"
                            description="Create your first position to assign properly to staff."
                            icon={FiBriefcase}
                            action={
                                <Button leftIcon={<FiPlus />} onClick={() => handleOpenModal()} mt={4} colorScheme="purple">
                                    Create First Position
                                </Button>
                            }
                        />
                    </Card>
                ) : (
                    <Card p={0} overflow="hidden" border="1px solid" borderColor="gray.100" shadow="sm">
                        <Box overflowX="auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr>
                                        <th className="bg-gray-800 text-white text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap w-[60px]">#</th>
                                        <th className="bg-gray-800 text-white text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap">Position Name</th>
                                        <th className="bg-gray-800 text-white text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap">Status</th>
                                        <th className="bg-gray-800 text-white text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {positions.map((position, index) => (
                                        <tr key={position.id} className="hover:bg-purple-50 transition-colors duration-150 odd:bg-white even:bg-gray-50">
                                            <td className="py-4 px-6">
                                                <Text fontWeight="600" color="gray.500" fontSize="sm">{index + 1}</Text>
                                            </td>
                                            <td className="py-4 px-6">
                                                <HStack spacing={3}>
                                                    <Center p={2} borderRadius="lg" bg="purple.100">
                                                        <Icon as={FiBriefcase} color="purple.600" boxSize={4} />
                                                    </Center>
                                                    <Text fontWeight="600" color="gray.700">{position.name}</Text>
                                                </HStack>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Switch 
                                                    colorScheme="green" 
                                                    isChecked={position.status === 1} 
                                                    onChange={() => handleToggleStatus(position.id, position.status)}
                                                />
                                                <Badge ml={2} colorScheme={position.status === 1 ? 'green' : 'gray'} borderRadius="full" px={2}>
                                                    {position.status_name}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <HStack spacing={2} justify="center">
                                                    <IconButton
                                                        icon={<FiEdit2 />}
                                                        size="sm"
                                                        variant="ghost"
                                                        colorScheme="blue"
                                                        aria-label="Edit Position"
                                                        onClick={() => handleOpenModal(position)}
                                                    />
                                                    <IconButton
                                                        icon={<FiTrash2 />}
                                                        size="sm"
                                                        variant="ghost"
                                                        colorScheme="red"
                                                        aria-label="Delete Position"
                                                        onClick={() => handleDelete(position.id)}
                                                    />
                                                </HStack>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>
                    </Card>
                )}
            </VStack>

            {/* Create/Edit Modal */}
            <Modal isOpen={isOpen} onClose={handleCloseModal}>
                <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
                <ModalContent borderRadius="xl" boxShadow="xl">
                    <form onSubmit={handleSubmit}>
                        <ModalHeader borderBottomWidth="1px" pb={4}>
                            {editingPosition ? 'Edit Position' : 'Create New Position'}
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody py={6}>
                            <VStack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel fontWeight="600" color="gray.700">Position Name</FormLabel>
                                    <Input
                                        placeholder="e.g. Senior Developer"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        bg="gray.50"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{ borderColor: 'purple.500', boxShadow: 'none', bg: 'white' }}
                                    />
                                </FormControl>
                                <FormControl display="flex" alignItems="center">
                                    <FormLabel htmlFor="status" mb="0" fontWeight="600" color="gray.700">
                                        Active Status
                                    </FormLabel>
                                    <Switch
                                        id="status"
                                        colorScheme="purple"
                                        isChecked={formData.status === 1}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 1 : 0 })}
                                    />
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter borderTopWidth="1px" pt={4} bg="gray.50" borderBottomRadius="xl">
                            <Button variant="ghost" mr={3} onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button colorScheme="purple" type="submit" isLoading={isCreating || isUpdating} loadingText="Saving...">
                                {editingPosition ? 'Update' : 'Create'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </DashboardLayout>
    );
};

export default Positions;
