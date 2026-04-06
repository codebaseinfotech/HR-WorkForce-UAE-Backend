/**
 * StaffDetail — /company/staff/:staffId
 * Tabs: Leave Management | Work Schedule | Attendance | Overview
 */
import { useState } from 'react';
import {
    Box, VStack, HStack, Heading, Text, Badge, Avatar, Icon,
    Button, IconButton, Input, Select,
    Table, Thead, Tbody, Tr, Th, Td,
    Tabs, TabList, TabPanels, Tab, TabPanel,
    FormControl, FormLabel, SimpleGrid,
    useDisclosure, useToast,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
    Switch, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
    Flex, Tooltip, Divider, Spinner,
} from '@chakra-ui/react';
import {
    FiArrowLeft, FiCalendar, FiClock, FiPlus, FiTrash2, FiEdit3,
    FiSun, FiMoon, FiBriefcase, FiUser, FiMail, FiPhone,
    FiSave, FiDownload, FiCheckCircle, FiXCircle, FiSunrise, FiSunset, FiCoffee, FiActivity,
} from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import DashboardLayout from '../../components/layout/DashboardLayout';
import Card            from '../../components/common/Card';
import LoadingSpinner  from '../../components/common/LoadingSpinner';
import EmptyState      from '../../components/common/EmptyState';
import { useAuth }     from '../../contexts/AuthContext';
import {
    useGetUserFetchQuery,
    useGetLeaveTypesQuery,
    useAddUpdateLeaveTypeMutation,
    useDeleteLeaveTypeMutation,
    useGetLeavePoliciesQuery,
    useAddUpdateLeavePolicyMutation,
    useAddUpdateWorkScheduleMutation,
    useGetRolesQuery,
    useGetAttendanceReportQuery,
} from '../../store/apiSlice';

// ── Helpers ────────────────────────────────────────────────────────────────
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' };
const DAY_STATUS = ['on', 'off', 'alternate'];
const STATUS_COLORS = { on: 'green', off: 'red', alternate: 'orange' };

