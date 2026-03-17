import { Box, VStack, HStack, Heading, Text, Badge, Icon, Table, Thead, Tbody, Tr, Th, Td, SimpleGrid, Stat, StatLabel, StatNumber } from '@chakra-ui/react';
import { FiClock, FiSunrise, FiSunset, FiCoffee } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useGetAllAttendancesQuery } from '../../store/apiSlice';

const CheckInCheckOut = () => {
    const { data, isLoading, error } = useGetAllAttendancesQuery({});

    if (isLoading) return <DashboardLayout><LoadingSpinner message="Loading attendance…" /></DashboardLayout>;
    if (error) return (
        <DashboardLayout>
            <Card><EmptyState title="Error" description={error?.data?.message || 'Failed to load attendance'} /></Card>
        </DashboardLayout>
    );

    const user = data?.user || {};
    const today = data?.today_summary || {};
    const attendances = data?.attendances || [];

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>

                {/* ── Header ── */}
                <Box bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    borderRadius="2xl" p={{ base: 5, md: 8 }} position="relative" overflow="hidden">
                    <Box position="absolute" top="-40px" right="-40px" w="160px" h="160px" borderRadius="full" bg="whiteAlpha.50" />
                    <Heading size="xl" color="white" mb={1}>Check-in / Check-out</Heading>
                    <Text color="whiteAlpha.700" fontSize="sm">
                        {user.name} · {user.company_name} · {user.today_date}
                    </Text>
                </Box>

                {/* ── Today Summary Cards ── */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    {[
                        { label: 'Check In', val: today.check_in, icon: FiSunrise, color: 'green' },
                        { label: 'Check Out', val: today.check_out, icon: FiSunset, color: 'red' },
                        { label: 'Break', val: today.total_hours_breaked, icon: FiCoffee, color: 'orange' },
                        { label: 'Total Worked', val: today.total_hours_worked, icon: FiClock, color: 'blue' },
                    ].map((c) => (
                        <Card key={c.label} p={5} bg="white" border="1px solid" borderColor="gray.100"
                            _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.2s">
                            <HStack spacing={3}>
                                <Box p={2.5} bg={`${c.color}.50`} borderRadius="xl">
                                    <Icon as={c.icon} boxSize={5} color={`${c.color}.500`} />
                                </Box>
                                <Stat>
                                    <StatLabel fontSize="xs" color="gray.500" fontWeight="600">{c.label}</StatLabel>
                                    <StatNumber fontSize="lg" fontWeight="800" color="gray.800">
                                        {c.val || '—'}
                                    </StatNumber>
                                </Stat>
                            </HStack>
                        </Card>
                    ))}
                </SimpleGrid>

                {/* ── Attendance History ── */}
                <Heading size="md" color="gray.700">Attendance History</Heading>

                {attendances.length === 0 ? (
                    <Card>
                        <EmptyState title="No records" description="No attendance records found" icon={FiClock} />
                    </Card>
                ) : (
                    <Card p={0} overflow="hidden" boxShadow="xl" border="1px solid" borderColor="gray.100">
                        <Box overflowX="auto">
                            <Table variant="simple" size="sm" w="100%" style={{ minWidth: '800px' }}>
                                <Thead>
                                    <Tr>
                                        {['Date', 'Check In', 'Check Out', 'Break In', 'Break Out', 'OT In', 'OT Out', 'Hours Worked'].map((h) => (
                                            <Th key={h} bg="gray.800"
                                                color="white" fontSize="xs" py={4} borderBottom="none" whiteSpace="nowrap">
                                                {h}
                                            </Th>
                                        ))}
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {attendances.map((a, i) => (
                                        <Tr key={a.id} bg={i % 2 === 0 ? 'white' : 'gray.50'}
                                            _hover={{ bg: 'blue.50' }} transition="all 0.15s">
                                            <Td py={3} fontWeight="600" fontSize="sm" color="gray.800">{a.date}</Td>
                                            <Td>
                                                <HStack spacing={1.5}>
                                                    <Icon as={FiSunrise} boxSize={3.5} color="green.400" />
                                                    <Text fontSize="sm" fontWeight="500" color="gray.700">{a.check_in || '—'}</Text>
                                                </HStack>
                                            </Td>
                                            <Td>
                                                <HStack spacing={1.5}>
                                                    <Icon as={FiSunset} boxSize={3.5} color="red.400" />
                                                    <Text fontSize="sm" fontWeight="500" color="gray.700">{a.check_out || '—'}</Text>
                                                </HStack>
                                            </Td>
                                            <Td><Text fontSize="sm" color="gray.600">{a.break_in || '—'}</Text></Td>
                                            <Td><Text fontSize="sm" color="gray.600">{a.break_out || '—'}</Text></Td>
                                            <Td><Text fontSize="sm" color="gray.600">{a.overtime_in || '—'}</Text></Td>
                                            <Td><Text fontSize="sm" color="gray.600">{a.overtime_out || '—'}</Text></Td>
                                            <Td>
                                                <Badge colorScheme="blue" borderRadius="full" px={3} py={1} fontSize="xs" fontWeight="700">
                                                    {a.total_hours_worked || '—'}
                                                </Badge>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </Box>
                    </Card>
                )}
            </VStack>
        </DashboardLayout>
    );
};

export default CheckInCheckOut;
