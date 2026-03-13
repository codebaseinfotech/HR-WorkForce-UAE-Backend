/**
 * AssignTaskModal — 2-step modal: Create task → Assign to staff
 * Step 1: POST /api/v1/tasks-admin/add-update
 * Step 2: POST /api/v1/tasks/{id}/assign
 * Props: isOpen, onClose, staffMember (pre-selected), companyStaff (list), companyId
 */
import { useState } from 'react';
import {
    Box, VStack, HStack, Heading, Button, Icon, Text, Badge, Avatar,
    Divider, Modal, ModalOverlay, ModalContent, ModalBody, ModalFooter,
    ModalCloseButton, FormControl, FormLabel, Textarea, Select, Input,
    SimpleGrid, Tag, TagLabel, TagCloseButton, useToast,
} from '@chakra-ui/react';
import {
    FiCheckCircle, FiSend, FiFlag, FiCalendar, FiTarget,
} from 'react-icons/fi';
import { useCreateAdminTaskMutation, useAssignTaskMutation } from '../../store/apiSlice';

const PRIORITY = {
    low:    { color: 'green',  label: 'Low' },
    medium: { color: 'yellow', label: 'Medium' },
    high:   { color: 'orange', label: 'High' },
    urgent: { color: 'red',    label: 'Urgent' },
};

