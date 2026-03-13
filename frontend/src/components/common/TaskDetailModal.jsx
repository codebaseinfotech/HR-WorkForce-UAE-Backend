/**
 * TaskDetailModal — 3 tabs: Edit task info | Apply Action | Send Feedback
 * Props: isOpen, onClose, task, companyId
 *
 * APIs:
 *  Edit   → POST /api/v1/tasks-admin/add-update  { id, title, priority, due_date, description, company_id }
 *  Action → POST /api/v1/tasks/{id}/action        { action, note }
 *  Feedback → POST /api/v1/tasks/{id}/feedback    FormData { comment, file? }
 */
import { useState, useRef } from 'react';
import {
    Box, VStack, HStack, Heading, Button, Icon, Text, Badge,
    Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton,
    FormControl, FormLabel, Textarea, Select, Input, SimpleGrid,
    Tabs, TabList, TabPanels, Tab, TabPanel,
    useToast,
} from '@chakra-ui/react';
import {
    FiCalendar, FiPlay, FiCheckCircle, FiXCircle, FiSend,
    FiMessageSquare, FiPaperclip, FiUpload, FiRefreshCw, FiPause, FiEdit3,
} from 'react-icons/fi';
import {
    useCreateAdminTaskMutation,
    useTaskActionMutation,
    useTaskFeedbackMutation,
} from '../../store/apiSlice';

// ── Config ────────────────────────────────────────────────────────────────
const PRIORITY = {
    low:    { color: 'green',  label: 'Low' },
    medium: { color: 'yellow', label: 'Medium' },
    high:   { color: 'orange', label: 'High' },
    urgent: { color: 'red',    label: 'Urgent' },
};

const ACTIONS = [
    { value: 'start',    label: 'Start',    color: 'blue',   icon: FiPlay },
    { value: 'complete', label: 'Complete', color: 'green',  icon: FiCheckCircle },
    { value: 'block',    label: 'Block',    color: 'red',    icon: FiXCircle },
    { value: 'pause',    label: 'Pause',    color: 'orange', icon: FiPause },
    { value: 'reopen',   label: 'Reopen',  color: 'purple', icon: FiRefreshCw },
];

