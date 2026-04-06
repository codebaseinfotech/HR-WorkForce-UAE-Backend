import { useState } from 'react';
import {
    Box, Flex, VStack, HStack, Icon, Text, Link as ChakraLink,
    Avatar, Button, useDisclosure, Drawer, DrawerOverlay,
    DrawerContent, DrawerCloseButton, IconButton, Badge,
    useBreakpointValue, Tooltip
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
    FiHome, FiUsers, FiUserPlus, FiClock, FiMenu, FiLogOut,
    FiUserCheck, FiFolder, FiShield, FiInbox, FiCalendar,
    FiChevronLeft, FiChevronRight, FiBriefcase, FiDollarSign, FiMapPin, FiMessageSquare
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { getMenuItems } from '../../utils/roleConfig';
import { useLogoutUserMutation } from '../../store/apiSlice';

const SIDEBAR_WIDTH = '280px';
const SIDEBAR_COLLAPSED_WIDTH = '88px';

const SidebarContent = ({ isMobile, onClose, isCollapsed, toggleCollapse }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [logoutUser, { isLoading: isLoggingOut }] = useLogoutUserMutation();

    const menuItems = getMenuItems(user?.role);

    const iconMap = {
        FiHome, FiUsers, FiUserPlus, FiClock, FiUserCheck,
        FiFolder, FiShield, FiInbox, FiCalendar, FiBriefcase, FiDollarSign, FiMapPin, FiMessageSquare
    };

    const handleLogout = async () => {
        try {
            await logoutUser().unwrap();
        } catch (error) {
            console.warn('Logout API error:', error);
        }
        logout();
        navigate('/signin');
    };

    return (
        <VStack h="full" spacing={0} align="stretch" bg="white" position="relative">
            {/* Toggle Button for Desktop */}
            {!isMobile && (
                <IconButton
                    icon={isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
                    size="sm"
                    position="absolute"
                    top={6}
                    right={-4}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    shadow="sm"
                    borderRadius="full"
                    zIndex={10}
                    onClick={toggleCollapse}
                    aria-label="Toggle Sidebar"
                    _hover={{ bg: 'gray.50' }}
                    color="gray.800"
                />
            )}

            {/* Logo area */}
            <Box p={isCollapsed ? 4 : 6} borderBottomWidth={1} transition="all 0.3s" minH="89px">
                <HStack spacing={3} justify={isCollapsed ? 'center' : 'flex-start'}>
                    <Flex
                        w={10} h={10}
                        bgGradient="linear(to-br, purple.500, blue.500)"
                        borderRadius="xl"
                        align="center" justify="center"
                        shadow="sm"
                        flexShrink={0}
                    >
                        <Text color="white" fontWeight="bold" fontSize="lg">H</Text>
                    </Flex>
                    {!isCollapsed && (
                        <Text fontSize="xl" fontWeight="800" color="gray.800" whiteSpace="nowrap">
                            HR Workforce
                        </Text>
                    )}
                </HStack>
            </Box>

            {/* User Profile area */}
            <Box p={isCollapsed ? 4 : 6} borderBottomWidth={1} transition="all 0.3s">
                <HStack spacing={4} justify={isCollapsed ? 'center' : 'flex-start'}>
                    <Avatar size={isCollapsed ? 'sm' : 'md'} name={user?.firstName} src={user?.p_image_url} bg="purple.100" color="purple.600" />
                    {!isCollapsed && (
                        <VStack align="start" spacing={0} overflow="hidden">
                            <Text fontWeight="bold" fontSize="sm" color="gray.800" isTruncated w="160px">
                                {user?.firstName} {user?.lastName}
                            </Text>
                            <Badge colorScheme="purple" fontSize="2xs" borderRadius="full">
                                {user?.role}
                            </Badge>
                        </VStack>
                    )}
                </HStack>
            </Box>

            {/* Menu Items */}
            <VStack flex={1} spacing={2} p={isCollapsed ? 3 : 4} align="stretch" overflowY="auto"
                sx={{
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-thumb': { background: 'gray.200', borderRadius: '4px' },
                }}
            >
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const IconComponent = iconMap[item.icon] || FiHome;

                    const LinkContent = (
                        <HStack
                            px={isCollapsed ? 0 : 4}
                            py={3}
                            borderRadius="xl"
                            bg={isActive ? 'purple.50' : 'transparent'}
                            color={isActive ? 'purple.600' : 'gray.600'}
                            _hover={{ bg: isActive ? 'purple.50' : 'gray.50', color: isActive ? 'purple.700' : 'gray.800' }}
                            transition="all 0.2s"
                            justify={isCollapsed ? 'center' : 'flex-start'}
                            position="relative"
                        >
                            {isActive && !isCollapsed && (
                                <Box position="absolute" left={0} top="15%" bottom="15%" w="4px" bg="purple.500" borderRightRadius="md" />
                            )}
                            <Icon as={IconComponent} boxSize={5} />
                            {!isCollapsed && (
                                <Text fontWeight={isActive ? '700' : '500'} fontSize="sm" flex={1}>
                                    {item.label}
                                </Text>
                            )}
                            {!isCollapsed && item.badge && (
                                <Badge colorScheme="orange" fontSize="2xs" borderRadius="full">
                                    {item.badge}
                                </Badge>
                            )}
                            {/* Dot indicator for badges when collapsed */}
                            {isCollapsed && item.badge && (
                                <Box position="absolute" top={2} right={2} w={2} h={2} bg="orange.400" borderRadius="full" />
                            )}
                        </HStack>
                    );

                    return (
                        <ChakraLink
                            key={item.path}
                            as={RouterLink}
                            to={item.path}
                            onClick={isMobile ? onClose : undefined}
                            _hover={{ textDecoration: 'none' }}
                        >
                            {isCollapsed ? (
                                <Tooltip label={item.label} placement="right" hasArrow>
                                    <Box>{LinkContent}</Box>
                                </Tooltip>
                            ) : (
                                LinkContent
                            )}
                        </ChakraLink>
                    );
                })}
            </VStack>

            {/* Logout Button */}
            <Box p={isCollapsed ? 3 : 4} borderTopWidth={1}>
                <Tooltip label={isCollapsed ? 'Logout' : ''} placement="right" hasArrow isDisabled={!isCollapsed}>
                    <Button
                        variant={isCollapsed ? 'ghost' : 'outline'}
                        colorScheme="red"
                        w="full"
                        px={isCollapsed ? 0 : 4}
                        justifyContent={isCollapsed ? 'center' : 'flex-start'}
                        onClick={handleLogout}
                        isLoading={isLoggingOut}
                        loadingText={isCollapsed ? '' : "Logging out..."}
                    >
                        <Icon as={FiLogOut} boxSize={5} mr={isCollapsed ? 0 : 2} />
                        {!isCollapsed && <Text>Logout</Text>}
                    </Button>
                </Tooltip>
            </Box>
        </VStack>
    );
};

