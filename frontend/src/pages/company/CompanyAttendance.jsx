import { useState } from 'react';
import {
    Box, VStack, HStack, Heading, Text, Badge, Icon,
    Button, Flex, Tooltip, IconButton, Table, Thead, Tbody, Tr, Th, Td,
    Avatar, InputGroup, InputLeftElement, Input, Center, Spinner
} from '@chakra-ui/react';
import {
    FiArrowLeft, FiClock, FiCalendar, FiRefreshCw, FiSunrise, FiSunset, FiCoffee, FiUsers
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { useGetAllAttendancesQuery } from '../../store/apiSlice';

// ── Helpers ──────────────────────────────────────────────────────────────
const fmtMins = (m) => {
    if (!m || m <= 0) return '—';
    const h = Math.floor(m / 60);
    const mi = m % 60;
    return h > 0 ? `${h}h ${mi}m` : `${mi}m`;
};

const fmtTime = (t) => {
    if (!t) return '—';
    if (t.includes('AM') || t.includes('PM')) return t;
    const [hh, mm] = t.split(':');
    const h = parseInt(hh, 10);
    return `${h % 12 || 12}:${mm} ${h >= 12 ? 'PM' : 'AM'}`;
};

const CompanyAttendance = () => {
    const navigate = useNavigate();
    
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

    // Fetch all attendances for the selected date
    const { data, isLoading, error, refetch, isFetching } = useGetAllAttendancesQuery(
        { date: selectedDate },
        { refetchOnMountOrArgChange: true }
    );
    // Support both direct array response and nested object response
    const payload = data?.data || data || {};
    const attendances = Array.isArray(payload) ? payload : (payload.attendances || []);
    const rootUser = payload.user || {};

    if (error) {
        return (
            <DashboardLayout>
                <Card>
                    <EmptyState title="Error fetching attendance" description={error?.data?.message || 'Something went wrong'} />
                </Card>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <VStack spacing={6} align="stretch">

                {/* ── Hero Header ── */}
                <Box
                    bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    borderRadius="3xl"
                    p={{ base: 6, md: 8 }}
                    position="relative"
                    overflow="hidden"
                    boxShadow="xl"
                >
                    {/* Decorative Background Elements */}
                    <Box position="absolute" top="-20%" right="-5%" w="300px" h="300px" bg="purple.500" opacity="0.1" filter="blur(60px)" borderRadius="full" />
                    <Box position="absolute" bottom="-20%" left="10%" w="200px" h="200px" bg="blue.500" opacity="0.1" filter="blur(40px)" borderRadius="full" />
                    <Box position="absolute" top="10%" right="15%" w="100px" h="100px" bg="cyan.500" opacity="0.15" filter="blur(30px)" borderRadius="full" />

                    <Button variant="unstyled" display="flex" alignItems="center" gap={2}
                        color="whiteAlpha.800" fontSize="sm" mb={5} h="auto"
                        position="relative" zIndex={1}
                        _hover={{ color: 'white' }}
                        onClick={() => navigate(-1)}>
                        <Icon as={FiArrowLeft} boxSize={4} /> Back
                    </Button>

                    <Flex justify="space-between" align="flex-end" flexWrap="wrap" gap={4} position="relative" zIndex={1}>
                        <Box>
                            <Badge bg="whiteAlpha.200" color="white" px={3} py={1} borderRadius="full" fontSize="xs" mb={3} backdropFilter="blur(10px)">
                                Daily Insights
                            </Badge>
                            <Heading size="xl" color="white" letterSpacing="-0.02em" mb={2}>
                                Team Attendance
                            </Heading>
                            <Text color="whiteAlpha.800" fontSize="sm">
                                View check-in, out, and break times for all users
                            </Text>
                        </Box>

                        <HStack spacing={3}>
                            <InputGroup size="sm" w="150px" bg="white" borderRadius="lg" overflow="hidden">
                                <InputLeftElement><Icon as={FiCalendar} color="gray.500" /></InputLeftElement>
                                <Input 
                                    type="date" 
                                    value={selectedDate} 
                                    onChange={(e) => setSelectedDate(e.target.value)} 
                                    border="none"
                                    _focus={{ ring: 0 }}
                                />
                            </InputGroup>

                            <Tooltip label="Refresh" placement="top" hasArrow>
                                <IconButton icon={<FiRefreshCw />} size="sm" variant="outline"
                                    color="white" borderColor="whiteAlpha.400"
                                    _hover={{ bg: 'whiteAlpha.200' }}
                                    borderRadius="lg" onClick={refetch}
                                    isLoading={isFetching}
                                    aria-label="Refresh" />
                            </Tooltip>
                        </HStack>
                    </Flex>
                </Box>

                {/* ── Attendance Table ── */}
                {isLoading || isFetching ? (
                    <Flex justify="center" py={12}><Spinner color="purple.500" size="xl" thickness="3px" /></Flex>
                ) : attendances.length === 0 ? (
                    <Card border="1px solid" borderColor="gray.100" shadow="sm" borderRadius="2xl">
                        <EmptyState title="No attendance data" description={`No check-ins found for ${selectedDate}`} icon={FiCalendar} />
                    </Card>
                ) : (
                    <Card p={0} overflow="hidden" shadow="sm" border="1px solid" borderColor="gray.100" borderRadius="2xl">
                        <Box overflowX="auto">
                            <Table variant="simple" size="md" w="100%" style={{ minWidth: '1000px' }}>
                                <Thead>
                                    <Tr>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Staff Member</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Check In</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Check Out</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Break Time</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">Overtime</Th>
                                        <Th bg="gray.800" color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap" pr={6}>Total Worked</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {attendances?.map((att, i) => {
                                        const user = att.user || rootUser;
                                        const name = user.name || `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() || 'Unknown User';
                                        
                                        return (
                                            <Tr key={att.id || i}
                                                bg={i % 2 === 0 ? 'white' : 'gray.50'}
                                                _hover={{ bg: 'purple.50' }}
                                                transition="all 0.15s">
                                                <Td py={4}>
                                                    <HStack spacing={3}>
                                                        <Avatar size="sm" src={user.p_image_url} name={name} bg="purple.100" color="purple.600" />
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontWeight="600" fontSize="sm" color="gray.800">{name}</Text>
                                                            <Text fontSize="xs" color="gray.500">{user.email || 'No email'}</Text>
                                                        </VStack>
                                                    </HStack>
                                                </Td>
                                                <Td py={4}>
                                                    <HStack spacing={1.5}>
                                                        <Icon as={FiSunrise} boxSize={3.5} color="green.500" />
                                                        <Text fontSize="sm" color="gray.700" fontWeight="500">
                                                            {att.check_in ? fmtTime(att.check_in) : '—'}
                                                        </Text>
                                                    </HStack>
                                                </Td>
                                                <Td py={4}>
                                                    <HStack spacing={1.5}>
                                                        <Icon as={FiSunset} boxSize={3.5} color="red.500" />
                                                        <Text fontSize="sm" color="gray.700" fontWeight="500">
                                                            {att.check_out ? fmtTime(att.check_out) : '—'}
                                                        </Text>
                                                    </HStack>
                                                </Td>
                                                <Td py={4}>
                                                    <Text fontSize="sm" color="gray.600">
                                                        {att.break_in ? `${fmtTime(att.break_in)} – ${fmtTime(att.break_out)}` : '—'}
                                                    </Text>
                                                </Td>
                                                <Td py={4}>
                                                    <Text fontSize="sm" fontWeight="600"
                                                        color={att.overtime_minutes || att.shift_overtime_minutes || att.session_overtime_minutes ? 'purple.600' : 'gray.400'}>
                                                        {att.overtime_minutes !== undefined 
                                                            ? fmtMins(att.overtime_minutes) 
                                                            : fmtMins((att.shift_overtime_minutes || 0) + (att.session_overtime_minutes || 0))}
                                                    </Text>
                                                </Td>
                                                <Td py={4} pr={6}>
                                                    <Badge colorScheme="blue" borderRadius="full" px={3} py={1}
                                                        fontSize="xs" fontWeight="700" border="1px solid" borderColor="blue.100">
                                                        {att.total_hours_worked || fmtMins(att.final_total_minutes)}
                                                    </Badge>
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
        </DashboardLayout>
    );
};

export default CompanyAttendance;