const AssignTaskModal = ({ isOpen, onClose, staffMember, companyStaff = [], companyId }) => {
    const toast = useToast();
    const [createAdminTask, { isLoading: isCreating }] = useCreateAdminTaskMutation();
    const [assignTask, { isLoading: isAssigning }]     = useAssignTaskMutation();

    const [step, setStep]                   = useState(1);
    const [createdTaskId, setCreatedTaskId] = useState(null);
    const [selectedAssignees, setSelectedAssignees] = useState(
        staffMember ? [staffMember.id] : []
    );
    const [form, setForm] = useState({
        title: '', description: '', priority: 'medium', due_date: '',
    });

    const staffName = staffMember
        ? `${staffMember.first_name || staffMember.firstName || ''} ${staffMember.last_name || staffMember.lastName || ''}`.trim()
        : '';

    const handleChange  = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    const toggleAssignee = id =>
        setSelectedAssignees(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );

    const handleCreate = async () => {
        if (!form.title.trim()) { toast({ title: 'Title required', status: 'warning', duration: 2000 }); return; }
        try {
            const payload = {
                title: form.title,
                description: form.description,
                priority: form.priority,
                company_id: companyId,
            };
            if (form.due_date) payload.due_date = form.due_date;
            const res    = await createAdminTask(payload).unwrap();
            const taskId = res?.data?.id || res?.task?.id || res?.id;
            setCreatedTaskId(taskId);
            toast({ title: '✓ Task Created!', status: 'success', duration: 2000 });
            setStep(2);
        } catch (err) {
            toast({ title: 'Failed', description: err?.data?.message || 'Try again', status: 'error', duration: 3000 });
        }
    };

    const handleAssign = async () => {
        if (!createdTaskId) return;
        try {
            await assignTask({ taskId: createdTaskId, company_id: companyId, user_ids: selectedAssignees }).unwrap();
            toast({ title: '✓ Task Assigned!', status: 'success', duration: 2500 });
            handleClose();
        } catch (err) {
            toast({ title: 'Failed', description: err?.data?.message, status: 'error', duration: 3000 });
        }
    };

    const handleClose = () => {
        setStep(1); setCreatedTaskId(null);
        setSelectedAssignees(staffMember ? [staffMember.id] : []);
        setForm({ title: '', description: '', priority: 'medium', due_date: '' });
        onClose();
    };

    const pConf = PRIORITY[form.priority] || PRIORITY.medium;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="xl" isCentered>
            <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
            <ModalContent borderRadius="2xl" overflow="hidden" maxW="600px" mx={4}>

                {/* Purple gradient header */}
                <Box bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)" px={6} py={5}>
                    <HStack justify="space-between" align="flex-start">
                        <VStack align="start" spacing={0}>
                            <Text fontSize="2xs" color="whiteAlpha.700" fontWeight="700"
                                letterSpacing="widest" textTransform="uppercase">
                                Step {step} of 2 · {step === 1 ? 'Create Task' : 'Assign Members'}
                            </Text>
                            <Heading size="md" color="white">
                                {step === 1 ? '📋 New Task Ticket' : '👥 Assign Members'}
                            </Heading>
                        </VStack>
                        <ModalCloseButton color="white" position="relative" top="auto" right="auto"
                            _hover={{ bg: 'whiteAlpha.200' }} borderRadius="lg" onClick={handleClose} />
                    </HStack>
                    {/* Progress bar */}
                    <HStack mt={4} spacing={2}>
                        {[1, 2].map(s => (
                            <Box key={s} flex={1} h="3px" borderRadius="full"
                                bg={step >= s ? 'white' : 'whiteAlpha.300'} transition="all 0.3s" />
                        ))}
                    </HStack>
                </Box>

                <ModalBody pt={5} pb={2}>
                    {step === 1 ? (
                        /* ── Step 1: Create ── */
                        <VStack spacing={4}>
                            {staffMember && (
                                <HStack w="full" bg="purple.50" border="1px solid" borderColor="purple.200"
                                    borderRadius="xl" p={3} spacing={3}>
                                    <Avatar size="sm" name={staffName} src={staffMember.p_image_url} bg="purple.200" />
                                    <VStack align="start" spacing={0} flex={1}>
                                        <Text fontSize="sm" fontWeight="700" color="purple.800">{staffName}</Text>
                                        <Text fontSize="xs" color="purple.500">Primary assignee</Text>
                                    </VStack>
                                    <Badge colorScheme="purple" borderRadius="full" fontSize="xs">
                                        ID: {staffMember.id}
                                    </Badge>
                                </HStack>
                            )}
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="600">Task Title</FormLabel>
                                <Input name="title" value={form.title} onChange={handleChange}
                                    placeholder="e.g. Complete monthly report"
                                    borderRadius="xl" focusBorderColor="purple.500" size="lg" />
                            </FormControl>
                            <SimpleGrid columns={2} spacing={4} w="full">
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        <HStack spacing={1}>
                                            <Icon as={FiFlag} boxSize={3.5} color={`${pConf.color}.500`} />
                                            <Text>Priority</Text>
                                        </HStack>
                                    </FormLabel>
                                    <Select name="priority" value={form.priority} onChange={handleChange}
                                        borderRadius="xl" focusBorderColor="purple.500">
                                        {Object.entries(PRIORITY).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        <HStack spacing={1}>
                                            <Icon as={FiCalendar} boxSize={3.5} color="blue.400" />
                                            <Text>Due Date</Text>
                                        </HStack>
                                    </FormLabel>
                                    <Input name="due_date" type="date" value={form.due_date} onChange={handleChange}
                                        borderRadius="xl" focusBorderColor="purple.500" />
                                </FormControl>
                            </SimpleGrid>
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600">Description</FormLabel>
                                <Textarea name="description" value={form.description} onChange={handleChange}
                                    placeholder="Describe the task…" rows={3}
                                    borderRadius="xl" focusBorderColor="purple.500" resize="none" />
                            </FormControl>
                            <Box w="full" bg="gray.50" borderRadius="xl" p={3}>
                                <HStack flexWrap="wrap" gap={2}>
                                    <Icon as={FiTarget} color="gray.500" boxSize={4} />
                                    <Badge colorScheme={pConf.color} borderRadius="full" px={2}>{pConf.label} Priority</Badge>
                                    {form.due_date && (
                                        <Badge colorScheme="blue" borderRadius="full" px={2}>
                                            Due: {new Date(form.due_date).toLocaleDateString()}
                                        </Badge>
                                    )}
                                </HStack>
                            </Box>
                        </VStack>
                    ) : (
                        /* ── Step 2: Assign ── */
                        <VStack spacing={4}>
                            <HStack w="full" bg="green.50" borderRadius="xl" p={3}>
                                <Icon as={FiCheckCircle} color="green.500" boxSize={5} />
                                <VStack align="start" spacing={0}>
                                    <Text fontSize="sm" fontWeight="700" color="green.800">Task created!</Text>
                                    <Text fontSize="xs" color="green.600">
                                        Task <strong>#{createdTaskId}</strong> — &quot;{form.title}&quot;
                                    </Text>
                                </VStack>
                            </HStack>
                            <Box w="full">
                                <Text fontSize="sm" fontWeight="700" color="gray.700" mb={2}>
                                    Select assignees ({selectedAssignees.length} selected):
                                </Text>
                                <VStack spacing={2} maxH="240px" overflowY="auto" pr={1}>
                                    {companyStaff.map(s => {
                                        const sName = `${s.first_name || s.firstName || ''} ${s.last_name || s.lastName || ''}`.trim();
                                        const sel   = selectedAssignees.includes(s.id);
                                        return (
                                            <HStack key={s.id} w="full" p={3} borderRadius="xl"
                                                border="2px solid" borderColor={sel ? 'purple.400' : 'gray.200'}
                                                bg={sel ? 'purple.50' : 'white'} cursor="pointer"
                                                onClick={() => toggleAssignee(s.id)}
                                                transition="all 0.15s"
                                                _hover={{ borderColor: 'purple.300', bg: 'purple.50' }}>
                                                <Avatar size="xs" name={sName} src={s.p_image_url} />
                                                <VStack align="start" spacing={0} flex={1}>
                                                    <Text fontSize="sm" fontWeight="600">{sName}</Text>
                                                    <Text fontSize="xs" color="gray.400">{s.email}</Text>
                                                </VStack>
                                                {sel && <Icon as={FiCheckCircle} color="purple.500" boxSize={4} />}
                                            </HStack>
                                        );
                                    })}
                                </VStack>
                            </Box>
                            {selectedAssignees.length > 0 && (
                                <Box w="full" bg="purple.50" borderRadius="xl" p={3}>
                                    <HStack flexWrap="wrap" gap={2}>
                                        {selectedAssignees.map(id => {
                                            const s = companyStaff.find(m => m.id === id);
                                            if (!s) return null;
                                            const sName = `${s.first_name || s.firstName || ''} ${s.last_name || s.lastName || ''}`.trim();
                                            return (
                                                <Tag key={id} colorScheme="purple" borderRadius="full" size="sm">
                                                    <TagLabel>{sName}</TagLabel>
                                                    <TagCloseButton onClick={() => toggleAssignee(id)} />
                                                </Tag>
                                            );
                                        })}
                                    </HStack>
                                </Box>
                            )}
                        </VStack>
                    )}
                </ModalBody>

                <Divider />
                <ModalFooter gap={3}>
                    {step === 1 ? (
                        <>
                            <Button variant="outline" borderRadius="xl" onClick={handleClose}>Cancel</Button>
                            <Button bgGradient="linear(to-r, purple.500, blue.500)" color="white"
                                borderRadius="xl" isLoading={isCreating} loadingText="Creating…"
                                leftIcon={<Icon as={FiCheckCircle} />} onClick={handleCreate}
                                _hover={{ bgGradient: 'linear(to-r, purple.600, blue.600)' }}>
                                Create Task
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" borderRadius="xl" onClick={handleClose}>Skip</Button>
                            <Button bgGradient="linear(to-r, purple.500, blue.500)" color="white"
                                borderRadius="xl" isLoading={isAssigning} loadingText="Assigning…"
                                leftIcon={<Icon as={FiSend} />} isDisabled={selectedAssignees.length === 0}
                                onClick={handleAssign}
                                _hover={{ bgGradient: 'linear(to-r, purple.600, blue.600)' }}>
                                Assign Task
                            </Button>
                        </>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AssignTaskModal;