// ── Inner content (remounts on task change via key) ────────────────────────
const TaskDetailContent = ({ task, companyId, onClose }) => {
    const toast   = useToast();
    const fileRef = useRef();

    const [updateTask,    { isLoading: isSaving   }] = useCreateAdminTaskMutation();
    const [taskAction,    { isLoading: isActing   }] = useTaskActionMutation();
    const [taskFeedback,  { isLoading: isSending  }] = useTaskFeedbackMutation();

    // Form fields — initialized from task prop (remounts via key, so always fresh)
    const [edit, setEdit] = useState({
        title:       task.title       || '',
        description: task.description || '',
        priority:    task.priority    || 'medium',
        due_date:    task.due_date    || '',
    });

    const [action,  setAction]  = useState('start');
    const [note,    setNote]    = useState('');
    const [comment, setComment] = useState('');
    const [file,    setFile]    = useState(null);

    const p      = PRIORITY[task.priority] || PRIORITY.medium;
    const actCfg = ACTIONS.find(a => a.value === action) || ACTIONS[0];

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!edit.title.trim()) { toast({ title: 'Title is required', status: 'warning', duration: 2000 }); return; }
        try {
            await updateTask({
                id:          task.id,           // ← id present → backend updates existing task
                title:       edit.title,
                description: edit.description,
                priority:    edit.priority,
                due_date:    edit.due_date || undefined,
                company_id:  companyId || task.company_id,
            }).unwrap();
            toast({ title: '✓ Task Updated!', status: 'success', duration: 2500 });
            onClose();
        } catch (err) {
            toast({ title: 'Update failed', description: err?.data?.message || 'Try again', status: 'error', duration: 3000 });
        }
    };

    const handleAction = async () => {
        if (!note.trim()) { toast({ title: 'Note is required', status: 'warning', duration: 2000 }); return; }
        try {
            await taskAction({ taskId: task.id, action, note }).unwrap();
            toast({ title: `✓ "${action}" applied`, status: 'success', duration: 2500 });
            setNote('');
            onClose();
        } catch (err) {
            toast({ title: 'Action failed', description: err?.data?.message || 'Try again', status: 'error', duration: 3000 });
        }
    };

    const handleFeedback = async () => {
        if (!comment.trim()) { toast({ title: 'Comment is required', status: 'warning', duration: 2000 }); return; }
        try {
            await taskFeedback({ taskId: task.id, comment, file: file || undefined }).unwrap();
            toast({ title: '✓ Feedback sent!', status: 'success', duration: 2500 });
            setComment(''); setFile(null);
            if (fileRef.current) fileRef.current.value = '';
        } catch (err) {
            toast({ title: 'Feedback failed', description: err?.data?.message || 'Try again', status: 'error', duration: 3000 });
        }
    };

    // ── UI ────────────────────────────────────────────────────────────────
    return (
        <>
            {/* ── Sleek dark header ── */}
            <Box
                bg="gray.900"
                bgImage="radial-gradient(circle at 80% 20%, rgba(118,75,162,0.35) 0%, transparent 60%),radial-gradient(circle at 10% 80%, rgba(102,126,234,0.25) 0%, transparent 50%)"
                px={6} py={5}>
                <HStack justify="space-between" align="flex-start" mb={3}>
                    <HStack spacing={2} flexWrap="wrap">
                        <Badge bg="whiteAlpha.100" color="gray.300" borderRadius="lg" px={2} fontSize="xs">
                            #{task.id}
                        </Badge>
                        <Badge colorScheme={p.color} borderRadius="lg" fontSize="xs" textTransform="capitalize">
                            {p.label}
                        </Badge>
                        {task.status && (
                            <Badge colorScheme="blue" variant="subtle" borderRadius="lg" fontSize="xs" textTransform="capitalize">
                                {task.status}
                            </Badge>
                        )}
                    </HStack>
                    <ModalCloseButton color="gray.400" position="relative" top="auto" right="auto"
                        _hover={{ bg: 'whiteAlpha.100', color: 'white' }} borderRadius="lg" />
                </HStack>

                <Heading size="md" color="white" mb={1} lineHeight="1.3">{task.title}</Heading>

                {task.description && (
                    <Text fontSize="sm" color="gray.400" noOfLines={2} mt={1}>{task.description}</Text>
                )}

                <HStack mt={3} spacing={4}>
                    {task.due_date && (
                        <HStack spacing={1.5} bg="whiteAlpha.50" px={2.5} py={1} borderRadius="lg">
                            <Icon as={FiCalendar} boxSize={3.5} color="purple.300" />
                            <Text fontSize="xs" color="gray.300">
                                Due {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                        </HStack>
                    )}
                    {task.company_id && (
                        <Text fontSize="xs" color="gray.500">Company #{task.company_id}</Text>
                    )}
                </HStack>
            </Box>

            {/* ── Tabs ── */}
            <ModalBody p={0} bg="white">
                <Tabs colorScheme="purple" size="sm" isFitted>
                    <TabList borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
                        <Tab py={3.5} fontWeight="600" fontSize="sm" color="gray.500"
                            _selected={{ color: 'purple.600', borderColor: 'purple.500', bg: 'white' }}>
                            <HStack spacing={1.5}><Icon as={FiEdit3} boxSize={3.5} /><Text>Edit Details</Text></HStack>
                        </Tab>
                        <Tab py={3.5} fontWeight="600" fontSize="sm" color="gray.500"
                            _selected={{ color: 'blue.600', borderColor: 'blue.500', bg: 'white' }}>
                            <HStack spacing={1.5}><Icon as={FiPlay} boxSize={3.5} /><Text>Action</Text></HStack>
                        </Tab>
                        <Tab py={3.5} fontWeight="600" fontSize="sm" color="gray.500"
                            _selected={{ color: 'teal.600', borderColor: 'teal.500', bg: 'white' }}>
                            <HStack spacing={1.5}><Icon as={FiMessageSquare} boxSize={3.5} /><Text>Feedback</Text></HStack>
                        </Tab>
                    </TabList>

                    <TabPanels>
                        {/* ── Tab 1: Edit ── */}
                        <TabPanel p={5}>
                            <VStack spacing={4} align="stretch">
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Title</FormLabel>
                                    <Input value={edit.title} onChange={e => setEdit(v => ({ ...v, title: e.target.value }))}
                                        borderRadius="xl" focusBorderColor="purple.500"
                                        placeholder="Task title" bg="gray.50" />
                                </FormControl>

                                <SimpleGrid columns={2} spacing={4}>
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Priority</FormLabel>
                                        <Select value={edit.priority} onChange={e => setEdit(v => ({ ...v, priority: e.target.value }))}
                                            borderRadius="xl" focusBorderColor="purple.500" bg="gray.50">
                                            {Object.entries(PRIORITY).map(([k, val]) => (
                                                <option key={k} value={k}>{val.label}</option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Due Date</FormLabel>
                                        <Input type="date" value={edit.due_date}
                                            onChange={e => setEdit(v => ({ ...v, due_date: e.target.value }))}
                                            borderRadius="xl" focusBorderColor="purple.500" bg="gray.50" />
                                    </FormControl>
                                </SimpleGrid>

                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Description</FormLabel>
                                    <Textarea value={edit.description}
                                        onChange={e => setEdit(v => ({ ...v, description: e.target.value }))}
                                        placeholder="Task description…" rows={3}
                                        borderRadius="xl" focusBorderColor="purple.500" resize="none" bg="gray.50" />
                                </FormControl>

                                <Button
                                    bgGradient="linear(to-r, purple.500, indigo.500)"
                                    color="white" borderRadius="xl" fontWeight="700"
                                    isLoading={isSaving} loadingText="Saving…"
                                    leftIcon={<Icon as={FiCheckCircle} />}
                                    onClick={handleSave}
                                    _hover={{ bgGradient: 'linear(to-r, purple.600, indigo.600)', transform: 'translateY(-1px)', shadow: 'lg' }}
                                    transition="all 0.2s">
                                    Save Changes
                                </Button>
                            </VStack>
                        </TabPanel>

                        {/* ── Tab 2: Action ── */}
                        <TabPanel p={5}>
                            <VStack spacing={4} align="stretch">
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Choose Action</FormLabel>
                                    <SimpleGrid columns={3} spacing={2}>
                                        {ACTIONS.map(a => (
                                            <Button key={a.value} size="sm" borderRadius="xl"
                                                leftIcon={<Icon as={a.icon} boxSize={3.5} />}
                                                colorScheme={action === a.value ? a.color : 'gray'}
                                                variant={action === a.value ? 'solid' : 'outline'}
                                                fontWeight="600" fontSize="xs"
                                                onClick={() => setAction(a.value)}
                                                transition="all 0.15s"
                                                _hover={{ transform: 'translateY(-1px)' }}>
                                                {a.label}
                                            </Button>
                                        ))}
                                    </SimpleGrid>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Note</FormLabel>
                                    <Textarea value={note} onChange={e => setNote(e.target.value)}
                                        placeholder={`Add a note for "${action}"…`}
                                        rows={3} borderRadius="xl" focusBorderColor="blue.500"
                                        resize="none" bg="gray.50" />
                                </FormControl>

                                {/* Selected action summary pill */}
                                <HStack bg={`${actCfg.color}.50`} borderRadius="xl" px={3} py={2} spacing={2}>
                                    <Icon as={actCfg.icon} color={`${actCfg.color}.500`} boxSize={4} />
                                    <Text fontSize="xs" fontWeight="600" color={`${actCfg.color}.700`} textTransform="capitalize">
                                        Will apply &quot;{action}&quot; action to task #{task.id}
                                    </Text>
                                </HStack>

                                <Button
                                    colorScheme={actCfg.color} borderRadius="xl" fontWeight="700"
                                    isLoading={isActing} loadingText="Applying…"
                                    leftIcon={<Icon as={actCfg.icon} />}
                                    onClick={handleAction}
                                    _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}
                                    transition="all 0.2s">
                                    Apply Action
                                </Button>
                            </VStack>
                        </TabPanel>

                        {/* ── Tab 3: Feedback ── */}
                        <TabPanel p={5}>
                            <VStack spacing={4} align="stretch">
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                                        <HStack spacing={1}>
                                            <Icon as={FiMessageSquare} boxSize={3.5} color="teal.500" />
                                            <Text>Comment</Text>
                                        </HStack>
                                    </FormLabel>
                                    <Textarea value={comment} onChange={e => setComment(e.target.value)}
                                        placeholder="Write your feedback or comment…"
                                        rows={4} borderRadius="xl" focusBorderColor="teal.500"
                                        resize="none" bg="gray.50" />
                                </FormControl>

                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                                        <HStack spacing={1}>
                                            <Icon as={FiPaperclip} boxSize={3.5} color="blue.400" />
                                            <Text>Attach File <Text as="span" fontWeight="400" color="gray.400">(optional)</Text></Text>
                                        </HStack>
                                    </FormLabel>
                                    <Box
                                        border="2px dashed"
                                        borderColor={file ? 'teal.300' : 'gray.200'}
                                        borderRadius="xl" p={4} textAlign="center"
                                        cursor="pointer" bg={file ? 'teal.50' : 'gray.50'}
                                        onClick={() => fileRef.current?.click()}
                                        _hover={{ borderColor: 'teal.300', bg: 'teal.50' }}
                                        transition="all 0.2s">
                                        <input ref={fileRef} type="file" style={{ display: 'none' }}
                                            onChange={e => setFile(e.target.files[0] || null)} />
                                        <Icon as={FiUpload} boxSize={6} color={file ? 'teal.500' : 'gray.400'} mb={1} display="block" mx="auto" />
                                        <Text fontSize="sm" color={file ? 'teal.700' : 'gray.500'} fontWeight={file ? '600' : '400'}>
                                            {file ? file.name : 'Click to browse'}
                                        </Text>
                                        {file && (
                                            <Badge colorScheme="teal" borderRadius="full" mt={1} fontSize="xs">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </Badge>
                                        )}
                                    </Box>
                                </FormControl>

                                <Button
                                    colorScheme="teal" borderRadius="xl" fontWeight="700"
                                    isLoading={isSending} loadingText="Sending…"
                                    leftIcon={<Icon as={FiSend} />}
                                    onClick={handleFeedback}
                                    _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}
                                    transition="all 0.2s">
                                    Send Feedback
                                </Button>
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </ModalBody>
        </>
    );
};

// ── Wrapper: uses key={task.id} so inner content remounts with fresh state ──
const TaskDetailModal = ({ isOpen, onClose, task, companyId }) => {
    if (!task) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered scrollBehavior="inside">
            <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(10px)" />
            <ModalContent key={task.id} borderRadius="2xl" overflow="hidden" maxW="700px" mx={4} shadow="2xl">
                <TaskDetailContent task={task} companyId={companyId} onClose={onClose} />
            </ModalContent>
        </Modal>
    );
};

export default TaskDetailModal;
