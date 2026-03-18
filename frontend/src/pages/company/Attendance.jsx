import { useState, useMemo } from 'react';
import {
    Box, VStack, HStack, Heading, Text, Badge, Icon,
    Button, Flex, Tooltip, IconButton, SimpleGrid, Tabs, TabList, Tab,
    Table, Thead, Tbody, Tr, Th, Td, Spinner, useToast,
    Stat, StatLabel, StatNumber, Center
} from '@chakra-ui/react';
import {
    FiArrowLeft, FiClock, FiCheckCircle, FiXCircle, FiCalendar,
    FiDownload, FiRefreshCw, FiSunrise, FiSunset, FiCoffee, FiActivity,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

import { useGetAttendanceReportQuery } from '../../store/apiSlice';

// ── Range options ────────────────────────────────────────────────────────
const RANGES = [
    { key: 'week',         label: 'This Week' },
    { key: 'month',        label: 'This Month' },
    { key: 'last_7_days',  label: 'Last 7 Days' },
    { key: 'last_30_days', label: 'Last 30 Days' },
];

// ── Status badge colors ──────────────────────────────────────────────────
const statusConfig = {
    present:    { color: 'green',  label: 'Present',    icon: FiCheckCircle },
    absent:     { color: 'red',    label: 'Absent',     icon: FiXCircle },
    leave:      { color: 'orange', label: 'Leave',      icon: FiCalendar },
    holiday:    { color: 'purple', label: 'Holiday',    icon: FiSunrise },
    weekly_off: { color: 'gray',   label: 'Weekly Off', icon: FiCoffee },
    'N/A':      { color: 'gray',   label: '—',          icon: FiClock },
};

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

// ═════════════════════════════════════════════════════════════════════════
const Attendance = () => {
    const navigate = useNavigate();
    const toast = useToast();

    const [rangeIdx, setRangeIdx] = useState(0);
    const range = RANGES[rangeIdx].key;

    const { data, isLoading, error, refetch, isFetching } = useGetAttendanceReportQuery(
        { range },
        { refetchOnMountOrArgChange: true }
    );

    const summary = data?.summary || {};
    const days    = useMemo(() => data?.days || [], [data]);
    const dateRange = data?.range || {};

    // ── Export handler ────────────────────────────────────────────────────
    const handleExport = () => {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const token = localStorage.getItem('token');
        const url = `${baseUrl}/api/v1/attendances/my-attendance/report/export?range=${range}`;

        fetch(url, { headers: { Authorization: `Bearer ${token}`, platform: 'web' } })
            .then(res => {
                if (!res.ok) throw new Error('Export failed');
                return res.blob();
            })
            .then(blob => {
                const burl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = burl;
                a.download = `attendance_report_${range}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(burl);
                toast({ title: 'Report downloaded!', status: 'success', duration: 2000 });
            })
            .catch(() => toast({ title: 'Export failed', status: 'error', duration: 3000 }));
    };

    // ── Loading / Error ──────────────────────────────────────────────────
    if (isLoading) return <DashboardLayout><LoadingSpinner message="Loading attendance…" /></DashboardLayout>;
    if (error) return (
        <DashboardLayout>
            <Card><EmptyState title="Error loading attendance" description={error?.data?.message || 'Something went wrong'} /></Card>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <VStack spacing={6} align="stretch">

                {/* ── Hero Header ── */}
                <Box
                    bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    borderRadius="2xl" p={{ base: 6, md: 8 }}
                    position="relative" overflow="hidden"
                >
                    {/* Decorative Background Elements */}
                    <Box position="absolute" top="-50px" right="-50px" w="200px" h="200px" borderRadius="full"
                        bg="whiteAlpha.50" />
                    <Box position="absolute" bottom="-30px" left="20%" w="140px" h="140px" borderRadius="full"
                        bg="whiteAlpha.30" />

                    <Button variant="unstyled" display="flex" alignItems="center" gap={2}
                        color="whiteAlpha.700" fontSize="sm" mb={4} h="auto"
                        _hover={{ color: 'white' }}
                        onClick={() => navigate(-1)}>
                        <Icon as={FiArrowLeft} boxSize={4} /> Back
                    </Button>

                    <Flex justify="space-between" align="flex-end" flexWrap="wrap" gap={4} position="relative">
                        <Box>
                            <HStack spacing={3} mb={3}>
                                <Center p={2} bg="whiteAlpha.200" borderRadius="lg" backdropFilter="blur(10px)">
                                    <Icon as={FiCalendar} boxSize={6} color="white" />
                                </Center>
                                <Box>
                                    <Text fontSize="xs" color="whiteAlpha.600" fontWeight="600"
                                        letterSpacing="wider" textTransform="uppercase" mb={0.5}>
                                        Attendance Report
                                    </Text>
                                    <Heading size="lg" color="white" letterSpacing="-0.02em" lineHeight="1">
                                        Employee Attendance
                                    </Heading>
                                </Box>
                            </HStack>
                            <Text color="whiteAlpha.800" fontSize="sm">
                                {dateRange.from} &mdash; {dateRange.to}
                            </Text>
                        </Box>

                        <HStack spacing={3}>
                            <Tooltip label="Export as Excel" placement="top" hasArrow>
                                <Button leftIcon={<FiDownload />} size="sm"
                                    bg="white" color="gray.800"
                                    borderRadius="lg" _hover={{ bg: 'gray.100' }}
                                    onClick={handleExport}>
                                    Export
                                </Button>
                            </Tooltip>
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

                {/* ── Summary Cards ── */}
                <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4}>
                    {[
                        { label: 'Present',  val: summary.present_days,  color: 'green',  icon: FiCheckCircle },
                        { label: 'Absent',   val: summary.absent_days,   color: 'red',    icon: FiXCircle },
                        { label: 'Leave',    val: summary.leave_days,    color: 'orange', icon: FiCalendar },
                        { label: 'Worked',   val: summary.total_worked,  color: 'blue',   icon: FiClock },
                        { label: 'Overtime', val: summary.total_overtime, color: 'purple', icon: FiActivity },
                    ].map((c) => (
                        <Card key={c.label} p={5}
                            bg="white" border="1px solid" borderColor="gray.100" shadow="sm"
                            _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                            transition="all 0.2s">
                            <HStack spacing={4}>
                                <Center p={3} bg={`${c.color}.50`} borderRadius="xl">
                                    <Icon as={c.icon} boxSize={5} color={`${c.color}.500`} />
                                </Center>
                                <Stat>
                                    <StatLabel fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase" letterSpacing="wider">{c.label}</StatLabel>
                                    <StatNumber fontSize="2xl" fontWeight="800" color="gray.800" lineHeight="1" mt={1}>
                                        {c.val ?? '—'}
                                    </StatNumber>
                                </Stat>
                            </HStack>
                        </Card>
                    ))}
                </SimpleGrid>

                {/* ── Range Tabs ── */}
                <Tabs index={rangeIdx} onChange={setRangeIdx} variant="unstyled" size="sm">
                    <TabList bg="white" borderRadius="xl" p={1.5} gap={1}
                        border="1px solid" borderColor="gray.100" shadow="sm" overflowX="auto" w="fit-content">
                        {RANGES.map((r) => (
                            <Tab key={r.key}
                                _selected={{ bgGradient: 'linear(to-r, purple.500, blue.500)', color: 'white', shadow: 'sm', fontWeight: 'bold' }}
                                borderRadius="lg" fontWeight="600" fontSize="sm" color="gray.600"
                                px={5} py={2}
                                transition="all 0.2s">
                                {r.label}
                            </Tab>
                        ))}
                    </TabList>
                </Tabs>

                {/* ── Attendance Table ── */}
                {isFetching && !isLoading ? (
                    <Flex justify="center" py={8}><Spinner color="purple.500" size="xl" thickness="3px" /></Flex>
                ) : days.length === 0 ? (
                    <Card border="1px solid" borderColor="gray.100" shadow="sm">
                        <EmptyState title="No attendance data" description="No records found for this period" icon={FiCalendar} />
                    </Card>
                ) : (
                    <Card p={0} overflow="hidden" shadow="sm" border="1px solid" borderColor="gray.100">
                        <Box overflowX="auto">
                            <Table variant="simple" size="md" w="100%" style={{ minWidth: '800px' }}>
                                <Thead>
                                    <Tr>
                                        {['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Break', 'Overtime', 'Total Worked'].map((h) => (
                                            <Th key={h} bg="gray.800"
                                                color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4}
                                                borderBottom="none" whiteSpace="nowrap">
                                                {h}
                                            </Th>
                                        ))}
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {days.map((day, i) => {
                                        const sc = statusConfig[day.status] || statusConfig['N/A'];
                                        const att = day.attendance;
                                        return (
                                            <Tr key={day.date}
                                                bg={i % 2 === 0 ? 'white' : 'gray.50'}
                                                _hover={{ bg: 'purple.50' }}
                                                transition="all 0.15s">
                                                <Td py={4} fontWeight="600" fontSize="sm" color="gray.800">
                                                    {day.date}
                                                </Td>
                                                <Td py={4}>
                                                    <Text fontSize="sm" color="gray.600" fontWeight="500">{day.day}</Text>
                                                </Td>
                                                <Td py={4}>
                                                    <HStack spacing={1.5}>
                                                        <Icon as={sc.icon} boxSize={3.5} color={`${sc.color}.500`} />
                                                        <Badge colorScheme={sc.color} variant="subtle" borderRadius="full" px={2.5} py={0.5} fontSize="xs"
                                                            fontWeight="700" border="1px solid" borderColor={`${sc.color}.200`}>
                                                            {day.holiday_title || sc.label}
                                                        </Badge>
                                                    </HStack>
                                                </Td>
                                                <Td py={4}>
                                                    <HStack spacing={1.5}>
                                                        <Icon as={FiSunrise} boxSize={3.5} color="green.500" />
                                                        <Text fontSize="sm" color="gray.700" fontWeight="500">
                                                            {att ? fmtTime(att.check_in) : '—'}
                                                        </Text>
                                                    </HStack>
                                                </Td>
                                                <Td py={4}>
                                                    <HStack spacing={1.5}>
                                                        <Icon as={FiSunset} boxSize={3.5} color="red.500" />
                                                        <Text fontSize="sm" color="gray.700" fontWeight="500">
                                                            {att ? fmtTime(att.check_out) : '—'}
                                                        </Text>
                                                    </HStack>
                                                </Td>
                                                <Td py={4}>
                                                    <Text fontSize="sm" color="gray.600">
                                                        {att && att.break_in ? `${fmtTime(att.break_in)} – ${fmtTime(att.break_out)}` : '—'}
                                                    </Text>
                                                </Td>
                                                <Td py={4}>
                                                    <Text fontSize="sm" fontWeight="600"
                                                        color={att?.shift_overtime_minutes || att?.session_overtime_minutes ? 'purple.600' : 'gray.400'}>
                                                        {att ? fmtMins((att.shift_overtime_minutes || 0) + (att.session_overtime_minutes || 0)) : '—'}
                                                    </Text>
                                                </Td>
                                                <Td py={4}>
                                                    <Badge colorScheme="blue" borderRadius="full" px={3} py={1}
                                                        fontSize="xs" fontWeight="700" border="1px solid" borderColor="blue.100">
                                                        {att ? fmtMins(att.final_total_minutes) : '—'}
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

                {/* ── Info Bar ── */}
                <Box bg="purple.50" p={4} borderRadius="xl" border="1px solid" borderColor="purple.100">
                    <HStack spacing={4}>
                        <Center p={2} bg="white" borderRadius="lg" shadow="sm">
                            <Icon as={FiClock} boxSize={5} color="purple.500" />
                        </Center>
                        <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="700" color="purple.900">Attendance Overview</Text>
                            <Text fontSize="xs" color="purple.700">
                                <strong>Working Days:</strong> {summary.working_days ?? '—'} &bull;{' '}
                                <strong>Holidays:</strong> {summary.holiday_days ?? '—'} &bull;{' '}
                                <strong>Weekly Off:</strong> {summary.weekly_off_days ?? '—'}
                            </Text>
                        </VStack>
                    </HStack>
                </Box>
            </VStack>
        </DashboardLayout>
    );
};

export default Attendance;
