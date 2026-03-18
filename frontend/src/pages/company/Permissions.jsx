import { useState, useMemo } from 'react';
import {
    Box,
    VStack,
    HStack,
    Heading,
    Text,
    Button,
    Icon,
    Checkbox,
    useToast,
    Badge,
    Flex,
    Grid,
    GridItem,
} from '@chakra-ui/react';
import {
    FiArrowLeft,
    FiSave,
    FiShield,
    FiEye,
    FiPlus,
    FiEdit3,
    FiTrash2,
    FiCheck,
    FiCheckSquare,
    FiXSquare,
} from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
    useGetRolesQuery,
    useGetPermissionsQuery,
    useSaveRolePermissionsMutation,
} from '../../store/apiSlice';

const ACTIONS = ['can_view', 'can_add', 'can_edit', 'can_delete'];
const ACTION_CONFIG = {
    can_view: { label: 'View', icon: FiEye, gradient: 'linear(to-br, blue.400, blue.600)', bg: 'blue.50', color: 'blue.600', ring: 'blue.200' },
    can_add: { label: 'Add', icon: FiPlus, gradient: 'linear(to-br, green.400, green.600)', bg: 'green.50', color: 'green.600', ring: 'green.200' },
    can_edit: { label: 'Edit', icon: FiEdit3, gradient: 'linear(to-br, orange.400, orange.600)', bg: 'orange.50', color: 'orange.600', ring: 'orange.200' },
    can_delete: { label: 'Delete', icon: FiTrash2, gradient: 'linear(to-br, red.400, red.600)', bg: 'red.50', color: 'red.600', ring: 'red.200' },
};