// ═══════════════════════════════════════════════════════════════════════════
//  LEAVE TYPES CARD
// ═══════════════════════════════════════════════════════════════════════════
const LeaveTypesCard = () => {
    const toast = useToast();
    const { data, isLoading } = useGetLeaveTypesQuery();
    const [addUpdate, { isLoading: isSaving }] = useAddUpdateLeaveTypeMutation();
    const [deleteType, { isLoading: isDeleting }] = useDeleteLeaveTypeMutation();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [form, setForm] = useState({ code: '', name: '', id: null });

    const types = data?.data || data || [];
    const list  = Array.isArray(types) ? types : [];

    const openAdd  = () => { setForm({ code: '', name: '', id: null }); onOpen(); };
    const openEdit = (t) => { setForm({ code: t.code, name: t.name, id: t.id }); onOpen(); };

    const handleSave = async () => {
        if (!form.code || !form.name) { toast({ title: 'Code & Name required', status: 'warning', duration: 2000 }); return; }
        try {
            const body = { code: form.code, name: form.name };
            if (form.id) body.id = form.id;
            await addUpdate(body).unwrap();
            toast({ title: form.id ? 'Updated!' : 'Created!', status: 'success', duration: 2000 });
            onClose();
        } catch (err) {
            toast({ title: 'Failed', description: err?.data?.message || 'Try again', status: 'error', duration: 3000 });
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteType(id).unwrap();
            toast({ title: 'Deleted', status: 'success', duration: 2000 });
        } catch (err) {
            toast({ title: 'Delete failed', description: err?.data?.message, status: 'error', duration: 3000 });
        }
    };

    return (
        <Card>
            <HStack justify="space-between" mb={4}>
                <HStack spacing={2}>
                    <Box p={2} bg="green.100" borderRadius="xl"><Icon as={FiCalendar} boxSize={4} color="green.600" /></Box>
                    <Heading size="sm" color="gray.800">Leave Types</Heading>
                </HStack>
                <Button size="sm" leftIcon={<FiPlus />} colorScheme="green" borderRadius="xl" onClick={openAdd}>
                    Add Type
                </Button>
            </HStack>

            {isLoading ? <Spinner /> : list.length === 0 ? (
                <EmptyState title="No leave types" description="Create your first leave type" icon={FiCalendar} />
            ) : (
                <Box overflowX="auto">
                    <Table variant="simple" size="sm" w="100%" style={{ minWidth: '800px' }}>
                            <Thead>
                                <Tr>
                                    <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none">Code</Th>
                                    <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none">Name</Th>
                                    <Th bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" textAlign="center">Actions</Th>
                                </Tr>
                            </Thead>
                        <Tbody>
                            {list.map((t, i) => (
                                <Tr key={t.id} bg={i % 2 === 0 ? 'white' : 'gray.50'} _hover={{ bg: 'green.50' }}>
                                    <Td><Badge colorScheme="green" borderRadius="full" px={2}>{t.code}</Badge></Td>
                                    <Td fontSize="sm" fontWeight="500">{t.name}</Td>
                                    <Td textAlign="center">
                                        <HStack spacing={1} justify="center">
                                            <Tooltip label="Edit"><IconButton icon={<FiEdit3 />} size="xs" variant="ghost" colorScheme="blue" onClick={() => openEdit(t)} aria-label="Edit" /></Tooltip>
                                            <Tooltip label="Delete"><IconButton icon={<FiTrash2 />} size="xs" variant="ghost" colorScheme="red" isLoading={isDeleting} onClick={() => handleDelete(t.id)} aria-label="Delete" /></Tooltip>
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
                <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
                <ModalContent borderRadius="2xl">
                    <ModalHeader>{form.id ? 'Edit Leave Type' : 'Add Leave Type'}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm">Code</FormLabel>
                                <Input value={form.code} onChange={e => setForm(v => ({ ...v, code: e.target.value }))}
                                    placeholder="e.g. PL, CL" borderRadius="xl" focusBorderColor="green.500" />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm">Name</FormLabel>
                                <Input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
                                    placeholder="e.g. Paid Leave" borderRadius="xl" focusBorderColor="green.500" />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                        <Button colorScheme="green" borderRadius="xl" isLoading={isSaving} onClick={handleSave}>
                            {form.id ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
//  LEAVE POLICIES CARD
// ═══════════════════════════════════════════════════════════════════════════
const LeavePoliciesCard = ({ companyId }) => {
    const toast = useToast();
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);

    const { data, isLoading } = useGetLeavePoliciesQuery({ company_id: companyId, year }, { skip: !companyId });
    const { data: leaveTypesData } = useGetLeaveTypesQuery();
    const { data: rolesData } = useGetRolesQuery();
    const [addUpdate, { isLoading: isSaving }] = useAddUpdateLeavePolicyMutation();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const policies = data?.data || data || [];
    const policyList = Array.isArray(policies) ? policies : [];
    const _lt = leaveTypesData?.data || leaveTypesData;
    const leaveTypes = Array.isArray(_lt) ? _lt : [];
    const _r = rolesData?.data || rolesData;
    const roles = (Array.isArray(_r) ? _r : []).filter(r => r.slug !== 'super_admin');

    const [form, setForm] = useState({
        id: null,
        company_id: companyId,
        role_id: '',
        year: currentYear,
        name: '',
        items: [{ leave_type_id: '', annual_quota: 0, carry_forward: false, max_carry_forward: 0, encashment: false, max_encashment: 0 }],
    });

    const openAdd = () => {
        setForm({
            id: null, company_id: companyId, role_id: '', year: currentYear, name: '',
            items: [{ leave_type_id: '', annual_quota: 0, carry_forward: false, max_carry_forward: 0, encashment: false, max_encashment: 0 }],
        });
        onOpen();
    };

    const openEdit = (p) => {
        setForm({
            id: p.id, company_id: companyId,
            role_id: p.role_id || '', year: p.year || currentYear,
            name: p.name || '',
            items: p.items?.length ? p.items.map(i => ({
                leave_type_id: i.leave_type_id, annual_quota: i.annual_quota || 0,
                carry_forward: !!i.carry_forward, max_carry_forward: i.max_carry_forward || 0,
                encashment: !!i.encashment, max_encashment: i.max_encashment || 0,
            })) : [{ leave_type_id: '', annual_quota: 0, carry_forward: false, max_carry_forward: 0, encashment: false, max_encashment: 0 }],
        });
        onOpen();
    };

    const addItem = () => setForm(v => ({
        ...v, items: [...v.items, { leave_type_id: '', annual_quota: 0, carry_forward: false, max_carry_forward: 0, encashment: false, max_encashment: 0 }]
    }));

    const removeItem = (idx) => setForm(v => ({ ...v, items: v.items.filter((_, i) => i !== idx) }));

    const updateItem = (idx, field, value) => setForm(v => ({
        ...v, items: v.items.map((it, i) => i === idx ? { ...it, [field]: value } : it)
    }));

    const handleSave = async () => {
        try {
            const body = { ...form };
            if (!body.id) delete body.id;
            if (!body.role_id) delete body.role_id;
            if (!body.name) delete body.name;
            await addUpdate(body).unwrap();
            toast({ title: form.id ? 'Policy Updated!' : 'Policy Created!', status: 'success', duration: 2000 });
            onClose();
        } catch (err) {
            toast({ title: 'Failed', description: err?.data?.message || 'Try again', status: 'error', duration: 3000 });
        }
    };

    return (
        <Card>
            <HStack justify="space-between" mb={4} flexWrap="wrap" gap={2}>
                <HStack spacing={2}>
                    <Box p={2} bg="purple.100" borderRadius="xl"><Icon as={FiBriefcase} boxSize={4} color="purple.600" /></Box>
                    <Heading size="sm" color="gray.800">Leave Policies</Heading>
                </HStack>
                <HStack spacing={2}>
                    <Select size="sm" value={year} onChange={e => setYear(Number(e.target.value))} w="100px" borderRadius="xl">
                        {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                    </Select>
                    <Button size="sm" leftIcon={<FiPlus />} colorScheme="purple" borderRadius="xl" onClick={openAdd}>
                        Add Policy
                    </Button>
                </HStack>
            </HStack>

            {isLoading ? <Spinner /> : policyList.length === 0 ? (
                <EmptyState title="No policies" description="Create a leave policy for this year" icon={FiBriefcase} />
            ) : (
                <VStack spacing={3} align="stretch">
                    {policyList.map((p) => (
                        <Box key={p.id} p={4} border="1px solid" borderColor="gray.100" borderRadius="xl" bg="gray.50"
                            _hover={{ borderColor: 'purple.200', bg: 'purple.50' }} transition="all 0.2s">
                            <HStack justify="space-between" mb={2}>
                                <VStack align="start" spacing={0}>
                                    <Text fontWeight="700" fontSize="sm">{p.name || `Policy #${p.id}`}</Text>
                                    <HStack spacing={2}>
                                        <Badge colorScheme="purple" fontSize="xs">{p.year}</Badge>
                                        {p.role_id && <Badge colorScheme="blue" fontSize="xs">Role #{p.role_id}</Badge>}
                                    </HStack>
                                </VStack>
                                <Tooltip label="Edit policy">
                                    <IconButton icon={<FiEdit3 />} size="sm" variant="ghost" colorScheme="purple" onClick={() => openEdit(p)} aria-label="Edit" />
                                </Tooltip>
                            </HStack>
                            {p.items?.length > 0 && (
                                <Box overflowX="auto">
                                    <Table size="xs" variant="simple" w="100%">
                                        <Thead>
                                            <Tr>
                                                <Th bg="gray.800" px={4} color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none">Leave Type</Th>
                                                <Th bg="gray.800" px={4} color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" isNumeric>Quota</Th>
                                                <Th bg="gray.800" px={4} color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none">Carry Fwd</Th>
                                                <Th bg="gray.800" px={4} color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none">Encash</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {p.items.map((it, i) => (
                                                <Tr key={i}>
                                                    <Td fontSize="xs" px={4} py={3}>{it.leave_type?.name || `Type #${it.leave_type_id}`}</Td>
                                                    <Td fontSize="xs" px={4} py={1} isNumeric fontWeight="600">{it.annual_quota}</Td>
                                                    <Td fontSize="xs" px={4} py={1}>
                                                        {it.carry_forward ? <Badge colorScheme="green" fontSize="2xs">Yes (max {it.max_carry_forward})</Badge> : <Badge colorScheme="gray" fontSize="2xs">No</Badge>}
                                                    </Td>
                                                    <Td fontSize="xs" px={4} py={1}>
                                                        {it.encashment ? <Badge colorScheme="blue" fontSize="2xs">Yes (max {it.max_encashment})</Badge> : <Badge colorScheme="gray" fontSize="2xs">No</Badge>}
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            )}
                        </Box>
                    ))}
                </VStack>
            )}

            {/* Add/Edit Policy Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside" isCentered>
                <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
                <ModalContent borderRadius="2xl" maxH="85vh">
                    <ModalHeader>{form.id ? 'Edit Leave Policy' : 'New Leave Policy'}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                                <FormControl>
                                    <FormLabel fontSize="sm">Year</FormLabel>
                                    <Select value={form.year} onChange={e => setForm(v => ({ ...v, year: Number(e.target.value) }))} borderRadius="xl">
                                        {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="sm">Role (optional)</FormLabel>
                                    <Select value={form.role_id} onChange={e => setForm(v => ({ ...v, role_id: e.target.value ? Number(e.target.value) : '' }))} borderRadius="xl" placeholder="All roles">
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="sm">Policy Name (optional)</FormLabel>
                                    <Input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} borderRadius="xl" placeholder="e.g. Company Policy" />
                                </FormControl>
                            </SimpleGrid>

                            <Divider />
                            <HStack justify="space-between">
                                <Text fontSize="sm" fontWeight="700" color="gray.700">Leave Items</Text>
                                <Button size="xs" leftIcon={<FiPlus />} variant="outline" colorScheme="purple" onClick={addItem}>Add Item</Button>
                            </HStack>

                            {form.items.map((item, idx) => (
                                <Box key={idx} p={3} border="1px solid" borderColor="gray.200" borderRadius="xl" bg="gray.50">
                                    <HStack justify="space-between" mb={2}>
                                        <Text fontSize="xs" fontWeight="600" color="gray.500">Item #{idx + 1}</Text>
                                        {form.items.length > 1 && (
                                            <IconButton icon={<FiTrash2 />} size="xs" variant="ghost" colorScheme="red" onClick={() => removeItem(idx)} aria-label="Remove" />
                                        )}
                                    </HStack>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                                        <FormControl>
                                            <FormLabel fontSize="xs">Leave Type</FormLabel>
                                            <Select size="sm" value={item.leave_type_id} onChange={e => updateItem(idx, 'leave_type_id', Number(e.target.value))} borderRadius="lg" placeholder="Select type">
                                                {(Array.isArray(leaveTypes) ? leaveTypes : []).map(lt => <option key={lt.id} value={lt.id}>{lt.name} ({lt.code})</option>)}
                                            </Select>
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel fontSize="xs">Annual Quota</FormLabel>
                                            <NumberInput size="sm" min={0} value={item.annual_quota} onChange={(_, v) => updateItem(idx, 'annual_quota', v)}>
                                                <NumberInputField borderRadius="lg" />
                                                <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                                            </NumberInput>
                                        </FormControl>
                                    </SimpleGrid>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={3}>
                                        <HStack>
                                            <Switch size="sm" colorScheme="green" isChecked={item.carry_forward} onChange={e => updateItem(idx, 'carry_forward', e.target.checked)} />
                                            <Text fontSize="xs">Carry Forward</Text>
                                            {item.carry_forward && (
                                                <NumberInput size="xs" min={0} w="70px" value={item.max_carry_forward} onChange={(_, v) => updateItem(idx, 'max_carry_forward', v)}>
                                                    <NumberInputField borderRadius="lg" placeholder="Max" />
                                                </NumberInput>
                                            )}
                                        </HStack>
                                        <HStack>
                                            <Switch size="sm" colorScheme="blue" isChecked={item.encashment} onChange={e => updateItem(idx, 'encashment', e.target.checked)} />
                                            <Text fontSize="xs">Encashment</Text>
                                            {item.encashment && (
                                                <NumberInput size="xs" min={0} w="70px" value={item.max_encashment} onChange={(_, v) => updateItem(idx, 'max_encashment', v)}>
                                                    <NumberInputField borderRadius="lg" placeholder="Max" />
                                                </NumberInput>
                                            )}
                                        </HStack>
                                    </SimpleGrid>
                                </Box>
                            ))}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                        <Button colorScheme="purple" borderRadius="xl" isLoading={isSaving} leftIcon={<FiSave />} onClick={handleSave}>
                            {form.id ? 'Update Policy' : 'Create Policy'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
//  WORK SCHEDULE CARD
// ═══════════════════════════════════════════════════════════════════════════
const WorkScheduleCard = ({ companyId }) => {
    const toast = useToast();
    const { data: rolesData } = useGetRolesQuery();
    const [addUpdate, { isLoading: isSaving }] = useAddUpdateWorkScheduleMutation();
    const _r = rolesData?.data || rolesData;
    const roles = (Array.isArray(_r) ? _r : []).filter(r => r.slug !== 'super_admin');

    const [form, setForm] = useState({
        company_id: companyId,
        role_id: roles[0]?.id,
        start_time: '09:00',
        end_time: '18:00',
        break_minutes: 60,
        weekly_rules: { sun: 'off', mon: 'on', tue: 'on', wed: 'on', thu: 'on', fri: 'on', sat: 'alternate' },
        monthly_rules: { sat_off_weeks: [2, 4] },
    });

    const toggleDay = (day) => {
        const cur = form.weekly_rules[day];
        const next = DAY_STATUS[(DAY_STATUS.indexOf(cur) + 1) % DAY_STATUS.length];
        setForm(v => ({ ...v, weekly_rules: { ...v.weekly_rules, [day]: next } }));
    };

    const toggleSatWeek = (w) => {
        setForm(v => {
            const cur = v.monthly_rules.sat_off_weeks || [];
            const next = cur.includes(w) ? cur.filter(x => x !== w) : [...cur, w].sort();
            return { ...v, monthly_rules: { ...v.monthly_rules, sat_off_weeks: next } };
        });
    };

    const handleSave = async () => {
        try {
            const body = { ...form };
            if (!body.role_id) delete body.role_id;
            await addUpdate(body).unwrap();
            toast({ title: 'Schedule Saved!', status: 'success', duration: 2500 });
        } catch (err) {
            toast({ title: 'Failed', description: err?.data?.message || 'Try again', status: 'error', duration: 3000 });
        }
    };

    return (
        <Card>
            <HStack spacing={2} mb={5}>
                <Box p={2} bg="blue.100" borderRadius="xl"><Icon as={FiClock} boxSize={4} color="blue.600" /></Box>
                <Heading size="sm" color="gray.800">Work Schedule</Heading>
            </HStack>

            <VStack spacing={5} align="stretch">
                {/* Times */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">
                            <HStack spacing={1}><Icon as={FiSun} color="orange.400" boxSize={3.5} /><Text>Check-in Time</Text></HStack>
                        </FormLabel>
                        <Input type="time" value={form.start_time}
                            onChange={e => setForm(v => ({ ...v, start_time: e.target.value }))}
                            borderRadius="xl" focusBorderColor="blue.500" bg="gray.50" />
                    </FormControl>
                    <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">
                            <HStack spacing={1}><Icon as={FiMoon} color="indigo.400" boxSize={3.5} /><Text>Check-out Time</Text></HStack>
                        </FormLabel>
                        <Input type="time" value={form.end_time}
                            onChange={e => setForm(v => ({ ...v, end_time: e.target.value }))}
                            borderRadius="xl" focusBorderColor="blue.500" bg="gray.50" />
                    </FormControl>
                    <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">Break (minutes)</FormLabel>
                        <NumberInput min={0} max={180} value={form.break_minutes}
                            onChange={(_, v) => setForm(f => ({ ...f, break_minutes: v }))}>
                            <NumberInputField borderRadius="xl" bg="gray.50" />
                            <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                        </NumberInput>
                    </FormControl>
                </SimpleGrid>

                {/* Role selector */}
                <FormControl>
                    <FormLabel fontSize="sm" fontWeight="600">Apply to Role (optional)</FormLabel>
                    <Select value={form.role_id} onChange={e => setForm(v => ({ ...v, role_id: e.target.value ? Number(e.target.value) : '' }))}
                        borderRadius="xl" bg="gray.50" placeholder="All roles">
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Select>
                </FormControl>

                <Divider />

                {/* Weekly Rules */}
                <Box>
                    <Text fontSize="sm" fontWeight="700" color="gray.700" mb={3}>Weekly Schedule</Text>
                    <SimpleGrid columns={7} spacing={2}>
                        {DAYS.map(day => {
                            const status = form.weekly_rules[day];
                            return (
                                <VStack key={day} spacing={1}>
                                    <Text fontSize="xs" fontWeight="600" color="gray.500">{DAY_LABELS[day]}</Text>
                                    <Button
                                        size="sm" w="full" borderRadius="xl"
                                        colorScheme={STATUS_COLORS[status]}
                                        variant={status === 'on' ? 'solid' : status === 'off' ? 'outline' : 'solid'}
                                        opacity={status === 'alternate' ? 0.8 : 1}
                                        onClick={() => toggleDay(day)}
                                        fontSize="xs" fontWeight="700" textTransform="capitalize">
                                        {status}
                                    </Button>
                                </VStack>
                            );
                        })}
                    </SimpleGrid>
                    <Text fontSize="xs" color="gray.400" mt={2}>Click to cycle: On → Off → Alternate</Text>
                </Box>

                {/* Monthly Rules (for alternate Saturdays) */}
                {form.weekly_rules.sat === 'alternate' && (
                    <Box>
                        <Text fontSize="sm" fontWeight="700" color="gray.700" mb={2}>Saturday Off Weeks</Text>
                        <HStack spacing={2}>
                            {[1, 2, 3, 4, 5].map(w => (
                                <Button key={w} size="sm" borderRadius="xl"
                                    colorScheme={form.monthly_rules.sat_off_weeks?.includes(w) ? 'red' : 'gray'}
                                    variant={form.monthly_rules.sat_off_weeks?.includes(w) ? 'solid' : 'outline'}
                                    onClick={() => toggleSatWeek(w)}>
                                    Week {w}
                                </Button>
                            ))}
                        </HStack>
                        <Text fontSize="xs" color="gray.400" mt={1}>Select which Saturday weeks are off</Text>
                    </Box>
                )}

                <Button
                    bgGradient="linear(to-r, blue.500, indigo.500)" color="white"
                    borderRadius="xl" fontWeight="700" leftIcon={<Icon as={FiSave} />}
                    isLoading={isSaving} loadingText="Saving…"
                    onClick={handleSave}
                    _hover={{ bgGradient: 'linear(to-r, blue.600, indigo.600)', transform: 'translateY(-1px)', shadow: 'lg' }}
                    transition="all 0.2s">
                    Save Work Schedule
                </Button>
            </VStack>
        </Card>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
//  ATTENDANCE CARD
// ═══════════════════════════════════════════════════════════════════════════
const ATT_RANGES = [
    { key: 'week',         label: 'This Week' },
    { key: 'month',        label: 'This Month' },
    { key: 'last_7_days',  label: 'Last 7 Days' },
    { key: 'last_30_days', label: 'Last 30 Days' },
];

const attStatusCfg = {
    present:    { color: 'green',  label: 'Present',    icon: FiCheckCircle },
    absent:     { color: 'red',    label: 'Absent',     icon: FiXCircle },
    leave:      { color: 'orange', label: 'Leave',      icon: FiCalendar },
    holiday:    { color: 'purple', label: 'Holiday',    icon: FiSunrise },
    weekly_off: { color: 'gray',   label: 'Weekly Off', icon: FiCoffee },
    'N/A':      { color: 'gray',   label: '—',          icon: FiClock },
};

const fmtMins = (m) => {
    if (!m || m <= 0) return '—';
    const h = Math.floor(m / 60); const mi = m % 60;
    return h > 0 ? `${h}h ${mi}m` : `${mi}m`;
};

const fmtTime = (t) => {
    if (!t) return '—';
    if (t.includes('AM') || t.includes('PM')) return t;
    const [hh, mm] = t.split(':');
    const h = parseInt(hh, 10);
    return `${h % 12 || 12}:${mm} ${h >= 12 ? 'PM' : 'AM'}`;
};

const AttendanceCard = ({ companyId, staffId }) => {
    const toast = useToast();
    const [rangeIdx, setRangeIdx] = useState(0);
    const range = ATT_RANGES[rangeIdx].key;

    const { data, isLoading, isFetching } = useGetAttendanceReportQuery(
        { range, company_id: companyId },
        { refetchOnMountOrArgChange: true }
    );

    const userReport = data?.reports?.find(r => String(r.user?.id) === String(staffId)) || {};
    const summary   = userReport.summary || {};
    const days      = userReport.days || [];
    const dateRange = data?.range || {};

    // ── Export handler ──
    const handleExport = () => {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const token = localStorage.getItem('token');
        const url = `${baseUrl}/api/v1/attendances/my-attendance/report/export?range=${range}&user_id=${staffId || ''}`;

        fetch(url, { headers: { Authorization: `Bearer ${token}`, platform: 'web' } })
            .then(res => { if (!res.ok) throw new Error(); return res.blob(); })
            .then(blob => {
                const burl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = burl; a.download = `attendance_${range}.xlsx`; a.click();
                window.URL.revokeObjectURL(burl);
                toast({ title: 'Downloaded!', status: 'success', duration: 2000 });
            })
            .catch(() => toast({ title: 'Export failed', status: 'error', duration: 3000 }));
    };

    return (
        <VStack spacing={5} align="stretch">
            {/* Range tabs + export */}
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                <Tabs index={rangeIdx} onChange={setRangeIdx} variant="unstyled" size="sm">
                    <TabList bg="white" borderRadius="xl" p={1} gap={1}
                        border="1px solid" borderColor="gray.100">
                        {ATT_RANGES.map(r => (
                            <Tab key={r.key}
                                _selected={{ bg: 'teal.500', color: 'white', shadow: 'md' }}
                                borderRadius="lg" fontWeight="600" fontSize="sm" px={3} py={1.5}
                                transition="all 0.2s">{r.label}</Tab>
                        ))}
                    </TabList>
                </Tabs>
                <Button leftIcon={<FiDownload />} size="sm"
                    bgGradient="linear(to-r, teal.400, green.400)" color="white"
                    borderRadius="lg" _hover={{ opacity: 0.9 }}
                    onClick={handleExport} isLoading={isFetching}>
                    Export XLS
                </Button>
            </Flex>

            {/* Date range info */}
            <Text fontSize="xs" color="gray.500" fontWeight="500">
                {dateRange.from} — {dateRange.to}
            </Text>

            {/* Summary cards */}
            <SimpleGrid columns={{ base: 2, md: 5 }} spacing={3}>
                {[
                    { label: 'Present',  val: summary.present_days,   color: 'green',  icon: FiCheckCircle },
                    { label: 'Absent',   val: summary.absent_days,    color: 'red',    icon: FiXCircle },
                    { label: 'Leave',    val: summary.leave_days,     color: 'orange', icon: FiCalendar },
                    { label: 'Worked',   val: summary.total_worked,   color: 'blue',   icon: FiClock },
                    { label: 'Overtime', val: summary.total_overtime,  color: 'purple', icon: FiActivity },
                ].map(c => (
                    <Box key={c.label} p={3} bg="white" border="1px solid" borderColor="gray.100"
                        borderRadius="xl" _hover={{ shadow: 'md' }} transition="all 0.2s">
                        <HStack spacing={2}>
                            <Box p={2} bg={`${c.color}.50`} borderRadius="lg">
                                <Icon as={c.icon} boxSize={4} color={`${c.color}.500`} />
                            </Box>
                            <VStack align="start" spacing={0}>
                                <Text fontSize="2xs" color="gray.400" fontWeight="600">{c.label}</Text>
                                <Text fontSize="md" fontWeight="800" color="gray.800">{c.val ?? '—'}</Text>
                            </VStack>
                        </HStack>
                    </Box>
                ))}
            </SimpleGrid>

            {/* Table */}
            {isLoading || isFetching ? <Flex justify="center" py={6}><Spinner color="teal.500" size="lg" /></Flex> : days.length === 0 ? (
                <EmptyState title="No data" description="No attendance records for this range" icon={FiCalendar} />
            ) : (
                <Card p={0} overflow="hidden" border="1px solid" borderColor="gray.100">
                    <Box overflowX="auto">
                        <Table size="sm" variant="simple" w="100%" style={{ minWidth: '800px' }}>
                            <Thead>
                                <Tr>
                                    {['Date', 'Day', 'Status', 'Check In', 'Check Out', 'OT', 'Total'].map((h) => (
                                        <Th key={h} bg="gray.800" color="white" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" py={4} borderBottom="none" whiteSpace="nowrap">{h}</Th>
                                    ))}
                                </Tr>
                            </Thead>
                            <Tbody>
                                {days.map((day, i) => {
                                    const sc = attStatusCfg[day.status] || attStatusCfg['N/A'];
                                    const att = day.attendance;
                                    return (
                                        <Tr key={day.date} bg={i % 2 === 0 ? 'white' : 'gray.50'}
                                            _hover={{ bg: 'teal.50' }} transition="all 0.15s">
                                            <Td py={2.5} fontWeight="600" fontSize="sm">{day.date}</Td>
                                            <Td fontSize="sm" color="gray.600">{day.day}</Td>
                                            <Td>
                                                <HStack spacing={1}>
                                                    <Icon as={sc.icon} boxSize={3} color={`${sc.color}.500`} />
                                                    <Badge colorScheme={sc.color} borderRadius="full" px={2} fontSize="2xs" fontWeight="700">
                                                        {day.holiday_title || sc.label}
                                                    </Badge>
                                                </HStack>
                                            </Td>
                                            <Td>
                                                <HStack spacing={1}>
                                                    <Icon as={FiSunrise} boxSize={3} color="green.400" />
                                                    <Text fontSize="sm" color="gray.700">{att ? fmtTime(att.check_in) : '—'}</Text>
                                                </HStack>
                                            </Td>
                                            <Td>
                                                <HStack spacing={1}>
                                                    <Icon as={FiSunset} boxSize={3} color="red.400" />
                                                    <Text fontSize="sm" color="gray.700">{att ? fmtTime(att.check_out) : '—'}</Text>
                                                </HStack>
                                            </Td>
                                            <Td>
                                                <Text fontSize="sm" fontWeight="600"
                                                    color={(att?.shift_overtime_minutes || att?.session_overtime_minutes) ? 'purple.600' : 'gray.400'}>
                                                    {att ? fmtMins((att.shift_overtime_minutes || 0) + (att.session_overtime_minutes || 0)) : '—'}
                                                </Text>
                                            </Td>
                                            <Td>
                                                <Badge colorScheme="blue" borderRadius="full" px={2} fontSize="2xs" fontWeight="700">
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

            {/* Info bar */}
            <Box bg="gray.50" p={3} borderRadius="xl" border="1px solid" borderColor="gray.100">
                <HStack spacing={3}>
                    <Box p={2} bg="teal.50" borderRadius="lg">
                        <Icon as={FiClock} boxSize={4} color="teal.500" />
                    </Box>
                    <Text fontSize="xs" color="gray.600">
                        <strong>Working Days:</strong> {summary.working_days ?? '—'} &nbsp;|&nbsp;
                        <strong>Holidays:</strong> {summary.holiday_days ?? '—'} &nbsp;|&nbsp;
                        <strong>Weekly Off:</strong> {summary.weekly_off_days ?? '—'}
                    </Text>
                </HStack>
            </Box>
        </VStack>
    );
};


// ═══════════════════════════════════════════════════════════════════════════
//  MAIN STAFF DETAIL PAGE
// ═══════════════════════════════════════════════════════════════════════════
const StaffDetail = () => {
    const { staffId } = useParams();
    const navigate    = useNavigate();
    const { user }    = useAuth();
    const companyId   = user?.companyId || user?.id;

    // Fetch all staff and find the one we need (API doesn't have single-user fetch)
    const { data, isLoading } = useGetUserFetchQuery(
        { company_id: companyId },
        { skip: !companyId }
    );

    const allUsers = data?.data || data?.users || data || [];
    const userList = Array.isArray(allUsers) ? allUsers : [];
    const staffMember = userList.find(u => String(u.id) === String(staffId));

    if (isLoading) return <DashboardLayout><LoadingSpinner message="Loading staff details…" /></DashboardLayout>;

    if (!staffMember) {
        return (
            <DashboardLayout>
                <Card><EmptyState title="Staff not found" description={`No staff member with ID ${staffId}`} icon={FiUser} /></Card>
            </DashboardLayout>
        );
    }

    const name   = `${staffMember.first_name || staffMember.firstName || ''} ${staffMember.last_name || staffMember.lastName || ''}`.trim();
    const role   = typeof staffMember.role === 'object' ? staffMember.role?.name : staffMember.role || 'Employee';
    const active = staffMember.status === 'active' || staffMember.status === 1;

    return (
        <DashboardLayout>
            <VStack spacing={6} align="stretch">

                {/* ── Profile Header ── */}
                <Box
                    bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    borderRadius="2xl" p={{ base: 5, md: 8 }} position="relative" overflow="hidden">
                    {/* Decorative circles */}
                    <Box position="absolute" top="-50px" right="-30px" w="200px" h="200px" borderRadius="full" bg="whiteAlpha.50" />
                    <Box position="absolute" bottom="-30px" left="25%" w="140px" h="140px" borderRadius="full" bg="whiteAlpha.30" />

                    <Button variant="unstyled" display="flex" alignItems="center" gap={2}
                        color="whiteAlpha.700" fontSize="sm" mb={5} h="auto"
                        _hover={{ color: 'white' }}
                        onClick={() => navigate(-1)}>
                        <Icon as={FiArrowLeft} boxSize={4} /> Back
                    </Button>

                    <Flex gap={5} align="center" flexWrap="wrap" position="relative">
                        <Box position="relative">
                            <Avatar size="xl" src={staffMember.p_image_url} name={name}
                                bg="whiteAlpha.200" color="white" border="3px solid" borderColor="whiteAlpha.300" />
                            <Box position="absolute" bottom={1} right={1} w="14px" h="14px"
                                borderRadius="full" bg={active ? 'green.400' : 'gray.400'} border="3px solid" borderColor="#1a1a2e" />
                        </Box>
                        <VStack align="start" spacing={1}>
                            <Heading size="lg" color="white" letterSpacing="-0.02em">{name || '—'}</Heading>
                            <HStack spacing={2} flexWrap="wrap">
                                <Badge bg="whiteAlpha.150" color="gray.200" borderRadius="lg" px={2.5} fontSize="xs">{role}</Badge>
                                <Badge colorScheme={active ? 'green' : 'gray'} borderRadius="lg" fontSize="xs">{active ? 'Active' : 'Inactive'}</Badge>
                                <Badge bg="whiteAlpha.100" color="gray.300" borderRadius="lg" px={2} fontSize="xs">ID #{staffId}</Badge>
                            </HStack>
                            <HStack spacing={4} mt={1}>
                                {staffMember.email && (
                                    <HStack spacing={1}><Icon as={FiMail} boxSize={3.5} color="blue.300" /><Text fontSize="xs" color="gray.400">{staffMember.email}</Text></HStack>
                                )}
                                {staffMember.phone && (
                                    <HStack spacing={1}><Icon as={FiPhone} boxSize={3.5} color="green.300" /><Text fontSize="xs" color="gray.400">{staffMember.phone}</Text></HStack>
                                )}
                            </HStack>
                        </VStack>
                    </Flex>
                </Box>

                {/* ── Tabs ── */}
                <Tabs colorScheme="purple" size="md" variant="enclosed-colored">
                    <TabList bg="gray.50" borderRadius="xl" p={1} border="1px solid" borderColor="gray.200" overflowX="auto">
                        <Tab borderRadius="lg" fontWeight="600" fontSize="sm" _selected={{ bg: 'white', color: 'green.600', shadow: 'sm' }}>
                            <HStack spacing={1.5}><Icon as={FiCalendar} boxSize={4} /><Text>Leave Management</Text></HStack>
                        </Tab>
                        <Tab borderRadius="lg" fontWeight="600" fontSize="sm" _selected={{ bg: 'white', color: 'blue.600', shadow: 'sm' }}>
                            <HStack spacing={1.5}><Icon as={FiClock} boxSize={4} /><Text>Work Schedule</Text></HStack>
                        </Tab>
                        <Tab borderRadius="lg" fontWeight="600" fontSize="sm" _selected={{ bg: 'white', color: 'teal.600', shadow: 'sm' }}>
                            <HStack spacing={1.5}><Icon as={FiCheckCircle} boxSize={4} /><Text>Attendance</Text></HStack>
                        </Tab>
                        <Tab borderRadius="lg" fontWeight="600" fontSize="sm" _selected={{ bg: 'white', color: 'purple.600', shadow: 'sm' }}>
                            <HStack spacing={1.5}><Icon as={FiUser} boxSize={4} /><Text>Overview</Text></HStack>
                        </Tab>
                    </TabList>

                    <TabPanels mt={4}>
                        {/* Leave Management */}
                        <TabPanel p={0}>
                            <VStack spacing={5} align="stretch">
                                <LeaveTypesCard />
                                <LeavePoliciesCard companyId={companyId} />
                            </VStack>
                        </TabPanel>

                        {/* Work Schedule */}
                        <TabPanel p={0}>
                            <WorkScheduleCard companyId={companyId} />
                        </TabPanel>

                        {/* Attendance */}
                        <TabPanel p={0}>
                            <AttendanceCard companyId={companyId} staffId={staffId} />
                        </TabPanel>

                        {/* Overview */}
                        <TabPanel p={0}>
                            <Card>
                                <HStack spacing={2} mb={4}>
                                    <Box p={2} bg="purple.100" borderRadius="xl"><Icon as={FiUser} boxSize={4} color="purple.600" /></Box>
                                    <Heading size="sm">Staff Overview</Heading>
                                </HStack>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    {[
                                        ['Name', name],
                                        ['Email', staffMember.email],
                                        ['Phone', staffMember.phone || '—'],
                                        ['Gender', staffMember.gender || '—'],
                                        ['Role', role],
                                        ['Status', active ? 'Active' : 'Inactive'],
                                        ['ID', `#${staffMember.id}`],
                                        ['Company ID', `#${staffMember.company_id || companyId}`],
                                    ].map(([label, value]) => (
                                        <Box key={label} p={3} bg="gray.50" borderRadius="xl">
                                            <Text fontSize="xs" color="gray.400" fontWeight="600" mb={0.5}>{label}</Text>
                                            <Text fontSize="sm" fontWeight="600" color="gray.800">{value}</Text>
                                        </Box>
                                    ))}
                                </SimpleGrid>
                            </Card>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>
        </DashboardLayout>
    );
};

export default StaffDetail;
