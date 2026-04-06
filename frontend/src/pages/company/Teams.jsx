import React, { useState } from 'react';
import {
    Box, Button, Flex, HStack, Text, VStack, Heading, Center, Icon,
    useDisclosure, useToast, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
    FormControl, FormLabel, Input, Textarea, Checkbox, CheckboxGroup, Divider,
    SimpleGrid, IconButton, Avatar, AvatarGroup, Tooltip, Badge
} from '@chakra-ui/react';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import {
    useGetTeamsQuery,
    useAddUpdateTeamMutation,
    useDeleteTeamMutation,
    useGetStaffQuery
} from '../../store/apiSlice';

const Teams = () => {
    const { user } = useAuth();
    const companyId = user?.companyId || user?.id;

    const { data: teamsData, isLoading: isLoadingTeams, refetch: refetchTeams } = useGetTeamsQuery();
    const teams = teamsData?.data || [];

    const { data: staffData, isLoading: isLoadingStaff } = useGetStaffQuery(companyId);
    const staffList = staffData?.data || [];

    const [addUpdateTeam, { isLoading: isSaving }] = useAddUpdateTeamMutation();
    const [deleteTeam] = useDeleteTeamMutation();

    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    const [editingTeam, setEditingTeam] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', user_ids: [] });

    const handleOpenModal = (team = null) => {
        if (team) {
            setEditingTeam(team);
            setFormData({
                name: team.name || '',
                description: team.description || '',
                user_ids: team.users?.map(u => u.id.toString()) || []
            });
        } else {
            setEditingTeam(null);
            setFormData({ name: '', description: '', user_ids: [] });
        }
        onOpen();
    };

    const handleCloseModal = () => {
        setEditingTeam(null);
        setFormData({ name: '', description: '', user_ids: [] });
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                id: editingTeam?.id,
                name: formData.name,
                description: formData.description,
                user_ids: formData.user_ids.map(id => parseInt(id, 10))
            };

            await addUpdateTeam(payload).unwrap();
            toast({
                title: editingTeam ? 'Team updated' : 'Team created',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            handleCloseModal();
            refetchTeams();
        } catch (error) {
            toast({
                title: 'Error saving team',
                description: error.data?.message || 'Something went wrong',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this team? Members will not be deleted.')) {
            try {
                await deleteTeam(id).unwrap();
                toast({ title: 'Team deleted successfully', status: 'success', duration: 3000, isClosable: true });
                refetchTeams();
            } catch (error) {
                toast({
                    title: 'Delete failed',
                    description: error.data?.message || 'Failed to delete team.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            }
        }
    };

    const handleUserSelection = (selectedValues) => {
        setFormData(prev => ({ ...prev, user_ids: selectedValues }));
    };

    if (isLoadingTeams || isLoadingStaff) {
        return (
            <DashboardLayout>
                <LoadingSpinner message="Loading teams..." />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>
                {/* Hero Header */}
                <Box bgGradient="linear(135deg, #2b5876 0%, #4e4376 100%)" borderRadius="2xl" p={{ base: 6, md: 8 }} position="relative" overflow="hidden">
                    <Box position="absolute" top="-40px" right="-40px" w="180px" h="180px" borderRadius="full" bg="whiteAlpha.100" />
                    <Box position="absolute" bottom="-20px" left="15%" w="120px" h="120px" borderRadius="full" bg="whiteAlpha.50" />

                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={4} position="relative">
                        <Box>
                            <HStack spacing={3} mb={2}>
                                <Center p={2} bg="whiteAlpha.200" borderRadius="lg" backdropFilter="blur(10px)">
                                    <Icon as={FiUsers} boxSize={6} color="white" />
                                </Center>
                                <Heading size="lg" color="white" letterSpacing="-0.02em">Teams Management</Heading>
                            </HStack>
                            <Text color="whiteAlpha.800" fontSize="sm">Group your staff into distinct teams for localized task assigning and reporting</Text>
                        </Box>

                        <HStack spacing={3}>
                            <Button variant="outline" color="white" _hover={{ bg: 'whiteAlpha.200' }} borderColor="whiteAlpha.300" onClick={refetchTeams} leftIcon={<Icon as={FiRefreshCw} />} size="sm">
                                Refresh
                            </Button>
                            <Button leftIcon={<FiPlus />} size="sm" onClick={() => handleOpenModal()} colorScheme="cyan" bg="cyan.500" color="white" _hover={{ bg: 'cyan.400', transform: 'translateY(-1px)', shadow: 'md' }} transition="all 0.2s">
                                Create New Team
                            </Button>
                        </HStack>
                    </Flex>
                </Box>

                {teams.length === 0 ? (
                    <Card border="1px solid" borderColor="gray.100" shadow="sm">
                        <EmptyState
                            title="No teams found"
                            description="You haven't created any teams yet. Create a team to easily group employees."
                            icon={FiUsers}
                            action={
                                <Button leftIcon={<FiPlus />} onClick={() => handleOpenModal()} mt={4} colorScheme="cyan" color="white">
                                    Create First Team
                                </Button>
                            }
                        />
                    </Card>
                ) : (
                    <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing={6}>
                        {teams.map((team) => (
                            <Card key={team.id} border="1px solid" borderColor="gray.100" shadow="sm" _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} transition="all 0.2s" p={0}>
                                <Box p={6}>
                                    <Flex justify="space-between" align="flex-start" mb={4}>
                                        <VStack align="flex-start" spacing={1}>
                                            <Heading size="md" color="gray.800">{team.name}</Heading>
                                            <Badge colorScheme="cyan" borderRadius="full" px={2} fontSize="xs">
                                                {team.users?.length || 0} Members
                                            </Badge>
                                        </VStack>
                                        <HStack spacing={1}>
                                            <IconButton icon={<FiEdit2 />} size="sm" variant="ghost" colorScheme="blue" onClick={() => handleOpenModal(team)} aria-label="Edit Team" />
                                            <IconButton icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleDelete(team.id)} aria-label="Delete Team" />
                                        </HStack>
                                    </Flex>
                                    
                                    <Text color="gray.600" fontSize="sm" mb={6} noOfLines={2}>
                                        {team.description || "No description provided."}
                                    </Text>

                                    <Box borderTopWidth="1px" borderColor="gray.100" pt={4} mt="auto">
                                        <Text fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={3}>
                                            Team Members
                                        </Text>
                                        {team.users?.length > 0 ? (
                                            <AvatarGroup size="sm" max={6}>
                                                {team.users.map(user => (
                                                    <Tooltip key={user.id} label={`${user.firstName} ${user.lastName}`} hasArrow>
                                                        <Avatar name={`${user.firstName} ${user.lastName}`} src={user.p_image_url} bg="cyan.100" color="cyan.700" />
                                                    </Tooltip>
                                                ))}
                                            </AvatarGroup>
                                        ) : (
                                            <Text fontSize="sm" color="gray.400" fontStyle="italic">No members assigned</Text>
                                        )}
                                    </Box>
                                </Box>
                            </Card>
                        ))}
                    </SimpleGrid>
                )}
            </VStack>

            {/* Create/Edit Modal */}
            <Modal isOpen={isOpen} onClose={handleCloseModal} size="xl">
                <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
                <ModalContent borderRadius="xl" boxShadow="xl">
                    <form onSubmit={handleSubmit}>
                        <ModalHeader borderBottomWidth="1px" pb={4}>
                            {editingTeam ? 'Edit Team' : 'Create New Team'}
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody py={6}>
                            <VStack spacing={6} align="stretch">
                                <FormControl isRequired>
                                    <FormLabel fontWeight="600" color="gray.700">Team Name</FormLabel>
                                    <Input
                                        placeholder="e.g. Frontend Development"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        bg="gray.50"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{ borderColor: 'cyan.500', boxShadow: 'none', bg: 'white' }}
                                    />
                                </FormControl>
                                
                                <FormControl>
                                    <FormLabel fontWeight="600" color="gray.700">Description</FormLabel>
                                    <Textarea
                                        placeholder="Describe the team's purpose..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        bg="gray.50"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{ borderColor: 'cyan.500', boxShadow: 'none', bg: 'white' }}
                                        rows={3}
                                    />
                                </FormControl>

                                <Divider borderColor="gray.100" />

                                <FormControl>
                                    <FormLabel fontWeight="600" color="gray.700" mb={3}>Assign Members</FormLabel>
                                    <Box maxH="300px" overflowY="auto" p={3} borderWidth="1px" borderRadius="md" borderColor="gray.200" bg="gray.50"
                                        sx={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: 'gray.300', borderRadius: '4px' } }}
                                    >
                                        {staffList.length === 0 ? (
                                            <Text fontSize="sm" color="gray.500">No staff available to assign.</Text>
                                        ) : (
                                            <CheckboxGroup colorScheme="cyan" value={formData.user_ids} onChange={handleUserSelection}>
                                                <VStack align="stretch" spacing={3}>
                                                    {staffList.map(staff => (
                                                        <Checkbox key={staff.id} value={staff.id.toString()} bg="white" p={2} borderRadius="md" borderWidth="1px" borderColor="gray.100" shadow="sm">
                                                            <HStack spacing={3}>
                                                                <Avatar size="sm" name={`${staff.firstName} ${staff.lastName}`} src={staff.p_image_url} />
                                                                <VStack align="start" spacing={0}>
                                                                    <Text fontSize="sm" fontWeight="600" color="gray.800">{staff.firstName} {staff.lastName}</Text>
                                                                    <Text fontSize="xs" color="gray.500">{staff.position?.name || 'No Position'}</Text>
                                                                </VStack>
                                                            </HStack>
                                                        </Checkbox>
                                                    ))}
                                                </VStack>
                                            </CheckboxGroup>
                                        )}
                                    </Box>
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter borderTopWidth="1px" pt={4} bg="gray.50" borderBottomRadius="xl">
                            <Button variant="ghost" mr={3} onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button colorScheme="cyan" color="white" type="submit" isLoading={isSaving} loadingText="Saving...">
                                {editingTeam ? 'Update Team' : 'Create Team'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </DashboardLayout>
    );
};

export default Teams;