const Permissions = () => {
    const { roleId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const { data: roles = [], isLoading: rolesLoading } = useGetRolesQuery();
    const { data: permissionsResponse, isLoading: permsLoading } = useGetPermissionsQuery();
    const [saveRolePermissions, { isLoading: isSaving }] = useSaveRolePermissionsMutation();

    const role = roles.find(r => r.id === parseInt(roleId));
    const allPermissions = useMemo(() => permissionsResponse?.data || [], [permissionsResponse]);

    const permissionModules = useMemo(() => {
        const grouped = {};
        allPermissions.forEach(perm => {
            const menu = perm.menu || 'Other';
            if (!grouped[menu]) grouped[menu] = [];
            grouped[menu].push(perm);
        });
        return Object.entries(grouped).map(([module, permissions]) => ({ module, permissions }));
    }, [allPermissions]);

    const initialState = useMemo(() => {
        const state = {};
        allPermissions.forEach(perm => {
            const assigned = role?.permissions?.find(rp => rp.id === perm.id);
            state[perm.id] = assigned?.pivot
                ? { can_view: !!assigned.pivot.can_view, can_add: !!assigned.pivot.can_add, can_edit: !!assigned.pivot.can_edit, can_delete: !!assigned.pivot.can_delete }
                : { can_view: false, can_add: false, can_edit: false, can_delete: false };
        });
        return state;
    }, [allPermissions, role]);

    const [permState, setPermState] = useState({});

    const mergedState = useMemo(() => {
        const result = {};
        Object.keys(initialState).forEach(id => {
            result[id] = { ...initialState[id], ...(permState[id] || {}) };
        });
        return result;
    }, [initialState, permState]);

    const toggleAction = (permId, action) => {
        setPermState(prev => ({
            ...prev,
            [permId]: { ...(prev[permId] || {}), [action]: !(mergedState[permId]?.[action] ?? false) },
        }));
    };

    const toggleAllActions = (permId) => {
        const current = mergedState[permId] || {};
        const allChecked = ACTIONS.every(a => current[a]);
        setPermState(prev => ({
            ...prev,
            [permId]: ACTIONS.reduce((acc, a) => ({ ...acc, [a]: !allChecked }), {}),
        }));
    };

    const toggleModule = (module) => {
        const ids = module.permissions.map(p => p.id);
        const allFullyChecked = ids.every(id => ACTIONS.every(a => mergedState[id]?.[a]));
        setPermState(prev => {
            const next = { ...prev };
            ids.forEach(id => {
                next[id] = ACTIONS.reduce((acc, a) => ({ ...acc, [a]: !allFullyChecked }), {});
            });
            return next;
        });
    };

    const selectAll = () => {
        const all = {};
        allPermissions.forEach(p => { all[p.id] = ACTIONS.reduce((acc, a) => ({ ...acc, [a]: true }), {}); });
        setPermState(all);
    };

    const deselectAll = () => {
        const none = {};
        allPermissions.forEach(p => { none[p.id] = ACTIONS.reduce((acc, a) => ({ ...acc, [a]: false }), {}); });
        setPermState(none);
    };

    const totalSelected = useMemo(() => {
        let count = 0;
        Object.values(mergedState).forEach(actions => { if (ACTIONS.some(a => actions[a])) count++; });
        return count;
    }, [mergedState]);

    const totalCheckboxes = useMemo(() => {
        let count = 0;
        Object.values(mergedState).forEach(actions => { ACTIONS.forEach(a => { if (actions[a]) count++; }); });
        return count;
    }, [mergedState]);

    const handleSave = async () => {
        const permissions = [];
        Object.entries(mergedState).forEach(([permId, actions]) => {
            if (ACTIONS.some(a => actions[a])) {
                permissions.push({
                    permission_id: parseInt(permId),
                    can_view: actions.can_view,
                    can_add: actions.can_add,
                    can_edit: actions.can_edit,
                    can_delete: actions.can_delete,
                });
            }
        });

        try {
            await saveRolePermissions({ roleId: parseInt(roleId), permissions }).unwrap();
            toast({ title: 'Permissions Saved', description: `${permissions.length} permissions updated for "${role?.name}"`, status: 'success', duration: 4000, isClosable: true });
            setPermState({});
        } catch (error) {
            toast({ title: 'Save failed', description: error.data?.message || 'Failed to save permissions', status: 'error', duration: 5000, isClosable: true });
        }
    };

    if (rolesLoading || permsLoading) {
        return (<DashboardLayout><LoadingSpinner message="Loading permissions..." /></DashboardLayout>);
    }

    if (!role) {
        return (
            <DashboardLayout>
                <Flex justify="center" align="center" minH="60vh">
                    <VStack spacing={5} bg="white" p={10} borderRadius="2xl" shadow="xl" textAlign="center">
                        <Box p={4} borderRadius="full" bg="red.50">
                            <Icon as={FiShield} boxSize={10} color="red.400" />
                        </Box>
                        <Heading size="md" color="gray.700">Role Not Found</Heading>
                        <Text color="gray.500" fontSize="sm">The role you&apos;re looking for doesn&apos;t exist</Text>
                        <Button onClick={() => navigate('/company/roles')} leftIcon={<FiArrowLeft />} variant="outline" borderRadius="xl">
                            Back to Roles
                        </Button>
                    </VStack>
                </Flex>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={0}>
                {/* Hero Header */}
                <Box
                    bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    borderRadius="3xl"
                    p={{ base: 6, md: 8 }}
                    mb={6}
                    position="relative"
                    overflow="hidden"
                    boxShadow="xl"
                >
                    {/* Decorative elements */}
                    <Box position="absolute" top="-20%" right="-5%" w="300px" h="300px" bg="purple.500" opacity="0.1" filter="blur(60px)" borderRadius="full" />
                    <Box position="absolute" bottom="-20%" left="10%" w="200px" h="200px" bg="blue.500" opacity="0.1" filter="blur(40px)" borderRadius="full" />
                    <Box position="absolute" top="10%" right="15%" w="100px" h="100px" bg="cyan.500" opacity="0.15" filter="blur(30px)" borderRadius="full" />

                    <Button
                        variant="unstyled"
                        display="flex"
                        alignItems="center"
                        gap={2}
                        color="whiteAlpha.800"
                        fontSize="sm"
                        fontWeight="medium"
                        mb={4}
                        _hover={{ color: 'white' }}
                        onClick={() => navigate('/company/roles')}
                        h="auto"
                    >
                        <Icon as={FiArrowLeft} boxSize={4} />
                        Back to Roles
                    </Button>

                    <Flex justify="space-between" align="flex-end" flexWrap="wrap" gap={4} position="relative">
                        <Box>
                            <HStack spacing={3} mb={2}>
                                <Box p={2.5} bg="whiteAlpha.200" borderRadius="xl" backdropFilter="blur(10px)">
                                    <Icon as={FiShield} boxSize={6} color="white" />
                                </Box>
                                <Badge bg="whiteAlpha.200" color="white" fontSize="xs" px={3} py={1} borderRadius="full" fontWeight="600">
                                    {role.name}
                                </Badge>
                            </HStack>
                            <Heading size="xl" color="white" mb={1} letterSpacing="-0.02em">
                                Manage Permissions
                            </Heading>
                            <Text color="whiteAlpha.800" fontSize="md">
                                Configure access controls for the <strong>{role.name}</strong> role
                            </Text>
                        </Box>

                        {/* Stats Pills */}
                        <HStack spacing={3} flexWrap="wrap">
                            <Box bg="whiteAlpha.200" backdropFilter="blur(10px)" px={4} py={2} borderRadius="xl">
                                <Text fontSize="2xl" fontWeight="bold" color="white" lineHeight="1">{totalSelected}</Text>
                                <Text fontSize="xs" color="whiteAlpha.700">Modules</Text>
                            </Box>
                            <Box bg="whiteAlpha.200" backdropFilter="blur(10px)" px={4} py={2} borderRadius="xl">
                                <Text fontSize="2xl" fontWeight="bold" color="white" lineHeight="1">{totalCheckboxes}</Text>
                                <Text fontSize="xs" color="whiteAlpha.700">Actions</Text>
                            </Box>
                            <Box bg="whiteAlpha.200" backdropFilter="blur(10px)" px={4} py={2} borderRadius="xl">
                                <Text fontSize="2xl" fontWeight="bold" color="white" lineHeight="1">{allPermissions.length}</Text>
                                <Text fontSize="xs" color="whiteAlpha.700">Total</Text>
                            </Box>
                        </HStack>
                    </Flex>
                </Box>

                {/* Action Bar */}
                <HStack
                    bg="white"
                    px={5}
                    py={3}
                    borderRadius="xl"
                    shadow="sm"
                    border="1px solid"
                    borderColor="gray.100"
                    justify="space-between"
                    mb={6}
                    flexWrap="wrap"
                    gap={2}
                >
                    <HStack spacing={2}>
                        <Button
                            leftIcon={<FiCheckSquare />}
                            size="sm"
                            variant="ghost"
                            colorScheme="green"
                            onClick={selectAll}
                            fontWeight="500"
                            borderRadius="lg"
                        >
                            Select All
                        </Button>
                        <Box w="1px" h="20px" bg="gray.200" />
                        <Button
                            leftIcon={<FiXSquare />}
                            size="sm"
                            variant="ghost"
                            colorScheme="gray"
                            onClick={deselectAll}
                            fontWeight="500"
                            borderRadius="lg"
                        >
                            Clear All
                        </Button>
                    </HStack>
                    <Button
                        leftIcon={<FiSave />}
                        size="md"
                        isLoading={isSaving}
                        loadingText="Saving..."
                        onClick={handleSave}
                        bg="gray.900"
                        color="white"
                        _hover={{ bg: 'gray.800', transform: 'translateY(-1px)', shadow: 'lg' }}
                        _active={{ transform: 'translateY(0)' }}
                        transition="all 0.2s"
                        borderRadius="xl"
                        px={6}
                        fontWeight="600"
                    >
                        Save Changes
                    </Button>
                </HStack>

                {/* Permission Modules */}
                {permissionModules.length === 0 ? (
                    <Flex justify="center" py={16}>
                        <VStack spacing={4} textAlign="center">
                            <Box p={5} borderRadius="2xl" bg="gray.50">
                                <Icon as={FiShield} boxSize={12} color="gray.300" />
                            </Box>
                            <Text color="gray.500" fontWeight="medium">No permissions available</Text>
                        </VStack>
                    </Flex>
                ) : (
                    <VStack align="stretch" spacing={5}>
                        {permissionModules.map((module) => {
                            const ids = module.permissions.map(p => p.id);
                            const allFullyChecked = ids.every(id => ACTIONS.every(a => mergedState[id]?.[a]));
                            const someChecked = ids.some(id => ACTIONS.some(a => mergedState[id]?.[a])) && !allFullyChecked;
                            const enabledCount = ids.filter(id => ACTIONS.some(a => mergedState[id]?.[a])).length;

                            return (
                                <Box
                                    key={module.module}
                                    bg="white"
                                    borderRadius="xl"
                                    border="1px solid"
                                    borderColor={allFullyChecked ? 'purple.200' : 'gray.100'}
                                    overflow="hidden"
                                    shadow="sm"
                                    transition="all 0.25s"
                                    _hover={{ shadow: 'md', borderColor: allFullyChecked ? 'purple.300' : 'gray.200' }}
                                >
                                    {/* Module Header */}
                                    <Flex
                                        px={5}
                                        py={4}
                                        bgGradient={allFullyChecked ? 'linear(to-r, purple.50, blue.50)' : 'linear(to-r, gray.50, white)'}
                                        borderBottom="1px solid"
                                        borderColor={allFullyChecked ? 'purple.100' : 'gray.100'}
                                        align="center"
                                        justify="space-between"
                                    >
                                        <HStack spacing={3}>
                                            <Box
                                                p={2}
                                                borderRadius="lg"
                                                bgGradient={allFullyChecked ? 'linear(to-br, purple.500, blue.500)' : 'linear(to-br, gray.200, gray.300)'}
                                            >
                                                <Icon as={FiShield} boxSize={4} color="white" />
                                            </Box>
                                            <Box>
                                                <Text fontWeight="700" fontSize="sm" color="gray.800" letterSpacing="-0.01em">
                                                    {module.module}
                                                </Text>
                                                <Text fontSize="xs" color="gray.500">
                                                    {enabledCount} of {ids.length} enabled
                                                </Text>
                                            </Box>
                                        </HStack>
                                        <HStack spacing={3}>
                                            <Badge
                                                fontSize="xs"
                                                px={2.5}
                                                py={0.5}
                                                borderRadius="full"
                                                bg={allFullyChecked ? 'purple.100' : 'gray.100'}
                                                color={allFullyChecked ? 'purple.700' : 'gray.600'}
                                                fontWeight="600"
                                            >
                                                {module.permissions.length} {module.permissions.length === 1 ? 'permission' : 'permissions'}
                                            </Badge>
                                            <Checkbox
                                                isChecked={allFullyChecked}
                                                isIndeterminate={someChecked}
                                                colorScheme="purple"
                                                size="lg"
                                                onChange={() => toggleModule(module)}
                                            />
                                        </HStack>
                                    </Flex>

                                    {/* Action Labels Header */}
                                    <Grid
                                        templateColumns={{ base: '1fr', md: '50px 1fr 1fr repeat(4, 80px) 60px' }}
                                        px={5}
                                        py={2}
                                        bg="gray.50"
                                        borderBottom="1px solid"
                                        borderColor="gray.100"
                                        display={{ base: 'none', md: 'grid' }}
                                        alignItems="center"
                                        gap={2}
                                    >
                                        <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="wider">ID</Text>
                                        <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="wider">Name</Text>
                                        <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="wider">Slug</Text>
                                        {ACTIONS.map(action => (
                                            <Text
                                                key={action}
                                                fontSize="xs"
                                                fontWeight="700"
                                                color={ACTION_CONFIG[action].color}
                                                textTransform="uppercase"
                                                letterSpacing="wider"
                                                textAlign="center"
                                            >
                                                {ACTION_CONFIG[action].label}
                                            </Text>
                                        ))}
                                        <Text fontSize="xs" fontWeight="700" color="purple.500" textTransform="uppercase" letterSpacing="wider" textAlign="center">All</Text>
                                    </Grid>

                                    {/* Permission Rows */}
                                    <VStack align="stretch" spacing={0}>
                                        {module.permissions.map((perm, idx) => {
                                            const state = mergedState[perm.id] || {};
                                            const allActions = ACTIONS.every(a => state[a]);
                                            const someActions = ACTIONS.some(a => state[a]) && !allActions;
                                            const hasAny = ACTIONS.some(a => state[a]);

                                            return (
                                                <Box key={perm.id}>
                                                    {/* Desktop Row */}
                                                    <Grid
                                                        templateColumns={{ base: '1fr', md: '50px 1fr 1fr repeat(4, 80px) 60px' }}
                                                        px={5}
                                                        py={3.5}
                                                        alignItems="center"
                                                        gap={2}
                                                        bg={hasAny ? 'linear-gradient(90deg, rgba(233,245,233,0.5) 0%, rgba(255,255,255,0) 100%)' : 'white'}
                                                        borderBottom={idx < module.permissions.length - 1 ? '1px solid' : 'none'}
                                                        borderColor="gray.50"
                                                        _hover={{ bg: hasAny ? 'green.50' : 'gray.50' }}
                                                        transition="background 0.15s"
                                                        display={{ base: 'none', md: 'grid' }}
                                                    >
                                                        <Text fontSize="xs" color="gray.400" fontWeight="600" fontFamily="mono">
                                                            {perm.id}
                                                        </Text>
                                                        <HStack spacing={2}>
                                                            {hasAny && <Icon as={FiCheck} color="green.500" boxSize={3.5} />}
                                                            <Text
                                                                fontSize="sm"
                                                                fontWeight={hasAny ? '600' : '400'}
                                                                color={hasAny ? 'gray.800' : 'gray.600'}
                                                            >
                                                                {perm.name}
                                                            </Text>
                                                        </HStack>
                                                        <Badge
                                                            variant="subtle"
                                                            bg="gray.100"
                                                            color="gray.600"
                                                            fontSize="xs"
                                                            fontFamily="mono"
                                                            px={2}
                                                            py={0.5}
                                                            borderRadius="md"
                                                            fontWeight="500"
                                                            w="fit-content"
                                                        >
                                                            {perm.slug}
                                                        </Badge>
                                                        {ACTIONS.map(action => {
                                                            const cfg = ACTION_CONFIG[action];
                                                            const isChecked = !!state[action];
                                                            return (
                                                                <Flex key={action} justify="center">
                                                                    <Box
                                                                        cursor="pointer"
                                                                        onClick={() => toggleAction(perm.id, action)}
                                                                        p={1.5}
                                                                        borderRadius="lg"
                                                                        bg={isChecked ? cfg.bg : 'transparent'}
                                                                        border="2px solid"
                                                                        borderColor={isChecked ? cfg.ring : 'transparent'}
                                                                        transition="all 0.2s"
                                                                        _hover={{ bg: cfg.bg, transform: 'scale(1.05)' }}
                                                                    >
                                                                        <Checkbox
                                                                            isChecked={isChecked}
                                                                            colorScheme={action === 'can_view' ? 'blue' : action === 'can_add' ? 'green' : action === 'can_edit' ? 'orange' : 'red'}
                                                                            size="lg"
                                                                            onChange={() => toggleAction(perm.id, action)}
                                                                            pointerEvents="none"
                                                                        />
                                                                    </Box>
                                                                </Flex>
                                                            );
                                                        })}
                                                        <Flex justify="center">
                                                            <Checkbox
                                                                isChecked={allActions}
                                                                isIndeterminate={someActions}
                                                                colorScheme="purple"
                                                                size="lg"
                                                                onChange={() => toggleAllActions(perm.id)}
                                                            />
                                                        </Flex>
                                                    </Grid>

                                                    {/* Mobile Card */}
                                                    <Box
                                                        display={{ base: 'block', md: 'none' }}
                                                        px={4}
                                                        py={4}
                                                        borderBottom={idx < module.permissions.length - 1 ? '1px solid' : 'none'}
                                                        borderColor="gray.100"
                                                        bg={hasAny ? 'green.50' : 'white'}
                                                    >
                                                        <HStack justify="space-between" mb={3}>
                                                            <VStack align="start" spacing={0}>
                                                                <HStack spacing={2}>
                                                                    <Text fontSize="xs" color="gray.400" fontFamily="mono"># {perm.id}</Text>
                                                                    {hasAny && <Icon as={FiCheck} color="green.500" boxSize={3} />}
                                                                </HStack>
                                                                <Text fontSize="sm" fontWeight={hasAny ? '600' : '400'} color="gray.800">
                                                                    {perm.name}
                                                                </Text>
                                                                <Text fontSize="xs" color="gray.400" fontFamily="mono">{perm.slug}</Text>
                                                            </VStack>
                                                            <Checkbox
                                                                isChecked={allActions}
                                                                isIndeterminate={someActions}
                                                                colorScheme="purple"
                                                                size="lg"
                                                                onChange={() => toggleAllActions(perm.id)}
                                                            />
                                                        </HStack>
                                                        <Grid templateColumns="repeat(4, 1fr)" gap={2}>
                                                            {ACTIONS.map(action => {
                                                                const cfg = ACTION_CONFIG[action];
                                                                const isChecked = !!state[action];
                                                                return (
                                                                    <GridItem key={action}>
                                                                        <Flex
                                                                            direction="column"
                                                                            align="center"
                                                                            gap={1}
                                                                            p={2}
                                                                            borderRadius="lg"
                                                                            bg={isChecked ? cfg.bg : 'gray.50'}
                                                                            border="1px solid"
                                                                            borderColor={isChecked ? cfg.ring : 'gray.100'}
                                                                            cursor="pointer"
                                                                            onClick={() => toggleAction(perm.id, action)}
                                                                            transition="all 0.2s"
                                                                        >
                                                                            <Icon as={cfg.icon} boxSize={3.5} color={isChecked ? cfg.color : 'gray.400'} />
                                                                            <Text fontSize="xs" fontWeight="600" color={isChecked ? cfg.color : 'gray.500'}>
                                                                                {cfg.label}
                                                                            </Text>
                                                                            <Checkbox
                                                                                isChecked={isChecked}
                                                                                colorScheme={action === 'can_view' ? 'blue' : action === 'can_add' ? 'green' : action === 'can_edit' ? 'orange' : 'red'}
                                                                                size="md"
                                                                                onChange={() => toggleAction(perm.id, action)}
                                                                                pointerEvents="none"
                                                                            />
                                                                        </Flex>
                                                                    </GridItem>
                                                                );
                                                            })}
                                                        </Grid>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </VStack>
                                </Box>
                            );
                        })}
                    </VStack>
                )}

                {/* Sticky Bottom Bar */}
                <Box
                    position="sticky"
                    bottom={4}
                    mt={6}
                    bg="white"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.200"
                    shadow="xl"
                    px={6}
                    py={4}
                >
                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                        <HStack spacing={3}>
                            <Box p={2} borderRadius="lg" bgGradient="linear(to-br, purple.500, blue.500)">
                                <Icon as={FiShield} boxSize={4} color="white" />
                            </Box>
                            <Box>
                                <Text fontSize="sm" fontWeight="600" color="gray.800">
                                    {totalSelected} permissions · {totalCheckboxes} actions
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                    for <strong>{role.name}</strong> role
                                </Text>
                            </Box>
                        </HStack>
                        <HStack spacing={3}>
                            <Button
                                variant="outline"
                                borderRadius="xl"
                                onClick={() => navigate('/company/roles')}
                                fontWeight="500"
                            >
                                Cancel
                            </Button>
                            <Button
                                leftIcon={<FiSave />}
                                isLoading={isSaving}
                                loadingText="Saving..."
                                onClick={handleSave}
                                bg="gray.900"
                                color="white"
                                _hover={{ bg: 'gray.800', transform: 'translateY(-1px)', shadow: 'lg' }}
                                _active={{ transform: 'translateY(0)' }}
                                transition="all 0.2s"
                                borderRadius="xl"
                                px={6}
                                fontWeight="600"
                            >
                                Save Changes
                            </Button>
                        </HStack>
                    </Flex>
                </Box>
            </VStack>
        </DashboardLayout>
    );
};

export default Permissions;