const DashboardLayout = ({ children }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    
    // Auto-collapse on tablet (md to lg)
    const isTablet = useBreakpointValue({ base: false, md: true, lg: false });
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [prevIsTablet, setPrevIsTablet] = useState(isTablet);

    // Sync state when breakpoint changes
    if (isTablet !== prevIsTablet) {
        setPrevIsTablet(isTablet);
        setIsCollapsed(!!isTablet);
    }

    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    const currentSidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

    return (
        <Flex minH="100vh" bg="gray.50" overflow="hidden" maxW="100vw">
            {/* Desktop Sidebar (Fixed) */}
            <Box
                display={{ base: 'none', md: 'block' }}
                w={currentSidebarWidth}
                h="100vh"
                borderRightWidth={1}
                borderColor="gray.200"
                position="fixed"
                left={0}
                top={0}
                transition="width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                zIndex={20}
            >
                <SidebarContent
                    isMobile={false}
                    isCollapsed={isCollapsed}
                    toggleCollapse={toggleCollapse}
                />
            </Box>

            {/* Mobile Sidebar (Drawer) */}
            <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
                <DrawerOverlay bg="blackAlpha.400" backdropFilter="blur(2px)" />
                <DrawerContent maxW="280px">
                    <DrawerCloseButton zIndex={20} />
                    <SidebarContent
                        isMobile={true}
                        isCollapsed={false}
                        onClose={onClose}
                    />
                </DrawerContent>
            </Drawer>

            {/* Main Content Area */}
            <Box
                flex={1}
                ml={{ base: 0, md: currentSidebarWidth }}
                transition="margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                display="flex"
                flexDirection="column"
                minH="100vh"
                maxW={{ base: '100vw', md: `calc(100vw - ${currentSidebarWidth})` }}
                overflowX="hidden"
            >
                {/* Mobile Header */}
                <Flex
                    display={{ base: 'flex', md: 'none' }}
                    p={4}
                    bg="white"
                    borderBottomWidth={1}
                    borderColor="gray.100"
                    align="center"
                    gap={3}
                    position="sticky"
                    top={0}
                    zIndex={10}
                    shadow="sm"
                >
                    <IconButton
                        icon={<FiMenu />}
                        variant="ghost"
                        onClick={onOpen}
                        aria-label="Open menu"
                    />
                    <Text fontSize="lg" fontWeight="800" color="gray.800">
                        HR Workforce
                    </Text>
                </Flex>

                {/* Page Content */}
                <Box p={{ base: 4, md: 6, lg: 8 }} flex={1} w="full" maxW="100%" overflowX="hidden">
                    {children}
                </Box>
            </Box>
        </Flex>
    );
};

export default DashboardLayout;
