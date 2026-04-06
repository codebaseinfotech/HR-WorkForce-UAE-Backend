import React from 'react';
import {
    Box, Button, Flex, HStack, Text, VStack, Heading, Center, Icon,
    Badge, IconButton, Avatar, Tooltip, SimpleGrid
} from '@chakra-ui/react';
import { FiMapPin, FiRefreshCw, FiExternalLink, FiNavigation, FiClock, FiAlertCircle, FiUsers } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useGetStaffQuery } from '../../store/apiSlice';

const LiveLocation = () => {
    const { user } = useAuth();
    const companyId = user?.companyId || user?.id;

    // const { data: locationsData, isLoading: isLoadingLocations, refetch, isFetching } = useGetCompanyLiveLocationsQuery(companyId, { skip: !companyId });
    const locations = [];

    const { data: staffData, isLoading: isLoadingStaff } = useGetStaffQuery(companyId, { skip: !companyId });
    const staffList = staffData?.data || [];

    const getStaffDetails = (userId) => {
        return staffList.find(s => s.id === parseInt(userId, 10));
    };

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return 'Unknown';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs} hours ago`;
        
        return date.toLocaleDateString();
    };

    const isStale = (dateStr) => {
        if (!dateStr) return true;
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        // Consider stale if older than 30 minutes
        return diffMs > 30 * 60000;
    };

    if (isLoadingStaff) {
        return (
            <DashboardLayout>
                <LoadingSpinner message="Locating staff..." />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>
                {/* Hero Header */}
                <Box bgGradient="linear(135deg, #43e97b 0%, #38f9d7 100%)" borderRadius="2xl" p={{ base: 6, md: 8 }} position="relative" overflow="hidden">
                    <Box position="absolute" top="-40px" right="-40px" w="180px" h="180px" borderRadius="full" bg="blackAlpha.100" />
                    <Box position="absolute" bottom="-20px" left="15%" w="120px" h="120px" borderRadius="full" bg="blackAlpha.100" />

                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={4} position="relative">
                        <Box>
                            <HStack spacing={3} mb={2}>
                                <Center p={2} bg="blackAlpha.200" borderRadius="lg" backdropFilter="blur(10px)">
                                    <Icon as={FiMapPin} boxSize={6} color="teal.900" />
                                </Center>
                                <Heading size="lg" color="teal.900" letterSpacing="-0.02em">Live Location Monitor</Heading>
                            </HStack>
                            <Text color="teal.800" fontSize="sm" fontWeight="500">Track the real-time location of field agents and on-duty staff</Text>
                        </Box>

                        <HStack spacing={3}>
                            <Button 
                                variant="solid" 
                                colorScheme="teal" 
                                bg="teal.900" 
                                color="white"
                                _hover={{ bg: 'teal.800', shadow: 'md' }}
                                // onClick={refetch} 
                                leftIcon={<Icon as={FiRefreshCw} />} 
                                // isLoading={isFetching}
                                loadingText="Refreshing"
                                size="sm"
                            >
                                Refresh Map Data
                            </Button>
                        </HStack>
                    </Flex>
                </Box>

                {/* Summary Stats */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    <Card border="1px solid" borderColor="gray.100" shadow="sm" p={5}>
                        <VStack align="start" spacing={1}>
                            <HStack color="gray.500" spacing={2} mb={1}>
                                <Icon as={FiUsers} />
                                <Text fontSize="sm" fontWeight="600" textTransform="uppercase">Active Trackers</Text>
                            </HStack>
                            <Heading size="xl" color="teal.600">{locations.length}</Heading>
                        </VStack>
                    </Card>
                    <Card border="1px solid" borderColor="gray.100" shadow="sm" p={5}>
                        <VStack align="start" spacing={1}>
                            <HStack color="gray.500" spacing={2} mb={1}>
                                <Icon as={FiNavigation} />
                                <Text fontSize="sm" fontWeight="600" textTransform="uppercase">Inside Work Radius</Text>
                            </HStack>
                            <Heading size="xl" color="green.500">{locations.filter(l => l.is_inside_radius).length}</Heading>
                        </VStack>
                    </Card>
                    <Card border="1px solid" borderColor="gray.100" shadow="sm" p={5}>
                        <VStack align="start" spacing={1}>
                            <HStack color="gray.500" spacing={2} mb={1}>
                                <Icon as={FiAlertCircle} />
                                <Text fontSize="sm" fontWeight="600" textTransform="uppercase">Offline / Stale</Text>
                            </HStack>
                            <Heading size="xl" color="red.500">{locations.filter(l => isStale(l.tracked_at)).length}</Heading>
                        </VStack>
                    </Card>
                </SimpleGrid>

                {locations.length === 0 ? (
                    <Card border="1px solid" borderColor="gray.100" shadow="sm">
                        <EmptyState
                            title="No Active Locations"
                            description="No employees are currently broadcasting their live location."
                            icon={FiMapPin}
                        />
                    </Card>
                ) : (
                    <Card p={0} overflow="hidden" border="1px solid" borderColor="gray.100" shadow="sm">
                        <Box overflowX="auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr>
                                        <th className="bg-teal-50 text-teal-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap">Employee</th>
                                        <th className="bg-teal-50 text-teal-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap">Zone Status</th>
                                        <th className="bg-teal-50 text-teal-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap">Coordinates</th>
                                        <th className="bg-teal-50 text-teal-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap">Last Ping</th>
                                        <th className="bg-teal-50 text-teal-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {locations.map((loc) => {
                                        const staff = getStaffDetails(loc.user_id);
                                        const stale = isStale(loc.tracked_at);
                                        const lat = parseFloat(loc.latitude).toFixed(4);
                                        const lng = parseFloat(loc.longitude).toFixed(4);

                                        return (
                                            <tr key={loc.id} className="hover:bg-teal-50/50 transition-colors duration-150 odd:bg-white even:bg-gray-50">
                                                <td className="py-4 px-6">
                                                    <HStack spacing={3}>
                                                        <Avatar size="sm" name={staff ? `${staff.firstName} ${staff.lastName}` : `User ${loc.user_id}`} src={staff?.p_image_url} />
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontWeight="600" color="gray.800">{staff ? `${staff.firstName} ${staff.lastName}` : `User #${loc.user_id}`}</Text>
                                                            <Text fontSize="xs" color="gray.500">{staff?.position?.name || 'Employee'}</Text>
                                                        </VStack>
                                                    </HStack>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <Badge 
                                                        colorScheme={loc.is_inside_radius ? 'green' : 'red'} 
                                                        borderRadius="full" 
                                                        px={3} py={1}
                                                    >
                                                        {loc.is_inside_radius ? 'Inside Radius' : 'Outside Radius'}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <HStack spacing={2}>
                                                        <Icon as={FiMapPin} color="gray.400" />
                                                        <Text fontWeight="500" color="gray.600" fontSize="sm">{lat}, {lng}</Text>
                                                    </HStack>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <HStack spacing={2}>
                                                        <Icon as={FiClock} color={stale ? 'red.500' : 'green.500'} />
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontWeight="600" color={stale ? 'red.500' : 'green.600'} fontSize="sm">
                                                                {formatTimeAgo(loc.tracked_at)}
                                                            </Text>
                                                            {stale && <Text fontSize="xs" color="gray.400">Offline</Text>}
                                                        </VStack>
                                                    </HStack>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        colorScheme="teal" 
                                                        leftIcon={<FiExternalLink />}
                                                        onClick={() => window.open(`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`, '_blank')}
                                                    >
                                                        View Map
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Box>
                    </Card>
                )}
            </VStack>
        </DashboardLayout>
    );
};

export default LiveLocation;
