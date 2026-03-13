import { Box, Flex, VStack, HStack, Icon, Text, Link as ChakraLink, Avatar, Button, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, IconButton, Badge } from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiUserPlus, FiClock, FiMenu, FiLogOut, FiUserCheck, FiFolder, FiShield, FiInbox } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { getMenuItems } from '../../utils/roleConfig';
import { useLogoutUserMutation } from '../../store/apiSlice';

const Sidebar = ({ isOpen, onClose, isMobile }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [logoutUser, { isLoading: isLoggingOut }] = useLogoutUserMutation();

    // Get menu items based on user role
    const menuItems = getMenuItems(user?.role);

    // Icon mapping
    const iconMap = {
        FiHome: FiHome,
        FiUsers: FiUsers,
        FiUserPlus: FiUserPlus,
        FiClock: FiClock,
        FiUserCheck: FiUserCheck,
        FiFolder: FiFolder,
        FiShield: FiShield,
        FiInbox: FiInbox
    };

    const handleLogout = async () => {
        try {
            await logoutUser().unwrap();
        } catch (error) {
            // Even if API fails, still logout locally
            console.warn('Logout API error:', error);
        }
        logout();
        navigate('/signin');
    };

    const sidebarContent = (
        <VStack h="full" spacing={0} align="stretch">
            {/* Logo */}
            <Box p={6} borderBottomWidth={1}>
                <HStack spacing={3}>
                    <Box w={10} h={10} bg="primary.600" borderRadius="lg" />
                    <Text fontSize="xl" fontWeight="bold" color="gray.800">
                        HR Workforce
                    </Text>
                </HStack>
            </Box>

            {/* User Profile */}
            <Box p={6} borderBottomWidth={1}>
                <HStack spacing={3}>
                    <Avatar size="sm" name={user?.firstName} />
                    <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold" fontSize="sm">
                            {user?.firstName} {user?.lastName}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                            {user?.role}
                        </Text>
                    </VStack>
                </HStack>
            </Box>

            {/* Menu Items */}
            <VStack flex={1} spacing={1} p={4} align="stretch">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const IconComponent = iconMap[item.icon] || FiHome;

                    return (
                        <ChakraLink
                            key={item.path}
                            as={RouterLink}
                            to={item.path}
                            onClick={isMobile ? onClose : undefined}
                            _hover={{ textDecoration: 'none' }}
                        >
                            <HStack
                                px={4}
                                py={3}
                                borderRadius="lg"
                                bg={isActive ? 'primary.50' : 'transparent'}
                                color={isActive ? 'primary.700' : 'gray.700'}
                                _hover={{ bg: isActive ? 'primary.50' : 'gray.100' }}
                                transition="all 0.2s"
                                justify="space-between"
                            >
                                <HStack>
                                    <Icon as={IconComponent} boxSize={5} />
                                    <Text fontWeight={isActive ? 'semibold' : 'medium'}>
                                        {item.label}
                                    </Text>
                                </HStack>
                                {item.badge && (
                                    <Badge colorScheme="orange" fontSize="2xs">
                                        {item.badge}
                                    </Badge>
                                )}
                            </HStack>
                        </ChakraLink>
                    );
                })}
            </VStack>

            {/* Logout Button */}
            <Box p={4} borderTopWidth={1}>
                <Button
                    leftIcon={<FiLogOut />}
                    variant="ghost"
                    w="full"
                    justifyContent="flex-start"
                    onClick={handleLogout}
                    isLoading={isLoggingOut}
                    loadingText="Logging out..."
                >
                    Logout
                </Button>
            </Box>
        </VStack>
    );

    if (isMobile) {
        return (
            <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    {sidebarContent}
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Box
            w="280px"
            h="100vh"
            bg="white"
            borderRightWidth={1}
            position="fixed"
            left={0}
            top={0}
        >
            {sidebarContent}
        </Box>
    );
};

const DashboardLayout = ({ children }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <Flex minH="100vh" bg="gray.50" >
            {/* Desktop Sidebar */}
            <Box display={{ base: 'none', md: 'block' }}>
                <Sidebar isOpen={false} onClose={() => { }} isMobile={false} />
            </Box>

            {/* Mobile Sidebar */}
            <Sidebar isOpen={isOpen} onClose={onClose} isMobile={true} />

            {/* Main Content */}
            <Box flex={1} ml={{ base: 0, md: '280px' }} overflow="auto">
                {/* Mobile Header */}
                <Flex
                    display={{ base: 'flex', md: 'none' }}
                    p={4}
                    bg="white"
                    borderBottomWidth={1}
                    align="center"
                    gap={3}
                >
                    <IconButton
                        icon={<FiMenu />}
                        variant="ghost"
                        onClick={onOpen}
                        aria-label="Open menu"
                    />
                    <Text fontSize="lg" fontWeight="bold">
                        HR Workforce
                    </Text>
                </Flex>

                {/* Page Content */}
                <Box p={{ base: 4, md: 8 }}>
                    {children}
                </Box>
            </Box>
        </Flex>
    );
};

export default DashboardLayout;
